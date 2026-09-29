/**
 * API du Portail Utilisateur (élève).
 * Policy « propriétaire uniquement » : un élève ne lit et ne modifie que ses
 * propres lignes (Manuel §3.4).
 */
import { AppError, type ActionResult, fail, ok } from '../errors';
import {
  PREMIUM_PLANS,
  REFERRAL_CASH_WITHDRAWAL_MIN,
  REFERRAL_CONVERSION_BONUS,
  REFERRAL_PREMIUM_REDEMPTION_MIN,
  type PremiumPlanId,
} from '../business/constants';
import { db, withIdempotency, writeAudit } from '../data/store';
import type { ContentResource, Paginated, PaymentTransaction, PayoutRequest, Profile } from '../data/types';
import { matchesSearch, paginate, read, requireSession, write, type QueryParams } from './client';
import { requestOtp, verifyOtp, type OtpTicket } from './otp';
import { otpCodeSchema, parseOrThrow, phoneSchema, toE164 } from '../validation';
import { sampleAudios, sampleBetreuers, sampleWordsOfDay, type BetreuerRecord } from '../../data/content';

function currentProfile(): Profile {
  const session = requireSession('user');
  const profile = db.profiles.find((p) => p.id === session.userId);
  if (!profile) throw new AppError('PROFILE_NOT_FOUND', 'Compte introuvable.', 404);
  return profile;
}

export async function getProfile(): Promise<ActionResult<Profile>> {
  try {
    const profile = currentProfile();
    return await read(() => ok(profile));
  } catch (e) {
    return fail(e);
  }
}

export interface UserHome {
  profile: Profile;
  resume: { title: string; subtitle: string; progress: number } | null;
  wordsCount: number;
  grammarRule: string;
  continueListening: typeof sampleAudios;
  unreadMessages: number;
}

export async function getUserHome(): Promise<ActionResult<UserHome>> {
  try {
    const profile = currentProfile();
    return await read(() => {
      const modelltest = db.contentResources.find(
        (c) => c.type === 'modelltest' && c.status === 'publie' && c.level === profile.level,
      ) ?? db.contentResources.find((c) => c.type === 'modelltest' && c.status === 'publie');
      return ok({
        profile,
        resume: modelltest
          ? { title: modelltest.title, subtitle: `${modelltest.level} · Lesen · Hören en cours`, progress: 62 }
          : null,
        wordsCount: sampleWordsOfDay.length * 2,
        grammarRule: 'Le prétérit des verbes faibles',
        continueListening: sampleAudios,
        unreadMessages: 2,
      });
    });
  } catch (e) {
    return fail(e);
  }
}

export async function listLibrary(
  params: QueryParams & { level?: string; type?: string } = {},
): Promise<ActionResult<Paginated<ContentResource>>> {
  try {
    currentProfile();
    return await read(() =>
      ok(
        paginate(
          db.contentResources
            // La Bibliothèque affiche la section « bibliotheque » ET les examens
            // blancs, exactement comme l'onglet de l'application.
            .filter((c) => c.section === 'bibliotheque' || c.section === 'examens')
            .filter((c) => c.status === 'publie')
            .filter((c) => (params.level && params.level !== 'tous' ? c.level === params.level : true))
            .filter((c) => (params.type && params.type !== 'tous' ? c.type === params.type : true))
            .filter((c) => matchesSearch([c.title, c.subtitle, c.section], params.search))
            .sort((a, b) => a.position - b.position),
          { ...params, pageSize: params.pageSize ?? 8 },
        ),
      ),
    );
  } catch (e) {
    return fail(e);
  }
}

