/**
 * Agrégation financière — fonctions PURES, testées unitairement (Manuel §8.1).
 *
 * L'audit §3.1 a trouvé TROIS totaux différents pour la même donnée sur le même
 * écran de comptabilité. La règle préventive (Manuel §11) : tout total financier
 * affiché est calculé ici, par une fonction qui vérifie sa propre cohérence
 * (brut − reversé − charges = net), jamais assemblé à la main écran par écran.
 */
import { AppError } from '../errors';
import { CURRENCY } from './constants';

export interface MonthlyLedgerRow {
  /** Clé ISO du mois, ex. '2026-09'. */
  month: string;
  label: string;
  grossRevenue: number;
  /** Commissions versées aux agents commerciaux. */
  agentCommissions: number;
  /** Crédits de parrainage versés en espèces aux élèves ambassadeurs. */
  referralPayouts: number;
  charges: number;
}

export interface AccountingTotals {
  grossRevenue: number;
  agentCommissions: number;
  referralPayouts: number;
  /** = agentCommissions + referralPayouts. Jamais saisi à la main. */
  networkPayout: number;
  /** = grossRevenue − networkPayout. */
  netRevenue: number;
  charges: number;
  /** = netRevenue − charges. */
  netProfit: number;
  /** Marge nette en pourcentage du brut. */
  netMarginPct: number;
}

/** Équivalent € (parité fixe XAF/EUR), utile au fondateur basé en Allemagne. */
export function toEur(amountXaf: number): number {
  return amountXaf * CURRENCY.eurPerXaf;
}

/**
 * Lève une AppError si l'identité comptable est rompue.
 * Appelée systématiquement par computeAccounting : aucun écran ne peut afficher
 * un jeu de totaux incohérent sans que l'erreur remonte immédiatement.
 */
export function assertAccountingCoherence(t: AccountingTotals): void {
  const tolerance = 1; // FCFA, arrondis
  if (Math.abs(t.agentCommissions + t.referralPayouts - t.networkPayout) > tolerance) {
    throw new AppError(
      'ACCOUNTING_NETWORK_SPLIT_MISMATCH',
      `Le détail du reversement réseau (${t.agentCommissions} + ${t.referralPayouts}) ne correspond pas au total affiché (${t.networkPayout}).`,
      500,
    );
  }
  if (Math.abs(t.grossRevenue - t.networkPayout - t.netRevenue) > tolerance) {
    throw new AppError(
      'ACCOUNTING_NET_REVENUE_MISMATCH',
      `Revenu brut − reversement réseau ≠ revenu net (${t.grossRevenue} − ${t.networkPayout} ≠ ${t.netRevenue}).`,
      500,
    );
  }
  if (Math.abs(t.grossRevenue - t.networkPayout - t.charges - t.netProfit) > tolerance) {
    throw new AppError(
      'ACCOUNTING_NET_PROFIT_MISMATCH',
      `Revenu brut − reversement réseau − charges ≠ bénéfice net (${t.grossRevenue} − ${t.networkPayout} − ${t.charges} ≠ ${t.netProfit}).`,
      500,
    );
  }
}

function sum(rows: MonthlyLedgerRow[], key: keyof MonthlyLedgerRow): number {
  return rows.reduce((acc, r) => acc + (r[key] as number), 0);
}

/**
 * Agrège TOUTES les périodes fournies. L'audit §3.1 avait trouvé une valeur
 * mensuelle branchée par erreur à la place d'un cumul : ici le cumul « depuis la
 * création » est forcément la somme de toutes les lignes reçues.
 */
export function computeAccounting(rows: MonthlyLedgerRow[]): AccountingTotals {
  const grossRevenue = sum(rows, 'grossRevenue');
  const agentCommissions = sum(rows, 'agentCommissions');
  const referralPayouts = sum(rows, 'referralPayouts');
  const charges = sum(rows, 'charges');

  const networkPayout = agentCommissions + referralPayouts;
  const netRevenue = grossRevenue - networkPayout;
  const netProfit = netRevenue - charges;

  const totals: AccountingTotals = {
    grossRevenue,
    agentCommissions,
    referralPayouts,
    networkPayout,
    netRevenue,
    charges,
    netProfit,
    netMarginPct: grossRevenue > 0 ? (netProfit / grossRevenue) * 100 : 0,
  };

  assertAccountingCoherence(totals);
  return totals;
}

/** Totaux d'un seul mois, calculés par le même chemin de code que le cumul. */
export function computeMonth(row: MonthlyLedgerRow): AccountingTotals {
  return computeAccounting([row]);
}

export interface MonthlyBreakdown extends AccountingTotals {
  month: string;
  label: string;
}

/** Historique complet mois par mois, chaque ligne vérifiée individuellement. */
export function computeMonthlyBreakdown(rows: MonthlyLedgerRow[]): MonthlyBreakdown[] {
  return rows.map((row) => ({ month: row.month, label: row.label, ...computeMonth(row) }));
}

/** Taux de churn = non renouvelés / abonnements arrivés à échéance (audit §3.5). */
export function computeChurnRate(notRenewed: number, expiredSubscriptions: number): number {
  if (expiredSubscriptions <= 0) return 0;
  return (notRenewed / expiredSubscriptions) * 100;
}
