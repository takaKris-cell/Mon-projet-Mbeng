/**
 * Boucle de paiement des commissions de bout en bout — audit §2.
 *
 * « Un flux métier n'est jamais considéré complet tant que les deux bouts
 * (déclenchement ET traitement) n'existent pas et ne sont pas reliés par une
 * donnée persistée vérifiable » (Manuel §11). Ce test relie les deux bouts.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

const storage = new MemoryStorage();
vi.stubGlobal('window', { sessionStorage: storage, location: { origin: 'http://localhost:3000' } });

const { createSession, writeSession } = await import('../../auth/session');
const { balancesOf, requestPayout } = await import('../agent');
const { listPayoutRequests, markPayoutPaid, rejectPayout } = await import('../admin');
const { db } = await import('../../data/store');
const { WEEKLY_PAYOUT_THRESHOLD } = await import('../../business/constants');

const AGENT_SESSION = () => createSession({
  scope: 'commercial', userId: 'usr_jean', fullName: 'Jean Mveng', role: 'commercial', twoFactorVerified: true,
});
const ADMIN_SESSION = () => createSession({
  scope: 'admin', userId: 'usr_admin', fullName: 'Super Administrateur', role: 'super_admin', twoFactorVerified: true,
});

beforeEach(() => storage.clear());

describe('déclenchement côté agent', () => {
  it("refuse la demande d'une cagnotte sous le seuil", async () => {
    writeSession(AGENT_SESSION());
    const balances = balancesOf('agt_jean');
    // La cagnotte des conversions différées est calibrée sous le seuil.
    expect(balances.deferred.reached).toBe(false);

    const result = await requestPayout('deferred');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('PAYOUT_THRESHOLD_NOT_REACHED');
  });

  it('crée une demande persistée quand le seuil est atteint', async () => {
    writeSession(AGENT_SESSION());
    const balances = balancesOf('agt_jean');
    expect(balances.weekly.reached).toBe(true);
    expect(balances.weekly.earnings).toBeGreaterThanOrEqual(WEEKLY_PAYOUT_THRESHOLD);

    const result = await requestPayout('weekly');
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.status).toBe('pending');
    expect(result.data.amount).toBe(balances.weekly.earnings);
    expect(db.payoutRequests.some((p) => p.id === result.data.id)).toBe(true);
  });

  it('empêche une seconde demande tant que la première est en attente', async () => {
    writeSession(AGENT_SESSION());
    const second = await requestPayout('weekly');
    expect(second.success).toBe(false);
    if (!second.success) expect(second.error.code).toBe('PAYOUT_ALREADY_PENDING');
  });
});

describe('traitement côté Super-Admin', () => {
  it('voit la demande de l’agent dans sa file', async () => {
    writeSession(ADMIN_SESSION());
    const result = await listPayoutRequests({ filter: 'pending', pageSize: 100 });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page.rows.some((p) => p.requesterName === 'Jean Mveng')).toBe(true);
    expect(result.data.summary.pendingAmount).toBe(
      result.data.page.rows.reduce((s, p) => s + p.amount, 0),
    );
  });

  it('refuse « Marquer payé » sans référence de transaction', async () => {
    writeSession(ADMIN_SESSION());
    const target = db.payoutRequests.find((p) => p.status === 'pending')!;
    const result = await markPayoutPaid(target.id, '   ');
    expect(result.success).toBe(false);
  });

  it('accepte « Marquer payé » avec référence et journalise le changement', async () => {
    writeSession(ADMIN_SESSION());
    const target = db.payoutRequests.find((p) => p.status === 'pending')!;
    const result = await markPayoutPaid(target.id, 'OM-998877');
    expect(result.success).toBe(true);
    if (!result.success) return;

    expect(result.data.status).toBe('paid');
    expect(result.data.transactionReference).toBe('OM-998877');
    expect(result.data.paidAt).toBeTruthy();
    expect(db.auditLog.some((a) => a.action === 'payout.marked_paid' && a.targetId === target.id)).toBe(true);
  });

  it('refuse de traiter deux fois la même demande', async () => {
    writeSession(ADMIN_SESSION());
    const alreadyPaid = db.payoutRequests.find((p) => p.status === 'paid')!;
    const result = await markPayoutPaid(alreadyPaid.id, 'OM-000000');
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('PAYOUT_ALREADY_PROCESSED');
  });

  it('refuse « Rejeter » sans motif, et l’accepte avec motif', async () => {
    writeSession(ADMIN_SESSION());
    const target = db.payoutRequests.find((p) => p.status === 'pending')!;

    const withoutReason = await rejectPayout(target.id, '   erreur');
    expect(withoutReason.success).toBe(false);

    const withReason = await rejectPayout(target.id, 'Numéro MTN inactif — réactiver le compte MoMo.');
    expect(withReason.success).toBe(true);
    if (!withReason.success) return;
    expect(withReason.data.status).toBe('rejected');
    expect(db.auditLog.some((a) => a.action === 'payout.rejected' && a.targetId === target.id)).toBe(true);
  });
});
