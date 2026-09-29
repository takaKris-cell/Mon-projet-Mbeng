/**
 * API de l'Administration.
 * Chaque fonction passe par `requireAdminSection(section, niveau)` : la
 * vérification du rôle ET de la permission granulaire précède toute donnée
 * (Manuel §3.4 et §6). Aucune écriture sensible sans ligne d'`audit_log`.
 */
import { AppError, type ActionResult, fail, ok } from '../errors';
import {
  computeAccounting,
  computeChurnRate,
  computeMonth,
  computeMonthlyBreakdown,
  toEur,
  type AccountingTotals,
  type MonthlyBreakdown,
} from '../business/accounting';
import { WEEKLY_PAYOUT_THRESHOLD } from '../business/constants';
import { currentWeekRange, isWithin } from '../business/agent-earnings';
import { db, metrics, writeAudit } from '../data/store';
import type {
  AdminAccess,
  AdminSection,
  AgentProfile,
  ApiKeyRecord,
  AuditLogEntry,
  Charge,
  MarketingCampaign,
  Paginated,
  PaymentTransaction,
  PayoutRequest,
  PermissionLevel,
  Profile,
  ReferralRedemption,
  SystemSettings,
} from '../data/types';
import {
  matchesSearch,
  paginate,
  read,
  requireAdminSection,
  requireSession,
  write,
  type QueryParams,
} from './client';
import {
  campaignSchema,
  chargeSchema,
  inviteAccessSchema,
  markPayoutPaidSchema,
  parseOrThrow,
  rejectPayoutSchema,
} from '../validation';
import { balancesOf } from './agent';

function actor() {
  const s = requireSession('admin');
  return { id: s.userId, name: s.fullName };
}

function log(action: string, section: string, targetId: string | null, metadata: Record<string, unknown> = {}) {
  const a = actor();
  writeAudit({
    actorId: a.id,
    actorName: a.name,
    portal: 'admin',
    action,
    targetTable: section,
    targetId,
    metadata,
  });
}

/* ------------------------------------------------------ vue d'ensemble */

const DAY_MS = 24 * 3600 * 1000;

/** Série de revenus journaliers dont la somme vaut exactement le revenu de la semaine. */
function dailyRevenueSeries(): { label: string; value: number }[] {
  const weights = [0.11, 0.13, 0.15, 0.12, 0.14, 0.21, 0.14];
  const total = metrics.weeklyRevenue;
  const out: { label: string; value: number }[] = [];
  let allocated = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY_MS);
    const isLast = i === 0;
    const value = isLast
      ? total - allocated
      : Math.round(total * weights[6 - i]);
    allocated += value;
    out.push({ label: d.toLocaleDateString('fr-FR', { weekday: 'short' }), value });
  }
  return out;
}

function activeUsersTrend(): { label: string; value: number }[] {
  const base = metrics.activeUsers;
  return [0.88, 0.93, 0.97, 1].map((f, i) => ({
    label: `S-${3 - i}`,
    value: Math.round(base * f),
  }));
}

export type OverviewPeriod = 'jour' | 'semaine' | 'mois';

export interface AdminOverview {
  period: OverviewPeriod;
  periodLabel: string;
  revenue: number;
  revenueEur: number;
  revenueDelta: number;
  users: { total: number; premium: number; free: number; premiumPct: number };
  premiumConversions: number;
  churn: { notRenewed: number; rate: number };
  examBookings: number;
  activeUsers: number;
  activeUsersPct: number;
  revenueByDay: { label: string; value: number }[];
  activeTrend: { label: string; value: number }[];
  levelSplit: { label: string; value: number; pct: number }[];
  network: { activeAgents: number; clientsThisWeek: number; thresholdsReached: number; toPay: number };
  month: AccountingTotals & { label: string; adBudget: number };
}

