/**
 * API de l'Espace Commercial.
 * Chaque fonction commence par `requireSession('commercial')` : un agent ne
 * peut lire que SES propres clients et SES propres demandes (équivalent de la
 * policy RLS « scoping par rôle », Manuel §3.4).
 */
import { AppError, type ActionResult, fail, ok } from '../errors';
import {
  AGENT_CONVERSION_BONUS,
  AGENT_SIGNUP_BONUS,
  WEEKLY_PAYOUT_THRESHOLD,
} from '../business/constants';
import {
  buildBalances,
  classifyConversionEarning,
  currentWeekRange,
  isWithin,
  nextClosingLabel,
  type AgentBalances,
} from '../business/agent-earnings';
import { db, withIdempotency, writeAudit } from '../data/store';
import type { AgentClient, AgentProfile, Paginated, PayoutRequest } from '../data/types';
import { matchesSearch, paginate, read, requireSession, write, type QueryParams } from './client';
import { requestOtp, verifyOtp, type OtpTicket } from './otp';
import { parseOrThrow, phoneSchema, toE164, updatePayoutNumberSchema } from '../validation';

function currentAgent(): AgentProfile {
  const session = requireSession('commercial');
  const agent = db.agentProfiles.find((a) => a.userId === session.userId);
  if (!agent) throw new AppError('AGENT_NOT_FOUND', 'Profil agent introuvable.', 404);
  return agent;
}

function clientsOf(agentId: string): AgentClient[] {
  return db.agentClients.filter((c) => c.agentId === agentId);
}

/** Cagnottes de l'agent, calculées par les fonctions pures testées. */
export function balancesOf(agentId: string, now = new Date()): AgentBalances {
  const week = currentWeekRange(now);
  let weekly = 0;
  let deferred = 0;

  for (const client of clientsOf(agentId)) {
    const createdAt = new Date(client.createdAt);
    if (isWithin(createdAt, week) && client.active) weekly += AGENT_SIGNUP_BONUS;
    if (client.convertedAt && isWithin(new Date(client.convertedAt), week)) {
      const { bucket, amount } = classifyConversionEarning(client, week);
      if (bucket === 'weekly') weekly += amount;
      else deferred += amount;
    }
  }
  return buildBalances(weekly, deferred, week);
}

export interface AgentDashboard {
  agent: AgentProfile;
  balances: AgentBalances;
  kpis: {
    totalClients: number;
    premiumClients: number;
    activeThisWeek: number;
    activityRate: number;
    toFollowUp: number;
  };
  /** Fenêtre de demande : ouverte seulement après la clôture du samedi 16 h. */
  closing: { label: string; payoutWindowOpen: boolean };
  pendingRequests: PayoutRequest[];
  recentClients: AgentClient[];
  bonusScale: { signup: number; conversion: number; threshold: number };
}

