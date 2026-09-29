/**
 * Test de non-régression PERMANENT de la faille de l'audit §1 (Manuel §8.2).
 *
 * Il vérifie qu'aucune donnée ne sort de la couche API sans session valide du
 * BON portail, et qu'une session d'un portail n'ouvre jamais un autre portail.
 * Si quelqu'un recâblait un jour une session de démonstration, ces tests
 * tomberaient immédiatement.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Minimal `window.sessionStorage` pour exécuter la couche session hors navigateur. */
class MemoryStorage {
  private map = new Map<string, string>();
  getItem(k: string) { return this.map.has(k) ? this.map.get(k)! : null; }
  setItem(k: string, v: string) { this.map.set(k, v); }
  removeItem(k: string) { this.map.delete(k); }
  clear() { this.map.clear(); }
}

const storage = new MemoryStorage();
vi.stubGlobal('window', { sessionStorage: storage, location: { origin: 'http://localhost:3000' } });

const { createSession, writeSession, clearSession } = await import('../../auth/session');
const { requireSession } = await import('../client');
const { getAgentDashboard, listAgentClients, requestPayout } = await import('../agent');
const { getAdminOverview, listPayoutRequests, markPayoutPaid } = await import('../admin');
const { getProfile } = await import('../user');
const { AppError } = await import('../../errors');

beforeEach(() => storage.clear());

describe('état par défaut : non connecté', () => {
  it('refuse toute lecture du portail Utilisateur sans session', async () => {
    const result = await getProfile();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it("refuse toute lecture de l'Espace Commercial sans session", async () => {
    const result = await getAgentDashboard();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it("refuse toute lecture de l'Administration sans session", async () => {
    const result = await getAdminOverview();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('UNAUTHORIZED');
  });

  it('refuse toute écriture d’argent sans session', async () => {
    const payout = await requestPayout('weekly');
    expect(payout.success).toBe(false);
    const paid = await markPayoutPaid('pyr_1', 'OM-123456');
    expect(paid.success).toBe(false);
  });
});

describe('cloisonnement strict entre les portails', () => {
  it("une session élève n'ouvre ni l'Espace Commercial ni l'Administration", async () => {
    writeSession(createSession({
      scope: 'user', userId: 'usr_awa', fullName: 'Awa Nkeng', role: 'eleve', twoFactorVerified: true,
    }));

    expect((await getProfile()).success).toBe(true);
    expect((await getAgentDashboard()).success).toBe(false);
    expect((await getAdminOverview()).success).toBe(false);
  });

  it("une session commerciale n'ouvre pas l'Administration", async () => {
    writeSession(createSession({
      scope: 'commercial', userId: 'usr_jean', fullName: 'Jean Mveng', role: 'commercial', twoFactorVerified: true,
    }));

    expect((await listAgentClients()).success).toBe(true);
    expect((await listPayoutRequests()).success).toBe(false);
  });

  it('un jeton dont le rôle ne correspond pas au portail est rejeté', () => {
    // Jeton forgé : bon espace de stockage, mauvais rôle.
    storage.setItem('mbeng.session.admin', JSON.stringify({
      token: 'forge', scope: 'admin', userId: 'usr_awa', fullName: 'Awa Nkeng',
      role: 'eleve', twoFactorVerified: true, issuedAt: Date.now(), expiresAt: Date.now() + 3600_000,
    }));
    expect(() => requireSession('admin')).toThrow(AppError);
  });

  it('une session expirée ne donne plus aucun accès', () => {
    storage.setItem('mbeng.session.commercial', JSON.stringify({
      token: 'vieux', scope: 'commercial', userId: 'usr_jean', fullName: 'Jean Mveng',
      role: 'commercial', twoFactorVerified: true, issuedAt: 0, expiresAt: Date.now() - 1000,
    }));
    expect(() => requireSession('commercial')).toThrow(AppError);
  });

  it('la déconnexion referme immédiatement le portail', async () => {
    writeSession(createSession({
      scope: 'commercial', userId: 'usr_jean', fullName: 'Jean Mveng', role: 'commercial', twoFactorVerified: true,
    }));
    expect((await getAgentDashboard()).success).toBe(true);
    clearSession('commercial');
    expect((await getAgentDashboard()).success).toBe(false);
  });
});

describe('2FA obligatoire pour l’Administration', () => {
  it("une session admin sans second facteur validé n'accède à rien", async () => {
    storage.setItem('mbeng.session.admin', JSON.stringify({
      token: 'sans-2fa', scope: 'admin', userId: 'usr_admin', fullName: 'Super Administrateur',
      role: 'super_admin', twoFactorVerified: false, issuedAt: Date.now(), expiresAt: Date.now() + 3600_000,
    }));
    const result = await getAdminOverview();
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error.code).toBe('TWO_FACTOR_REQUIRED');
  });
});