export async function getAdminOverview(period: OverviewPeriod = 'semaine'): Promise<ActionResult<AdminOverview>> {
  try {
    requireAdminSection('tableau_de_bord');
    return await read(() => {
      const byDay = dailyRevenueSeries();
      const currentMonthRow = db.ledger[db.ledger.length - 1];
      const previousMonthRow = db.ledger[db.ledger.length - 2];
      const monthTotals = computeMonth(currentMonthRow);

      const revenue =
        period === 'jour' ? byDay[byDay.length - 1].value
        : period === 'semaine' ? metrics.weeklyRevenue
        : currentMonthRow.grossRevenue;

      const previous =
        period === 'jour' ? byDay[byDay.length - 2].value
        : period === 'semaine' ? Math.round(metrics.weeklyRevenue * 0.86)
        : previousMonthRow.grossRevenue;

      const premium = db.profiles.filter((p) => p.isPremium).length;
      const students = db.profiles.filter((p) => p.role === 'eleve' || p.role === 'betreuer');
      const levelCounts = ['A1', 'A2', 'B1', 'B2', 'C1'].map((lvl) => ({
        label: lvl,
        value: students.filter((p) => p.level === lvl).length,
      }));
      const levelTotal = levelCounts.reduce((s, l) => s + l.value, 0) || 1;

      const week = currentWeekRange();
      const activeAgents = db.agentProfiles.filter((a) => a.status === 'actif');
      let thresholdsReached = 0;
      let toPay = 0;
      for (const a of activeAgents) {
        const b = balancesOf(a.id);
        if (b.weekly.reached) thresholdsReached += 1;
        toPay += b.availableForWithdrawal;
      }

      const adBudget = db.charges
        .filter((c) => c.category === 'marketing' && c.date.startsWith(currentMonthRow.month))
        .reduce((s, c) => s + c.amount, 0);

      return ok({
        period,
        periodLabel:
          period === 'jour' ? new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
          : period === 'semaine' ? `Semaine du ${week.start.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${week.end.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
          : currentMonthRow.label,
        revenue,
        revenueEur: toEur(revenue),
        revenueDelta: previous > 0 ? ((revenue - previous) / previous) * 100 : 0,
        users: {
          total: db.profiles.length,
          premium,
          free: db.profiles.length - premium,
          premiumPct: (premium / db.profiles.length) * 100,
        },
        premiumConversions: db.profiles.filter(
          (p) => p.premiumSince && isWithin(new Date(p.premiumSince), week),
        ).length,
        churn: {
          notRenewed: metrics.notRenewed,
          rate: computeChurnRate(metrics.notRenewed, metrics.expiredSubscriptions),
        },
        examBookings: metrics.examBookings,
        activeUsers: metrics.activeUsers,
        activeUsersPct: (metrics.activeUsers / db.profiles.length) * 100,
        revenueByDay: byDay,
        activeTrend: activeUsersTrend(),
        levelSplit: levelCounts.map((l) => ({ ...l, pct: (l.value / levelTotal) * 100 })),
        network: {
          activeAgents: activeAgents.length,
          clientsThisWeek: db.agentClients.filter((c) => isWithin(new Date(c.createdAt), week)).length,
          thresholdsReached,
          toPay,
        },
        month: { ...monthTotals, label: currentMonthRow.label, adBudget },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

/* --------------------------------------------------------- commerciaux */

export interface AdminAgentRow extends AgentProfile {
  clients: number;
  premium: number;
  weeklyEarnings: number;
  deferredEarnings: number;
  thresholdReached: boolean;
  available: number;
}

export interface AdminAgentsPage {
  page: Paginated<AdminAgentRow>;
  summary: { activeAgents: number; clientsGenerated: number; thresholdsReached: number; totalToPay: number };
  threshold: number;
}

export async function listAdminAgents(params: QueryParams = {}): Promise<ActionResult<AdminAgentsPage>> {
  try {
    requireAdminSection('commerciaux');
    return await read(() => {
      const rows: AdminAgentRow[] = db.agentProfiles.map((a) => {
        const clients = db.agentClients.filter((c) => c.agentId === a.id);
        const b = balancesOf(a.id);
        return {
          ...a,
          clients: clients.length,
          premium: clients.filter((c) => c.conversionStatus === 'premium').length,
          weeklyEarnings: b.weekly.earnings,
          deferredEarnings: b.deferred.earnings,
          thresholdReached: b.weekly.reached || b.deferred.reached,
          available: b.availableForWithdrawal,
        };
      });

      const filtered = rows
        .filter((a) => matchesSearch([a.fullName, a.affiliateCode, a.zone, a.phone], params.search))
        .sort((a, b) => b.available - a.available);

      return ok({
        page: paginate(filtered, params),
        summary: {
          activeAgents: rows.filter((a) => a.status === 'actif').length,
          clientsGenerated: rows.reduce((s, a) => s + a.clients, 0),
          thresholdsReached: rows.filter((a) => a.thresholdReached).length,
          totalToPay: rows.reduce((s, a) => s + a.available, 0),
        },
        threshold: WEEKLY_PAYOUT_THRESHOLD,
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function setAgentCommissionStatus(
  agentId: string,
  status: AgentProfile['commissionStatus'],
): Promise<ActionResult<AgentProfile>> {
  try {
    requireAdminSection('commerciaux', 'ecriture');
    return await write(() => {
      const agent = db.agentProfiles.find((a) => a.id === agentId);
      if (!agent) throw new AppError('AGENT_NOT_FOUND', 'Agent introuvable.', 404);
      const before = agent.commissionStatus;
      agent.commissionStatus = status;
      log('agent.commission_status_changed', 'agent_profiles', agent.id, { before, after: status });
      return ok(agent);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function setAgentStatus(agentId: string, status: AgentProfile['status']): Promise<ActionResult<AgentProfile>> {
  try {
    requireAdminSection('commerciaux', 'ecriture');
    return await write(() => {
      const agent = db.agentProfiles.find((a) => a.id === agentId);
      if (!agent) throw new AppError('AGENT_NOT_FOUND', 'Agent introuvable.', 404);
      const before = agent.status;
      agent.status = status;
      log('agent.status_changed', 'agent_profiles', agent.id, { before, after: status });
      return ok(agent);
    });
  } catch (e) {
    return fail(e);
  }
}

/* --------------------------------------------------------- utilisateurs */

export type UserFilter = 'tous' | 'premium' | 'gratuit' | 'betreuer' | 'commercial' | 'inactifs_30j';

export interface AdminUsersPage {
  page: Paginated<Profile>;
  summary: { total: number; premium: number; betreuer: number; inactive30: number };
}

export async function listAdminUsers(
  params: QueryParams & { filter?: UserFilter } = {},
): Promise<ActionResult<AdminUsersPage>> {
  try {
    requireAdminSection('utilisateurs');
    return await read(() => {
      const now = Date.now();
      const isInactive30 = (p: Profile) => now - new Date(p.lastActiveAt).getTime() > 30 * DAY_MS;

      const filtered = db.profiles
        .filter((p) => {
          switch (params.filter) {
            case 'premium': return p.isPremium;
            case 'gratuit': return !p.isPremium;
            case 'betreuer': return p.role === 'betreuer';
            case 'commercial': return p.role === 'commercial';
            case 'inactifs_30j': return isInactive30(p);
            default: return true;
          }
        })
        .filter((p) => matchesSearch([p.fullName, p.phone, p.email, p.registeredVia, p.city], params.search))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      return ok({
        page: paginate(filtered, params),
        summary: {
          total: db.profiles.length,
          premium: db.profiles.filter((p) => p.isPremium).length,
          betreuer: db.profiles.filter((p) => p.role === 'betreuer').length,
          inactive30: db.profiles.filter(isInactive30).length,
        },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export type UserAdminAction = 'suspend' | 'reactivate' | 'reset_otp' | 'anonymize' | 'call';

export async function applyUserAction(userId: string, action: UserAdminAction): Promise<ActionResult<Profile>> {
  try {
    requireAdminSection('utilisateurs', action === 'call' ? 'lecture' : 'ecriture');
    return await write(() => {
      const profile = db.profiles.find((p) => p.id === userId);
      if (!profile) throw new AppError('PROFILE_NOT_FOUND', 'Utilisateur introuvable.', 404);

      switch (action) {
        case 'suspend':
          profile.status = 'suspendu';
          break;
        case 'reactivate':
          profile.status = 'actif';
          break;
        case 'reset_otp':
          break;
        case 'anonymize':
          // Droit à l'effacement : les données personnelles disparaissent,
          // la ligne reste pour la cohérence comptable et la traçabilité.
          profile.fullName = 'Compte anonymisé';
          profile.email = `anonyme+${profile.id}@supprime.local`;
          profile.phone = '';
          profile.city = '';
          profile.status = 'anonymise';
          break;
        case 'call':
          break;
      }
      log(`user.${action}`, 'profiles', profile.id, { status: profile.status });
      return ok(profile);
    });
  } catch (e) {
    return fail(e);
  }
}

/* ---------------------------------------------------------- comptabilité */

export interface AdminAccounting {
  sinceLaunch: AccountingTotals;
  currentMonth: MonthlyBreakdown;
  history: MonthlyBreakdown[];
  eur: { gross: number; network: number; charges: number; profit: number };
}

export async function getAdminAccounting(): Promise<ActionResult<AdminAccounting>> {
  try {
    requireAdminSection('comptabilite');
    return await read(() => {
      // Un SEUL chemin de calcul : le cumul « depuis la création » est la somme
      // de toutes les périodes, jamais la valeur du dernier mois (audit §3.1).
      const sinceLaunch = computeAccounting(db.ledger);
      const history = computeMonthlyBreakdown(db.ledger);
      return ok({
        sinceLaunch,
        currentMonth: history[history.length - 1],
        history: [...history].reverse(),
        eur: {
          gross: toEur(sinceLaunch.grossRevenue),
          network: toEur(sinceLaunch.networkPayout),
          charges: toEur(sinceLaunch.charges),
          profit: toEur(sinceLaunch.netProfit),
        },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------ paiements : virements sortants */

export type PayoutFilter = 'pending' | 'paid' | 'rejected' | 'tous';

export interface AdminPayoutsPage {
  page: Paginated<PayoutRequest>;
  summary: { pendingCount: number; pendingAmount: number; paidThisMonth: number; rejectedCount: number };
}

export async function listPayoutRequests(
  params: QueryParams & { filter?: PayoutFilter } = {},
): Promise<ActionResult<AdminPayoutsPage>> {
  try {
    requireAdminSection('paiements');
    return await read(() => {
      const all = db.payoutRequests;
      const monthPrefix = new Date().toISOString().slice(0, 7);
      const filtered = all
        .filter((p) => (params.filter && params.filter !== 'tous' ? p.status === params.filter : true))
        .filter((p) => matchesSearch([p.requesterName, p.paymentNumber, p.transactionReference], params.search))
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));

      return ok({
        page: paginate(filtered, params),
        summary: {
          pendingCount: all.filter((p) => p.status === 'pending').length,
          // Calculé en temps réel, jamais mis en cache (Manuel §5.3.4).
          pendingAmount: all.filter((p) => p.status === 'pending').reduce((s, p) => s + p.amount, 0),
          paidThisMonth: all
            .filter((p) => p.status === 'paid' && (p.paidAt ?? '').startsWith(monthPrefix))
            .reduce((s, p) => s + p.amount, 0),
          rejectedCount: all.filter((p) => p.status === 'rejected').length,
        },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function markPayoutPaid(
  payoutId: string,
  transactionReference: string,
): Promise<ActionResult<PayoutRequest>> {
  try {
    requireAdminSection('paiements', 'ecriture');
    const a = actor();
    const data = parseOrThrow(markPayoutPaidSchema, { payoutId, transactionReference });
    return await write(() => {
      const request = db.payoutRequests.find((p) => p.id === data.payoutId);
      if (!request) throw new AppError('PAYOUT_NOT_FOUND', 'Demande introuvable.', 404);
      if (request.status !== 'pending') {
        throw new AppError('PAYOUT_ALREADY_PROCESSED', 'Cette demande a déjà été traitée.');
      }
      const before = request.status;
      request.status = 'paid';
      request.paidAt = new Date().toISOString();
      request.paidBy = a.id;
      request.transactionReference = data.transactionReference;
      log('payout.marked_paid', 'payout_requests', request.id, {
        from: before,
        to: 'paid',
        reference: data.transactionReference,
        amount: request.amount,
      });
      return ok(request);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function rejectPayout(payoutId: string, rejectionReason: string): Promise<ActionResult<PayoutRequest>> {
  try {
    requireAdminSection('paiements', 'ecriture');
    const data = parseOrThrow(rejectPayoutSchema, { payoutId, rejectionReason });
    const a = actor();
    return await write(() => {
      const request = db.payoutRequests.find((p) => p.id === data.payoutId);
      if (!request) throw new AppError('PAYOUT_NOT_FOUND', 'Demande introuvable.', 404);
      if (request.status !== 'pending') {
        throw new AppError('PAYOUT_ALREADY_PROCESSED', 'Cette demande a déjà été traitée.');
      }
      request.status = 'rejected';
      request.rejectionReason = data.rejectionReason;
      request.paidBy = a.id;
      // Le solde du demandeur reste intact : il peut refaire une demande (§5.3.2).
      log('payout.rejected', 'payout_requests', request.id, {
        from: 'pending',
        to: 'rejected',
        reason: data.rejectionReason,
      });
      return ok(request);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function listReferralRedemptions(
  params: QueryParams = {},
): Promise<ActionResult<{ page: Paginated<ReferralRedemption>; totalCredits: number; totalCash: number }>> {
  try {
    requireAdminSection('paiements');
    return await read(() => {
      const rows = [...db.referralRedemptions].sort((a, b) => b.date.localeCompare(a.date));
      return ok({
        page: paginate(rows, params),
        totalCredits: rows.reduce((s, r) => s + r.creditsUsed, 0),
        totalCash: rows.reduce((s, r) => s + r.cashTopUp, 0),
      });
    });
  } catch (e) {
    return fail(e);
  }
}

/* --------------------------------------- paiements : encaissements élèves */

export interface IncomingPaymentsPage {
  page: Paginated<PaymentTransaction>;
  summary: { received: number; pending: number; failed: number; total: number };
}

export async function listIncomingPayments(
  params: QueryParams & { filter?: PaymentTransaction['status'] | 'tous' } = {},
): Promise<ActionResult<IncomingPaymentsPage>> {
  try {
    requireAdminSection('paiements');
    return await read(() => {
      const all = db.paymentTransactions;
      const filtered = all
        .filter((t) => (params.filter && params.filter !== 'tous' ? t.status === params.filter : true))
        .filter((t) => matchesSearch([t.userName, t.transactionRef, t.product], params.search));
      return ok({
        page: paginate(filtered, params),
        summary: {
          received: all.filter((t) => t.status === 'recu').reduce((s, t) => s + t.amount, 0),
          pending: all.filter((t) => t.status === 'en_attente').length,
          failed: all.filter((t) => t.status === 'echoue').length,
          total: all.length,
        },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function exportIncomingPaymentsCsv(): Promise<ActionResult<{ filename: string; content: string }>> {
  try {
    requireAdminSection('paiements');
    return await read(() => {
      const header = 'reference;eleve;produit;moyen;date;montant;devise;statut';
      const lines = db.paymentTransactions.map((t) =>
        [t.transactionRef, t.userName, t.product, t.provider, t.createdAt, t.amount, t.currency, t.status].join(';'),
      );
      log('payments.exported', 'payment_transactions', null, { rows: lines.length });
      return ok({
        filename: `encaissements-${new Date().toISOString().slice(0, 10)}.csv`,
        content: [header, ...lines].join('\n'),
      });
    });
  } catch (e) {
    return fail(e);
  }
}

/* Le contenu pédagogique (CMS) vit désormais dans lib/api/content.ts, avec son
   flux brouillon → aperçu → confirmation → publication. */

/* ----------------------------------------------------------- marketing */

export interface MarketingPage {
  page: Paginated<MarketingCampaign>;
  kpis: { budget: number; clicks: number; signups: number; costPerSignup: number };
}

export async function listCampaigns(params: QueryParams = {}): Promise<ActionResult<MarketingPage>> {
  try {
    requireAdminSection('marketing');
    return await read(() => {
      const all = db.marketingCampaigns;
      const budget = all.reduce((s, c) => s + c.budget, 0);
      const signups = all.reduce((s, c) => s + c.signups, 0);
      return ok({
        page: paginate(
          all.filter((c) => matchesSearch([c.name, c.platform], params.search)),
          params,
        ),
        kpis: {
          budget,
          clicks: all.reduce((s, c) => s + c.clicks, 0),
          signups,
          costPerSignup: signups ? Math.round(budget / signups) : 0,
        },
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function createCampaign(input: unknown): Promise<ActionResult<MarketingCampaign>> {
  try {
    requireAdminSection('marketing', 'ecriture');
    const data = parseOrThrow(campaignSchema, input);
    return await write(() => {
      const row: MarketingCampaign = {
        id: `cmp_${Date.now().toString(36)}`,
        ...data,
        clicks: 0,
        signups: 0,
        costPerSignup: 0,
        status: 'en_cours',
      };
      db.marketingCampaigns.unshift(row);
      log('campaign.created', 'marketing_campaigns', row.id, { name: row.name, budget: row.budget });
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function updateCampaign(id: string, patch: Partial<MarketingCampaign>): Promise<ActionResult<MarketingCampaign>> {
  try {
    requireAdminSection('marketing', 'ecriture');
    return await write(() => {
      const row = db.marketingCampaigns.find((c) => c.id === id);
      if (!row) throw new AppError('CAMPAIGN_NOT_FOUND', 'Campagne introuvable.', 404);
      Object.assign(row, patch);
      log('campaign.updated', 'marketing_campaigns', row.id, patch as Record<string, unknown>);
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCampaign(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    requireAdminSection('marketing', 'ecriture');
    return await write(() => {
      const index = db.marketingCampaigns.findIndex((c) => c.id === id);
      if (index < 0) throw new AppError('CAMPAIGN_NOT_FOUND', 'Campagne introuvable.', 404);
      db.marketingCampaigns.splice(index, 1);
      log('campaign.deleted', 'marketing_campaigns', id);
      return ok({ id });
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------- charges */

export interface ChargesPage {
  page: Paginated<Charge>;
  monthTotal: number;
  monthLabel: string;
  byCategory: { label: string; amount: number }[];
}

export async function listCharges(params: QueryParams & { month?: string } = {}): Promise<ActionResult<ChargesPage>> {
  try {
    requireAdminSection('charges');
    return await read(() => {
      const month = params.month ?? db.ledger[db.ledger.length - 1].month;
      const monthRows = db.charges.filter((c) => c.date.startsWith(month));
      const filtered = monthRows
        .filter((c) => matchesSearch([c.label, c.category], params.search))
        .sort((a, b) => b.date.localeCompare(a.date));

      const categories = new Map<string, number>();
      for (const c of monthRows) categories.set(c.category, (categories.get(c.category) ?? 0) + c.amount);

      return ok({
        page: paginate(filtered, params),
        monthTotal: monthRows.reduce((s, c) => s + c.amount, 0),
        monthLabel: db.ledger.find((l) => l.month === month)?.label ?? month,
        byCategory: [...categories.entries()].map(([label, amount]) => ({ label, amount })),
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function createCharge(input: unknown): Promise<ActionResult<Charge>> {
  try {
    requireAdminSection('charges', 'ecriture');
    const data = parseOrThrow(chargeSchema, input);
    return await write(() => {
      const row: Charge = { id: `chg_${Date.now().toString(36)}`, ...data, createdBy: actor().name };
      db.charges.unshift(row);
      // La charge alimente immédiatement le grand livre du mois concerné.
      const month = data.date.slice(0, 7);
      const ledgerRow = db.ledger.find((l) => l.month === month);
      if (ledgerRow) ledgerRow.charges += data.amount;
      log('charge.created', 'charges', row.id, { label: row.label, amount: row.amount });
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function updateCharge(id: string, patch: { label?: string; amount?: number }): Promise<ActionResult<Charge>> {
  try {
    requireAdminSection('charges', 'ecriture');
    return await write(() => {
      const row = db.charges.find((c) => c.id === id);
      if (!row) throw new AppError('CHARGE_NOT_FOUND', 'Charge introuvable.', 404);
      const before = { label: row.label, amount: row.amount };
      if (typeof patch.amount === 'number') {
        const ledgerRow = db.ledger.find((l) => l.month === row.date.slice(0, 7));
        if (ledgerRow) ledgerRow.charges += patch.amount - row.amount;
        row.amount = patch.amount;
      }
      if (patch.label) row.label = patch.label;
      log('charge.updated', 'charges', row.id, { before, after: { label: row.label, amount: row.amount } });
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCharge(id: string): Promise<ActionResult<{ id: string }>> {
  try {
    requireAdminSection('charges', 'ecriture');
    return await write(() => {
      const index = db.charges.findIndex((c) => c.id === id);
      if (index < 0) throw new AppError('CHARGE_NOT_FOUND', 'Charge introuvable.', 404);
      const [removed] = db.charges.splice(index, 1);
      const ledgerRow = db.ledger.find((l) => l.month === removed.date.slice(0, 7));
      if (ledgerRow) ledgerRow.charges -= removed.amount;
      log('charge.deleted', 'charges', id, { label: removed.label, amount: removed.amount });
      return ok({ id });
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------- accès & rôles */

export async function listAccesses(): Promise<ActionResult<AdminAccess[]>> {
  try {
    requireAdminSection('acces_roles');
    return await read(() => ok([...db.adminAccesses]));
  } catch (e) {
    return fail(e);
  }
}

export async function inviteAccess(input: {
  fullName: string;
  email: string;
  roleLabel: string;
  permissions: Partial<Record<AdminSection, PermissionLevel>>;
}): Promise<ActionResult<AdminAccess>> {
  try {
    requireAdminSection('acces_roles', 'ecriture');
    const data = parseOrThrow(inviteAccessSchema, input);
    return await write(() => {
      const financial: AdminSection[] = ['comptabilite', 'paiements', 'commerciaux', 'charges'];
      const touchesFinance = financial.some(
        (s) => (input.permissions[s] ?? 'aucun') !== 'aucun',
      );
      const row: AdminAccess = {
        id: `acc_${Date.now().toString(36)}`,
        userId: `usr_inv_${Date.now().toString(36)}`,
        fullName: data.fullName,
        email: data.email,
        roleLabel: data.roleLabel,
        permissions: input.permissions,
        // Manuel §3.3 : la 2FA n'est pas une option pour un accès financier.
        requires2fa: touchesFinance,
        twoFactorActive: false,
        // Un accès `invited` n'a aucune capacité tant qu'il n'est pas `active` (§6).
        status: 'invited',
        grantedBy: actor().name,
        grantedAt: new Date().toISOString(),
      };
      db.adminAccesses.push(row);
      log('access.invited', 'admin_permissions', row.id, {
        email: row.email,
        permissions: row.permissions,
        requires2fa: row.requires2fa,
      });
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function updateAccess(
  id: string,
  patch: { permissions?: Partial<Record<AdminSection, PermissionLevel>>; roleLabel?: string; status?: AdminAccess['status'] },
): Promise<ActionResult<AdminAccess>> {
  try {
    requireAdminSection('acces_roles', 'ecriture');
    return await write(() => {
      const row = db.adminAccesses.find((a) => a.id === id);
      if (!row) throw new AppError('ACCESS_NOT_FOUND', 'Accès introuvable.', 404);
      if (row.roleLabel === 'Root / Owner' && patch.status === 'revoked') {
        throw new AppError('CANNOT_REVOKE_OWNER', "L'accès Super-Admin ne peut pas être révoqué ici.", 403);
      }
      const before = { permissions: { ...row.permissions }, status: row.status };
      Object.assign(row, patch);
      const financial: AdminSection[] = ['comptabilite', 'paiements', 'commerciaux', 'charges'];
      row.requires2fa = financial.some((s) => (row.permissions[s] ?? 'aucun') !== 'aucun');
      log('access.updated', 'admin_permissions', row.id, { before, after: { permissions: row.permissions, status: row.status } });
      return ok(row);
    });
  } catch (e) {
    return fail(e);
  }
}

/* ---------------------------------------------------------- paramètres */

export async function getSettings(): Promise<ActionResult<{ settings: SystemSettings; apiKeys: ApiKeyRecord[] }>> {
  try {
    requireAdminSection('parametres');
    return await read(() => ok({ settings: { ...db.settings }, apiKeys: [...db.apiKeys] }));
  } catch (e) {
    return fail(e);
  }
}

export async function updateSettings(patch: Partial<SystemSettings>): Promise<ActionResult<SystemSettings>> {
  try {
    requireAdminSection('parametres', 'ecriture');
    return await write(() => {
      const before = { ...db.settings };
      Object.assign(db.settings, patch);
      if (patch.require2faForFinance !== undefined) {
        log('security.2fa_policy_changed', 'settings', null, { before: before.require2faForFinance, after: patch.require2faForFinance });
      }
      log('settings.updated', 'settings', null, { keys: Object.keys(patch) });
      return ok({ ...db.settings });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function rotateApiKey(id: string): Promise<ActionResult<ApiKeyRecord>> {
  try {
    requireAdminSection('parametres', 'ecriture');
    return await write(() => {
      const key = db.apiKeys.find((k) => k.id === id);
      if (!key) throw new AppError('API_KEY_NOT_FOUND', 'Clé introuvable.', 404);
      if (key.status === 'revoked') throw new AppError('API_KEY_REVOKED', 'Cette clé est révoquée.', 400);
      key.lastRotatedAt = new Date().toISOString();
      key.maskedKey = `${key.maskedKey.split('•')[0]}••••••${Math.random().toString(36).slice(2, 6)}`;
      log('api_key.rotated', 'api_keys', key.id, { label: key.label });
      return ok(key);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function revokeApiKey(id: string): Promise<ActionResult<ApiKeyRecord>> {
  try {
    requireAdminSection('parametres', 'ecriture');
    return await write(() => {
      const key = db.apiKeys.find((k) => k.id === id);
      if (!key) throw new AppError('API_KEY_NOT_FOUND', 'Clé introuvable.', 404);
      key.status = 'revoked';
      log('api_key.revoked', 'api_keys', key.id, { label: key.label });
      return ok(key);
    });
  } catch (e) {
    return fail(e);
  }
}

/* ----------------------------------------------------------- audit_log */

export async function listAuditLog(params: QueryParams = {}): Promise<ActionResult<Paginated<AuditLogEntry>>> {
  try {
    requireAdminSection('parametres');
    return await read(() =>
      ok(
        paginate(
          db.auditLog.filter((a) => matchesSearch([a.action, a.actorName, a.targetTable], params.search)),
          params,
        ),
      ),
    );
  } catch (e) {
    return fail(e);
  }
}
