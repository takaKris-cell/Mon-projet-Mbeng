import { describe, expect, it } from 'vitest';
import {
  AGENT_CONVERSION_BONUS,
  AGENT_SIGNUP_BONUS,
  WEEKLY_PAYOUT_THRESHOLD,
} from '../constants';
import {
  buildBalances,
  classifyConversionEarning,
  classifySignupEarning,
  computeAgentBalances,
  computeAvailableForWithdrawal,
  currentWeekRange,
  isPayoutWindowOpen,
  startOfPreviousWeek,
} from '../agent-earnings';

/** Mercredi 23 septembre 2026, 10 h — milieu d'une semaine comptable. */
const NOW = new Date('2026-09-23T10:00:00');

describe('semaine comptable', () => {
  it('se termine le samedi à 16 h', () => {
    const week = currentWeekRange(NOW);
    expect(week.end.getDay()).toBe(6);
    expect(week.end.getHours()).toBe(16);
  });

  it('dure exactement sept jours', () => {
    const week = currentWeekRange(NOW);
    const days = (week.end.getTime() - week.start.getTime()) / (24 * 3600 * 1000);
    expect(days).toBe(7);
  });

  it('contient l’instant courant', () => {
    const week = currentWeekRange(NOW);
    expect(NOW.getTime()).toBeGreaterThanOrEqual(week.start.getTime());
    expect(NOW.getTime()).toBeLessThan(week.end.getTime());
  });
});

describe('classification des gains', () => {
  it('un client créé la semaine précédente et converti cette semaine va dans les conversions différées', () => {
    const client = { createdAt: startOfPreviousWeek(NOW), convertedAt: NOW };
    const result = classifyConversionEarning(client, currentWeekRange(NOW));
    expect(result.bucket).toBe('deferred');
    expect(result.amount).toBe(AGENT_CONVERSION_BONUS);
  });

  it('un client créé ET converti dans la même semaine alimente les gains de la semaine', () => {
    const week = currentWeekRange(NOW);
    const client = { createdAt: new Date(week.start.getTime() + 3600_000), convertedAt: NOW };
    expect(classifyConversionEarning(client, week).bucket).toBe('weekly');
  });

  it('la conversion rapporte un montant FIXE, jamais un pourcentage de l’abonnement', () => {
    const week = currentWeekRange(NOW);
    const cheap = classifyConversionEarning({ createdAt: week.start, convertedAt: NOW }, week);
    const expensive = classifyConversionEarning({ createdAt: startOfPreviousWeek(NOW) }, week);
    expect(cheap.amount).toBe(AGENT_CONVERSION_BONUS);
    expect(expensive.amount).toBe(AGENT_CONVERSION_BONUS);
  });

  it('une inscription de la semaine rapporte le bonus d’inscription si le compte est actif', () => {
    const week = currentWeekRange(NOW);
    expect(classifySignupEarning({ createdAt: NOW, active: true }, week)?.amount).toBe(
      AGENT_SIGNUP_BONUS,
    );
  });

  it('une inscription inactive ne rapporte rien', () => {
    const week = currentWeekRange(NOW);
    expect(classifySignupEarning({ createdAt: NOW, active: false }, week)).toBeNull();
  });

  it('une inscription d’une semaine antérieure ne rapporte rien cette semaine', () => {
    const week = currentWeekRange(NOW);
    expect(classifySignupEarning({ createdAt: startOfPreviousWeek(NOW), active: true }, week)).toBeNull();
  });
});

describe('disponibilité au retrait', () => {
  it('le total disponible au retrait ne compte que les cagnottes ayant atteint leur seuil', () => {
    const weekly = { earnings: 4200 }; // sous le seuil
    const deferred = { earnings: 5100 }; // au-dessus du seuil
    expect(computeAvailableForWithdrawal(weekly, deferred)).toBe(5100);
  });

  it('ne fusionne jamais les deux cagnottes pour franchir le seuil', () => {
    // 3 000 + 3 000 = 6 000 > 5 000, mais aucune cagnotte n’atteint seule son seuil.
    expect(computeAvailableForWithdrawal({ earnings: 3000 }, { earnings: 3000 })).toBe(0);
  });

  it('additionne les deux cagnottes quand chacune a atteint son seuil', () => {
    expect(
      computeAvailableForWithdrawal({ earnings: 5200 }, { earnings: WEEKLY_PAYOUT_THRESHOLD }),
    ).toBe(5200 + WEEKLY_PAYOUT_THRESHOLD);
  });

  it('reporte en « en cours » ce qui n’a pas atteint son seuil', () => {
    const balances = buildBalances(4200, 5100, currentWeekRange(NOW));
    expect(balances.availableForWithdrawal).toBe(5100);
    expect(balances.carriedOver).toBe(4200);
    expect(balances.weekly.reached).toBe(false);
    expect(balances.deferred.reached).toBe(true);
  });
});

describe('agrégation à partir des clients bruts', () => {
  it('sépare correctement gains de la semaine et conversions différées', () => {
    const week = currentWeekRange(NOW);
    const inWeek = new Date(week.start.getTime() + 3600_000);
    const balances = computeAgentBalances(
      [
        { createdAt: inWeek, active: true, convertedAt: NOW }, // 200 + 300 → weekly
        { createdAt: inWeek, active: true }, // 200 → weekly
        { createdAt: startOfPreviousWeek(NOW), convertedAt: NOW }, // 300 → deferred
      ],
      NOW,
    );
    expect(balances.weekly.earnings).toBe(AGENT_SIGNUP_BONUS * 2 + AGENT_CONVERSION_BONUS);
    expect(balances.deferred.earnings).toBe(AGENT_CONVERSION_BONUS);
  });
});

describe('fenêtre de demande de virement', () => {
  it('est fermée en milieu de semaine', () => {
    expect(isPayoutWindowOpen(NOW)).toBe(false);
  });

  it('est fermée le samedi avant 18 h', () => {
    expect(isPayoutWindowOpen(new Date('2026-09-26T17:00:00'))).toBe(false);
  });

  it('est ouverte le samedi à partir de 18 h', () => {
    expect(isPayoutWindowOpen(new Date('2026-09-26T18:30:00'))).toBe(true);
  });
});