export interface BetreuerFilters {
  search?: string;
  availableThisWeek?: boolean;
  format?: 'tous' | 'presentiel' | 'en_ligne' | 'les_deux';
  level?: string;
  /** Filtre « Horaires », promis par l'écran et absent du live (audit §4). */
  timeSlot?: 'tous' | 'matin' | 'apres_midi' | 'soir' | 'weekend';
  /** Filtre « Diplôme », promis par l'écran et absent du live (audit §4). */
  diploma?: 'tous' | 'goethe' | 'telc' | 'osd' | 'ecl' | 'universitaire';
  maxRate?: number;
  sort?: 'note' | 'prix_croissant' | 'prix_decroissant';
}

export async function listBetreuers(filters: BetreuerFilters = {}): Promise<ActionResult<BetreuerRecord[]>> {
  try {
    currentProfile();
    return await read(() => {
      let rows = sampleBetreuers.filter((b) => {
        if (filters.availableThisWeek && !b.availableThisWeek) return false;
        if (filters.format && filters.format !== 'tous' && b.format !== filters.format) return false;
        if (filters.level && filters.level !== 'tous' && !b.levelTaught.some((l) => l.startsWith(filters.level!))) return false;
        if (filters.timeSlot && filters.timeSlot !== 'tous' && !b.timeSlots.includes(filters.timeSlot)) return false;
        if (filters.diploma && filters.diploma !== 'tous' && b.diplomaType !== filters.diploma) return false;
        if (filters.maxRate && b.hourlyRate > filters.maxRate) return false;
        return matchesSearch([b.name, b.title, b.city, b.diploma], filters.search);
      });
      if (filters.sort === 'prix_croissant') rows = [...rows].sort((a, b) => a.hourlyRate - b.hourlyRate);
      else if (filters.sort === 'prix_decroissant') rows = [...rows].sort((a, b) => b.hourlyRate - a.hourlyRate);
      else rows = [...rows].sort((a, b) => b.rating - a.rating);
      return ok(rows);
    });
  } catch (e) {
    return fail(e);
  }
}

/* --------------------------------------------------------- parrainage */

export interface ReferralState {
  code: string;
  shareUrl: string;
  credits: number;
  referredCount: number;
  premiumCount: number;
  thresholds: { premiumRedemption: number; cashWithdrawal: number };
  bonusPerConversion: number;
  canRedeemForPremium: boolean;
  canWithdrawCash: boolean;
  pendingPayout: PayoutRequest | null;
  recent: { name: string; date: string; status: 'premium' | 'inscrit'; amount: number }[];
}

export async function getReferralState(): Promise<ActionResult<ReferralState>> {
  try {
    const profile = currentProfile();
    return await read(() => {
      const referred = db.profiles.filter((p) => p.registeredVia === profile.referralCode);
      const premium = referred.filter((p) => p.isPremium);
      return ok({
        code: profile.referralCode,
        shareUrl: `${window.location.origin}/app/inscription?code=${encodeURIComponent(profile.referralCode)}`,
        credits: profile.referralCredits,
        referredCount: Math.max(referred.length, profile.referralCount),
        premiumCount: premium.length,
        thresholds: {
          premiumRedemption: REFERRAL_PREMIUM_REDEMPTION_MIN,
          cashWithdrawal: REFERRAL_CASH_WITHDRAWAL_MIN,
        },
        bonusPerConversion: REFERRAL_CONVERSION_BONUS,
        canRedeemForPremium: profile.referralCredits >= REFERRAL_PREMIUM_REDEMPTION_MIN && !profile.isPremium,
        canWithdrawCash: profile.referralCredits >= REFERRAL_CASH_WITHDRAWAL_MIN,
        pendingPayout:
          db.payoutRequests.find((p) => p.requesterId === profile.id && p.status === 'pending') ?? null,
        recent: referred.slice(0, 8).map((p) => ({
          name: p.fullName,
          date: p.createdAt,
          status: p.isPremium ? ('premium' as const) : ('inscrit' as const),
          amount: p.isPremium ? REFERRAL_CONVERSION_BONUS : 0,
        })),
      });
    });
  } catch (e) {
    return fail(e);
  }
}

