/**
 * SOURCE UNIQUE des barèmes métier — Manuel backend §5.1.
 *
 * Aucune de ces valeurs ne doit être recopiée, recalculée ou affichée en dur
 * ailleurs dans le code. L'audit avait trouvé « Taux com. : 20 % » affiché sur
 * un écran et 10 % réellement appliqué sur un autre (audit §3.2) : cette classe
 * de bug est structurellement impossible tant que la valeur n'existe qu'ici.
 */

/** FCFA, versés au commercial à la création d'un compte actif. */
export const AGENT_SIGNUP_BONUS = 200;

/** FCFA, versés au commercial quand un de ses clients passe Premium. */
export const AGENT_CONVERSION_BONUS = 300;

/**
 * FCFA, seuil de retrait PAR CAGNOTTE.
 * Les gains de la semaine et les conversions différées ont chacun leur propre
 * seuil : ils ne sont jamais fusionnés (Manuel §5.1.3).
 */
export const WEEKLY_PAYOUT_THRESHOLD = 5000;

/** FCFA, versés au parrain quand son filleul passe Premium (jamais à l'inscription). */
export const REFERRAL_CONVERSION_BONUS = 300;

/** FCFA, minimum de crédit parrainage utilisable pour son propre abonnement Premium. */
export const REFERRAL_PREMIUM_REDEMPTION_MIN = 1000;

/** FCFA, minimum de crédit parrainage retirable en espèces. */
export const REFERRAL_CASH_WITHDRAWAL_MIN = 3000;

/**
 * Clôture comptable hebdomadaire : samedi 16 h, heure du Cameroun (UTC+1).
 * Les montants ayant atteint leur seuil deviennent demandables à cet instant.
 */
export const WEEKLY_CLOSING = {
  /** 6 = samedi (Date.getDay()). */
  dayOfWeek: 6,
  hour: 16,
  /** Heure à partir de laquelle le virement est demandable puis versé le jour même. */
  payoutFromHour: 18,
  timeZoneLabel: 'heure du Cameroun',
} as const;

/** Devises : le taux sert uniquement à l'affichage d'un équivalent € au fondateur. */
export const CURRENCY = {
  code: 'XAF',
  label: 'FCFA',
  /** Parité fixe XAF/EUR (franc CFA arrimé à l'euro). */
  eurPerXaf: 1 / 655.957,
} as const;

/** Moyens de paiement acceptés pour un virement sortant (Manuel §5.3). */
export const PAYOUT_METHODS = ['orange_money', 'mtn_momo'] as const;
export type PayoutMethod = (typeof PAYOUT_METHODS)[number];

export const PAYOUT_METHOD_LABELS: Record<PayoutMethod, string> = {
  orange_money: 'Orange Money',
  mtn_momo: 'MTN Mobile Money',
};

/**
 * Grille tarifaire Premium — source unique également, lue par le tunnel de
 * paiement, la landing et la comptabilité.
 */
export const PREMIUM_PLANS = [
  { id: 'monthly', label: 'Mensuel', price: 1000, note: 'Sans engagement', months: 1 },
  { id: 'half_year', label: '6 mois', price: 5000, note: 'Soit 833 F/mois', months: 6, popular: true },
  { id: 'yearly', label: 'Annuel', price: 10000, note: 'Soit 833 F/mois', months: 12, bestValue: true },
] as const;

export type PremiumPlanId = (typeof PREMIUM_PLANS)[number]['id'];
