/**
 * Calcul des gains commerciaux — fonctions PURES, testées unitairement.
 * Manuel backend §5.1 et §8.1. Aucune de ces fonctions ne touche au réseau,
 * au stockage ni à React : elles sont la seule vérité sur l'argent des agents.
 */
import {
  AGENT_CONVERSION_BONUS,
  AGENT_SIGNUP_BONUS,
  WEEKLY_CLOSING,
  WEEKLY_PAYOUT_THRESHOLD,
} from './constants';

export interface WeekRange {
  /** Inclus. */
  start: Date;
  /** Exclu — instant de la clôture comptable (samedi 16 h). */
  end: Date;
}

export type EarningBucket = 'weekly' | 'deferred';

export interface ClientEarningInput {
  /** Date de création du compte par le code de l'agent. */
  createdAt: Date | string;
  /** Date de passage Premium, si elle a eu lieu. */
  convertedAt?: Date | string | null;
  /** Le compte est-il considéré comme actif (critère : au moins une connexion dans la semaine) ? */
  active?: boolean;
}

export interface EarningClassification {
  bucket: EarningBucket;
  amount: number;
}

export interface PotState {
  /** Montant accumulé dans la cagnotte. */
  earnings: number;
  /** Seuil propre à cette cagnotte. */
  threshold: number;
  /** La cagnotte a-t-elle atteint son seuil ? */
  reached: boolean;
  /** Progression 0–1, plafonnée à 1, pour la barre de progression. */
  progress: number;
  /** Ce qu'il reste à accumuler avant de pouvoir demander le virement. */
  remaining: number;
}

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

/**
 * Semaine comptable : elle se termine le samedi à 16 h (heure du Cameroun) et
 * commence à la clôture du samedi précédent.
 */