/**
 * §5.2 — un crédit utilisé pour son propre Premium n'est JAMAIS compté dans le
 * revenu brut ni dans la file des paiements sortants : c'est une réduction de
 * solde interne, suivie à part.
 */
export async function redeemCreditsForPremium(planId: PremiumPlanId): Promise<ActionResult<Profile>> {
  try {
    const profile = currentProfile();
    const session = requireSession('user');
    const plan = PREMIUM_PLANS.find((p) => p.id === planId);
    if (!plan) throw new AppError('PLAN_NOT_FOUND', 'Formule inconnue.', 404);

    return await write(() => {
      if (profile.referralCredits < REFERRAL_PREMIUM_REDEMPTION_MIN) {
        throw new AppError(
          'REFERRAL_REDEMPTION_MIN_NOT_REACHED',
          `Il faut au moins ${REFERRAL_PREMIUM_REDEMPTION_MIN.toLocaleString('fr-FR')} F de crédits pour payer ton Premium.`,
        );
      }
      const used = Math.min(profile.referralCredits, plan.price);
      profile.referralCredits -= used;
      if (used >= plan.price) {
        profile.isPremium = true;
        profile.premiumSince = new Date().toISOString();
        profile.subscription = plan.id === 'monthly' ? 'mensuel' : plan.id === 'half_year' ? 'semestriel' : 'annuel';
      }
      db.referralRedemptions.unshift({
        id: `rrd_${Date.now().toString(36)}`,
        userId: profile.id,
        userName: profile.fullName,
        date: new Date().toISOString(),
        creditsUsed: used,
        cashTopUp: Math.max(0, plan.price - used),
        plan: plan.label,
      });
      writeAudit({
        actorId: session.userId,
        actorName: profile.fullName,
        portal: 'user',
        action: 'referral.redeemed_for_premium',
        targetTable: 'referral_credits',
        targetId: profile.id,
        metadata: { creditsUsed: used, plan: plan.label },
      });
      return ok(profile);
    });
  } catch (e) {
    return fail(e);
  }
}