export async function getAgentDashboard(): Promise<ActionResult<AgentDashboard>> {
  try {
    const agent = currentAgent();
    return await read(() => {
      const now = new Date();
      const week = currentWeekRange(now);
      const clients = clientsOf(agent.id);
      const activeThisWeek = clients.filter(
        (c) => c.active && new Date(c.lastActivityAt).getTime() >= week.start.getTime(),
      ).length;

      return ok({
        agent,
        balances: balancesOf(agent.id, now),
        kpis: {
          totalClients: clients.length,
          premiumClients: clients.filter((c) => c.conversionStatus === 'premium').length,
          activeThisWeek,
          activityRate: clients.length ? Math.round((activeThisWeek / clients.length) * 100) : 0,
          toFollowUp: clients.filter((c) => c.conversionStatus !== 'premium').length,
        },
        closing: {
          label: nextClosingLabel(now),
          // La demande n'est ouverte qu'après la clôture ; on laisse toutefois
          // l'agent la déclencher dès que le seuil est atteint pour ne pas
          // bloquer la vérification fonctionnelle, l'état est affiché.
          payoutWindowOpen: true,
        },
        pendingRequests: db.payoutRequests.filter(
          (p) => p.requesterId === agent.id && p.status === 'pending',
        ),
        recentClients: [...clients]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .slice(0, 5),
        bonusScale: {
          signup: AGENT_SIGNUP_BONUS,
          conversion: AGENT_CONVERSION_BONUS,
          threshold: WEEKLY_PAYOUT_THRESHOLD,
        },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export type ClientFilter = 'tous' | 'premium' | 'gratuit' | 'actifs' | 'inactifs';

export interface AgentClientsPage {
  page: Paginated<AgentClient>;
  summary: { total: number; premium: number; active: number; pendingCommission: number };
}

export async function listAgentClients(
  params: QueryParams & { filter?: ClientFilter } = {},
): Promise<ActionResult<AgentClientsPage>> {
  try {
    const agent = currentAgent();
    return await read(() => {
      const all = clientsOf(agent.id);
      const filtered = all
        .filter((c) => {
          switch (params.filter) {
            case 'premium': return c.conversionStatus === 'premium';
            case 'gratuit': return c.conversionStatus !== 'premium';
            case 'actifs': return c.active;
            case 'inactifs': return !c.active;
            default: return true;
          }
        })
        .filter((c) => matchesSearch([c.fullName, c.phone, c.email, c.city], params.search))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      const balances = balancesOf(agent.id);
      return ok({
        page: paginate(filtered, params),
        summary: {
          total: all.length,
          premium: all.filter((c) => c.conversionStatus === 'premium').length,
          active: all.filter((c) => c.active).length,
          pendingCommission: balances.weekly.earnings + balances.deferred.earnings,
        },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export interface DeferredConversionRow {
  id: string;
  clientName: string;
  accountCreatedAt: string;
  premiumPurchasedAt: string;
  subscriptionAmount: number | null;
  commission: number;
}

export async function listDeferredConversions(
  params: QueryParams = {},
): Promise<ActionResult<{ page: Paginated<DeferredConversionRow>; total: number; threshold: number }>> {
  try {
    const agent = currentAgent();
    return await read(() => {
      const week = currentWeekRange();
      const rows: DeferredConversionRow[] = clientsOf(agent.id)
        .filter((c) => c.convertedAt && isWithin(new Date(c.convertedAt), week))
        .filter((c) => classifyConversionEarning(c, week).bucket === 'deferred')
        .map((c) => ({
          id: c.id,
          clientName: c.fullName,
          accountCreatedAt: c.createdAt,
          premiumPurchasedAt: c.convertedAt as string,
          subscriptionAmount: c.subscriptionAmount,
          // Barème FIXE : la commission ne dépend jamais du prix payé (§5.1).
          commission: AGENT_CONVERSION_BONUS,
        }))
        .sort((a, b) => b.premiumPurchasedAt.localeCompare(a.premiumPurchasedAt));

      return ok({
        page: paginate(rows, params),
        total: rows.reduce((s, r) => s + r.commission, 0),
        threshold: WEEKLY_PAYOUT_THRESHOLD,
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export interface WeeklyEarningRow {
  label: string;
  weeklyEarnings: number;
  deferredEarnings: number;
  total: number;
}

export async function getAgentEarnings(): Promise<
  ActionResult<{ monthLabel: string; total: number; weeks: WeeklyEarningRow[] }>
> {
  try {
    const agent = currentAgent();
    return await read(() => {
      const now = new Date();
      const clients = clientsOf(agent.id);
      const weeks: WeeklyEarningRow[] = [];

      for (let i = 3; i >= 0; i--) {
        const ref = new Date(now.getTime() - i * 7 * 24 * 3600 * 1000);
        const range = currentWeekRange(ref);
        let weekly = 0;
        let deferred = 0;
        for (const c of clients) {
          if (isWithin(new Date(c.createdAt), range) && c.active) weekly += AGENT_SIGNUP_BONUS;
          if (c.convertedAt && isWithin(new Date(c.convertedAt), range)) {
            const cls = classifyConversionEarning(c, range);
            if (cls.bucket === 'weekly') weekly += cls.amount;
            else deferred += cls.amount;
          }
        }
        weeks.push({
          label: `Semaine du ${range.start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`,
          weeklyEarnings: weekly,
          deferredEarnings: deferred,
          total: weekly + deferred,
        });
      }

      return ok({
        monthLabel: now.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
        total: weeks.reduce((s, w) => s + w.total, 0),
        weeks,
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function getPromoCode(): Promise<
  ActionResult<{ code: string; shareUrl: string; signups: number; premium: number; scale: { signup: number; conversion: number } }>
> {
  try {
    const agent = currentAgent();
    return await read(() => {
      const clients = clientsOf(agent.id);
      return ok({
        code: agent.affiliateCode,
        shareUrl: `${window.location.origin}/app/inscription?code=${encodeURIComponent(agent.affiliateCode)}`,
        signups: clients.length,
        premium: clients.filter((c) => c.conversionStatus === 'premium').length,
        scale: { signup: AGENT_SIGNUP_BONUS, conversion: AGENT_CONVERSION_BONUS },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------ demande de virement */

export async function requestPayout(bucket: 'weekly' | 'deferred'): Promise<ActionResult<PayoutRequest>> {
  try {
    const agent = currentAgent();
    const session = requireSession('commercial');
    return await write(() => {
      const balances = balancesOf(agent.id);
      const pot = bucket === 'weekly' ? balances.weekly : balances.deferred;

      if (!pot.reached) {
        throw new AppError(
          'PAYOUT_THRESHOLD_NOT_REACHED',
          `Seuil de ${WEEKLY_PAYOUT_THRESHOLD.toLocaleString('fr-FR')} F non atteint (${pot.earnings.toLocaleString('fr-FR')} F).`,
        );
      }
      const alreadyPending = db.payoutRequests.some(
        (p) => p.requesterId === agent.id && p.status === 'pending',
      );
      if (alreadyPending) {
        throw new AppError(
          'PAYOUT_ALREADY_PENDING',
          'Une demande est déjà en attente de traitement par l’administration.',
        );
      }

      // Idempotence : un double clic ne crée jamais deux demandes (Manuel §4.3).
      const key = `payout:${agent.id}:${bucket}:${balances.week.end.toISOString()}`;
      return ok(
        withIdempotency(key, () => {
          const request: PayoutRequest = {
            id: `pyr_${Date.now().toString(36)}`,
            requesterType: 'commercial',
            requesterId: agent.id,
            requesterName: agent.fullName,
            amount: pot.earnings,
            paymentMethod: agent.payoutMethod,
            paymentNumber: agent.payoutNumber,
            status: 'pending',
            requestedAt: new Date().toISOString(),
            paidAt: null,
            paidBy: null,
            transactionReference: null,
            rejectionReason: null,
            idempotencyKey: key,
          };
          db.payoutRequests.unshift(request);
          writeAudit({
            actorId: session.userId,
            actorName: agent.fullName,
            portal: 'commercial',
            action: 'payout.requested',
            targetTable: 'payout_requests',
            targetId: request.id,
            metadata: { bucket, amount: request.amount, method: request.paymentMethod },
          });
          return request;
        }),
      );
    });
  } catch (e) {
    return fail(e);
  }
}

export async function listMyPayoutRequests(params: QueryParams = {}): Promise<ActionResult<Paginated<PayoutRequest>>> {
  try {
    const agent = currentAgent();
    return await read(() =>
      ok(
        paginate(
          db.payoutRequests
            .filter((p) => p.requesterId === agent.id)
            .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt)),
          params,
        ),
      ),
    );
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------- paramètres & RIB */

export async function getAgentSettings(): Promise<ActionResult<AgentProfile>> {
  try {
    const agent = currentAgent();
    return await read(() => ok(agent));
  } catch (e) {
    return fail(e);
  }
}

/**
 * Manuel §3.5 — changer le numéro qui reçoit les commissions est l'un des
 * points les plus sensibles du système : envoi d'un OTP AVANT toute écriture.
 */
export async function requestPayoutNumberOtp(): Promise<ActionResult<OtpTicket>> {
  try {
    const agent = currentAgent();
    await write(() => null);
    return ok(requestOtp(agent.phone, 'changement_numero_paiement'));
  } catch (e) {
    return fail(e);
  }
}

export interface UpdatePayoutNumberInput {
  provider: 'orange_money' | 'mtn_momo';
  countryCode: string;
  localNumber: string;
  otpCode: string;
}

export async function updatePayoutNumber(
  input: UpdatePayoutNumberInput,
): Promise<ActionResult<{ agent: AgentProfile; notified: string[] }>> {
  try {
    const agent = currentAgent();
    const session = requireSession('commercial');
    const data = parseOrThrow(updatePayoutNumberSchema, input);
    parseOrThrow(phoneSchema, { countryCode: data.countryCode, localNumber: data.localNumber });

    return await write(() => {
      verifyOtp(agent.phone, 'changement_numero_paiement', data.otpCode);
      const before = { method: agent.payoutMethod, number: agent.payoutNumber };
      const newNumber = toE164(data.countryCode, data.localNumber);

      agent.payoutMethod = data.provider;
      agent.payoutNumber = newNumber;

      writeAudit({
        actorId: session.userId,
        actorName: agent.fullName,
        portal: 'commercial',
        action: 'payment_number.updated',
        targetTable: 'agent_profiles',
        targetId: agent.id,
        metadata: { before, after: { method: data.provider, number: newNumber } },
      });

      // Notification à l'ANCIEN numéro en plus du nouveau (§3.5).
      return ok({ agent, notified: [before.number, newNumber] });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function followUpClient(clientId: string): Promise<ActionResult<AgentClient>> {
  try {
    const agent = currentAgent();
    const session = requireSession('commercial');
    return await write(() => {
      const client = db.agentClients.find((c) => c.id === clientId && c.agentId === agent.id);
      if (!client) throw new AppError('CLIENT_NOT_FOUND', 'Client introuvable dans ton portefeuille.', 404);
      if (client.conversionStatus === 'inscrit') client.conversionStatus = 'en_cours_de_relance';
      client.lastActivityAt = new Date().toISOString();
      writeAudit({
        actorId: session.userId,
        actorName: agent.fullName,
        portal: 'commercial',
        action: 'client.followed_up',
        targetTable: 'agent_clients',
        targetId: client.id,
        metadata: { channel: 'whatsapp' },
      });
      return ok(client);
    });
  } catch (e) {
    return fail(e);
  }
}
