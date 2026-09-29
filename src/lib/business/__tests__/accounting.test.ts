import { describe, expect, it } from 'vitest';
import {
  assertAccountingCoherence,
  computeAccounting,
  computeChurnRate,
  computeMonthlyBreakdown,
  toEur,
  type MonthlyLedgerRow,
} from '../accounting';
import { MONTHLY_LEDGER } from '../../data/seed';
import { AppError } from '../../errors';

describe('cohérence comptable', () => {
  it('vérifie que revenu brut − reversement réseau − charges = bénéfice net', () => {
    const t = computeAccounting(MONTHLY_LEDGER);
    expect(t.grossRevenue - t.networkPayout - t.charges).toBe(t.netProfit);
  });

  it('reconstitue exactement le cumul « depuis la création » attendu par l’audit §3.1', () => {
    const t = computeAccounting(MONTHLY_LEDGER);
    expect(t.grossRevenue).toBe(10_000_000);
    expect(t.networkPayout).toBe(1_852_000);
    expect(t.netRevenue).toBe(8_148_000);
    expect(t.charges).toBe(2_400_000);
    expect(t.netProfit).toBe(5_748_000);
  });

  it('fait du total réseau la somme de ses deux lignes de détail, jamais une valeur saisie', () => {
    const t = computeAccounting(MONTHLY_LEDGER);
    expect(t.agentCommissions + t.referralPayouts).toBe(t.networkPayout);
  });

  it('cumule TOUTES les périodes et ne renvoie pas la valeur du dernier mois', () => {
    const t = computeAccounting(MONTHLY_LEDGER);
    const lastMonth = MONTHLY_LEDGER[MONTHLY_LEDGER.length - 1];
    expect(t.networkPayout).toBeGreaterThan(lastMonth.agentCommissions + lastMonth.referralPayouts);
  });

  it('refuse un jeu de totaux incohérent', () => {
    expect(() =>
      assertAccountingCoherence({
        grossRevenue: 10_000_000,
        agentCommissions: 545_300,
        referralPayouts: 26_700,
        networkPayout: 2_140_000, // le trio exact trouvé en live par l'audit
        netRevenue: 8_148_000,
        charges: 2_400_000,
        netProfit: 5_748_000,
        netMarginPct: 0,
      }),
    ).toThrow(AppError);
  });

  it('vérifie aussi chaque mois pris isolément', () => {
    const rows = computeMonthlyBreakdown(MONTHLY_LEDGER);
    expect(rows).toHaveLength(MONTHLY_LEDGER.length);
    for (const r of rows) {
      expect(r.grossRevenue - r.networkPayout - r.charges).toBe(r.netProfit);
    }
  });

  it('gère un grand livre vide sans casser l’invariant', () => {
    const t = computeAccounting([] as MonthlyLedgerRow[]);
    expect(t.netProfit).toBe(0);
    expect(t.netMarginPct).toBe(0);
  });
});

describe('conversions et métriques', () => {
  it('convertit en euros à la parité fixe du franc CFA', () => {
    expect(Math.round(toEur(655_957))).toBe(1000);
  });

  it('calcule le taux de churn attendu', () => {
    expect(Number(computeChurnRate(27, 659).toFixed(1))).toBe(4.1);
  });

  it('renvoie 0 si aucun abonnement n’est arrivé à échéance', () => {
    expect(computeChurnRate(0, 0)).toBe(0);
  });
});