/** §5.2 — le retrait en espèces suit exactement le même circuit que les commerciaux. */
export async function requestReferralCashPayout(
  method: 'orange_money' | 'mtn_momo',
): Promise<ActionResult<PayoutRequest>> {
  try {
    const profile = currentProfile();
    const session = requireSession('user');
    return await write(() => {
      if (profile.referralCredits < REFERRAL_CASH_WITHDRAWAL_MIN) {
        throw new AppError(
          'REFERRAL_WITHDRAWAL_MIN_NOT_REACHED',
          `Retrait possible à partir de ${REFERRAL_CASH_WITHDRAWAL_MIN.toLocaleString('fr-FR')} F de crédits.`,
        );
      }
      if (db.payoutRequests.some((p) => p.requesterId === profile.id && p.status === 'pending')) {
        throw new AppError('PAYOUT_ALREADY_PENDING', 'Une demande est déjà en attente de traitement.');
      }
      const key = `referral-payout:${profile.id}:${new Date().toISOString().slice(0, 13)}`;
      return ok(
        withIdempotency(key, () => {
          const request: PayoutRequest = {
            id: `pyr_${Date.now().toString(36)}`,
            requesterType: 'parrainage',
            requesterId: profile.id,
            requesterName: profile.fullName,
            amount: profile.referralCredits,
            paymentMethod: method,
            paymentNumber: profile.phone,
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
            actorName: profile.fullName,
            portal: 'user',
            action: 'payout.requested',
            targetTable: 'payout_requests',
            targetId: request.id,
            metadata: { type: 'parrainage', amount: request.amount },
          });
          return request;
        }),
      );
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------- compte */

export async function requestPhoneChangeOtp(
  countryCode: string,
  localNumber: string,
): Promise<ActionResult<{ ticket: OtpTicket; phone: string }>> {
  try {
    const profile = currentProfile();
    parseOrThrow(phoneSchema, { countryCode, localNumber });
    const phone = toE164(countryCode, localNumber);
    if (phone === profile.phone) {
      throw new AppError('SAME_PHONE_NUMBER', "C'est déjà ton numéro actuel.");
    }
    await write(() => null);
    return ok({ ticket: requestOtp(phone, 'changement_telephone'), phone });
  } catch (e) {
    return fail(e);
  }
}

export async function confirmPhoneChange(phone: string, code: string): Promise<ActionResult<Profile>> {
  try {
    const profile = currentProfile();
    const session = requireSession('user');
    parseOrThrow(otpCodeSchema, code, 'OTP_FORMAT');
    return await write(() => {
      verifyOtp(phone, 'changement_telephone', code);
      const before = profile.phone;
      profile.phone = phone;
      writeAudit({
        actorId: session.userId,
        actorName: profile.fullName,
        portal: 'user',
        action: 'phone_number.updated',
        targetTable: 'profiles',
        targetId: profile.id,
        metadata: { before, after: phone },
      });
      return ok(profile);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function updateProfile(patch: { fullName?: string; city?: string; level?: Profile['level'] }): Promise<ActionResult<Profile>> {
  try {
    const profile = currentProfile();
    return await write(() => {
      Object.assign(profile, patch);
      return ok(profile);
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------ paiement */

export type PaymentOutcome = 'success' | 'insufficient' | 'failed' | 'timeout';

export interface PaymentInput {
  planId: PremiumPlanId;
  provider: PaymentTransaction['provider'];
  account: string;
  /** Réservé aux outils de développement : force un état d'échec (jamais exposé en production). */
  forceOutcome?: PaymentOutcome;
}

export interface PaymentResult {
  outcome: PaymentOutcome;
  transaction: PaymentTransaction;
  profile: Profile;
}

export async function payPremium(input: PaymentInput): Promise<ActionResult<PaymentResult>> {
  try {
    const profile = currentProfile();
    const session = requireSession('user');
    const plan = PREMIUM_PLANS.find((p) => p.id === input.planId);
    if (!plan) throw new AppError('PLAN_NOT_FOUND', 'Formule inconnue.', 404);
    if (!input.account.trim()) {
      throw new AppError('PAYMENT_ACCOUNT_REQUIRED', 'Renseigne le compte à débiter.');
    }

    return await write(() => {
      const outcome: PaymentOutcome = input.forceOutcome ?? 'success';
      const key = `pay:${profile.id}:${plan.id}:${Date.now()}`;
      const transaction = withIdempotency(key, () => {
        const tx: PaymentTransaction = {
          id: `tx_${Date.now().toString(36)}`,
          transactionRef: `TX-${Math.floor(10000 + Math.random() * 89999)}`,
          userId: profile.id,
          userName: profile.fullName,
          amount: plan.price,
          currency: 'FCFA',
          provider: input.provider,
          createdAt: new Date().toISOString(),
          status: outcome === 'success' ? 'recu' : outcome === 'timeout' ? 'en_attente' : 'echoue',
          product: `Premium ${plan.label}`,
          idempotencyKey: key,
        };
        db.paymentTransactions.unshift(tx);
        return tx;
      });

      if (outcome === 'success') {
        profile.isPremium = true;
        profile.premiumSince = new Date().toISOString();
        profile.subscription = plan.id === 'monthly' ? 'mensuel' : plan.id === 'half_year' ? 'semestriel' : 'annuel';
        const ledgerRow = db.ledger[db.ledger.length - 1];
        ledgerRow.grossRevenue += plan.price;
        writeAudit({
          actorId: session.userId,
          actorName: profile.fullName,
          portal: 'user',
          action: 'payment.received',
          targetTable: 'payment_transactions',
          targetId: transaction.id,
          metadata: { amount: plan.price, provider: input.provider },
        });
      }

      return ok({ outcome, transaction, profile });
    });
  } catch (e) {
    return fail(e);
  }
}

export { PREMIUM_PLANS };