export function currentWeekRange(now: Date = new Date()): WeekRange {
  const end = new Date(now);
  end.setHours(WEEKLY_CLOSING.hour, 0, 0, 0);

  // Avance jusqu'au prochain samedi 16 h strictement postérieur à `now`.
  while (end.getDay() !== WEEKLY_CLOSING.dayOfWeek || end.getTime() <= now.getTime()) {
    end.setDate(end.getDate() + 1);
    end.setHours(WEEKLY_CLOSING.hour, 0, 0, 0);
  }

  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

export function previousWeekRange(now: Date = new Date()): WeekRange {
  const current = currentWeekRange(now);
  const end = new Date(current.start);
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return { start, end };
}

/** Utilitaire de test et d'affichage : début de la semaine comptable précédente. */
export function startOfPreviousWeek(now: Date = new Date()): Date {
  return previousWeekRange(now).start;
}

export function isWithin(date: Date, range: WeekRange): boolean {
  const t = date.getTime();
  return t >= range.start.getTime() && t < range.end.getTime();
}

/**
 * Règle §5.1.2 — une conversion Premium rapporte AGENT_CONVERSION_BONUS, mais
 * elle n'alimente les gains de la semaine que si le client a été CRÉÉ pendant
 * la même semaine comptable. Sinon elle va dans la cagnotte séparée des
 * conversions différées, jamais mélangée aux gains de la semaine en cours.
 *
 * Le barème est FIXE (300 F), jamais un pourcentage du prix de l'abonnement :
 * c'est la règle du manuel §5.1, qui prévaut sur l'affichage en pourcentage
 * relevé dans le live (audit §3.3).
 */
export function classifyConversionEarning(
  client: ClientEarningInput,
  week: WeekRange,
): EarningClassification {
  const createdAt = toDate(client.createdAt);
  const bucket: EarningBucket = isWithin(createdAt, week) ? 'weekly' : 'deferred';
  return { bucket, amount: AGENT_CONVERSION_BONUS };
}

/** Règle §5.1.1 — 200 F par compte créé pendant la semaine ET actif. */
export function classifySignupEarning(
  client: ClientEarningInput,
  week: WeekRange,
): EarningClassification | null {
  const createdAt = toDate(client.createdAt);
  if (!isWithin(createdAt, week)) return null;
  if (client.active === false) return null;
  return { bucket: 'weekly', amount: AGENT_SIGNUP_BONUS };
}

function makePot(earnings: number, threshold = WEEKLY_PAYOUT_THRESHOLD): PotState {
  const reached = earnings >= threshold;
  return {
    earnings,
    threshold,
    reached,
    progress: threshold > 0 ? Math.min(1, earnings / threshold) : 0,
    remaining: Math.max(0, threshold - earnings),
  };
}

export interface AgentBalances {
  /** Gains de la semaine comptable en cours (inscriptions + conversions de la semaine). */
  weekly: PotState;
  /** Conversions Premium de clients créés une semaine antérieure. */
  deferred: PotState;
  /** Somme des SEULES cagnottes ayant atteint leur seuil (§5.1.4). */
  availableForWithdrawal: number;
  /** Ce qui reste « en cours », reporté à la semaine suivante. */
  carriedOver: number;
  week: WeekRange;
}

/**
 * Agrège les gains d'un agent à partir de ses clients bruts.
 * Ne renvoie JAMAIS un solde cumulé présenté comme disponible en permanence.
 */
export function computeAgentBalances(
  clients: ClientEarningInput[],
  now: Date = new Date(),
): AgentBalances {
  const week = currentWeekRange(now);
  let weekly = 0;
  let deferred = 0;

  for (const client of clients) {
    const signup = classifySignupEarning(client, week);
    if (signup) weekly += signup.amount;

    if (client.convertedAt) {
      const convertedAt = toDate(client.convertedAt);
      // Seule une conversion survenue pendant la semaine en cours est comptée.
      if (isWithin(convertedAt, week)) {
        const conv = classifyConversionEarning(client, week);
        if (conv.bucket === 'weekly') weekly += conv.amount;
        else deferred += conv.amount;
      }
    }
  }

  return buildBalances(weekly, deferred, week);
}

/** Variante utilisée quand les deux cagnottes sont déjà agrégées côté source. */
export function buildBalances(
  weeklyEarnings: number,
  deferredEarnings: number,
  week: WeekRange = currentWeekRange(),
): AgentBalances {
  const weekly = makePot(weeklyEarnings);
  const deferred = makePot(deferredEarnings);
  return {
    weekly,
    deferred,
    availableForWithdrawal: computeAvailableForWithdrawal(weekly, deferred),
    carriedOver: (weekly.reached ? 0 : weekly.earnings) + (deferred.reached ? 0 : deferred.earnings),
    week,
  };
}

/**
 * §5.1.4 — le total réellement retirable est la somme des cagnottes AYANT
 * ATTEINT leur seuil. Une cagnotte sous le seuil reste « en cours ».
 */
export function computeAvailableForWithdrawal(
  weekly: { earnings: number; threshold?: number },
  deferred: { earnings: number; threshold?: number },
): number {
  const weeklyThreshold = weekly.threshold ?? WEEKLY_PAYOUT_THRESHOLD;
  const deferredThreshold = deferred.threshold ?? WEEKLY_PAYOUT_THRESHOLD;
  let total = 0;
  if (weekly.earnings >= weeklyThreshold) total += weekly.earnings;
  if (deferred.earnings >= deferredThreshold) total += deferred.earnings;
  return total;
}

/**
 * La demande de virement n'est ouverte qu'après la clôture du samedi 16 h,
 * à partir de 18 h, et jusqu'à la clôture suivante.
 */
export function isPayoutWindowOpen(now: Date = new Date()): boolean {
  return now.getDay() === WEEKLY_CLOSING.dayOfWeek && now.getHours() >= WEEKLY_CLOSING.payoutFromHour;
}

export function nextClosingLabel(now: Date = new Date()): string {
  const { end } = currentWeekRange(now);
  return end.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
}
