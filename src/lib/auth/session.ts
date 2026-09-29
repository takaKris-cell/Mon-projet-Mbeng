/**
 * Sessions — une par portail, strictement cloisonnées.
 *
 * Audit §1 / Manuel §3.1 : l'état d'authentification par défaut, à TOUT
 * chargement et pour les 3 portails, est « non connecté ». Aucune session de
 * démonstration n'est câblée en dur.
 *
 * Chaque portail a sa propre clé de stockage : une session Utilisateur ne donne
 * strictement aucun droit sur l'Espace Commercial ni sur l'Administration, et
 * inversement. Le stockage est `sessionStorage` (et non `localStorage`) : la
 * session meurt avec l'onglet, elle n'est pas partagée entre fenêtres.
 */
import type { GlobalRole, PortalScope } from '../data/types';

export interface Session {
  token: string;
  scope: PortalScope;
  userId: string;
  fullName: string;
  role: GlobalRole;
  /** Manuel §3.3 — un rôle `requires_2fa` n'obtient pas de session complète sans ce drapeau. */
  twoFactorVerified: boolean;
  issuedAt: number;
  expiresAt: number;
}

const STORAGE_PREFIX = 'mbeng.session.';
const TTL_MS = 8 * 3600 * 1000;

/** Rôles autorisés par espace de routes. */
export const SCOPE_ROLES: Record<PortalScope, GlobalRole[]> = {
  user: ['eleve', 'betreuer'],
  commercial: ['commercial'],
  admin: ['admin', 'super_admin'],
};

type Listener = (scope: PortalScope) => void;
const listeners = new Set<Listener>();

export function onSessionChange(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function notify(scope: PortalScope) {
  listeners.forEach((fn) => fn(scope));
}

function storageKey(scope: PortalScope) {
  return `${STORAGE_PREFIX}${scope}`;
}

export function readSession(scope: PortalScope): Session | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(scope));
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    // Un jeton stocké sous une clé ne vaut que pour SON portail et SON rôle.
    if (session.scope !== scope) return null;
    if (!SCOPE_ROLES[scope].includes(session.role)) return null;
    if (session.expiresAt <= Date.now()) {
      window.sessionStorage.removeItem(storageKey(scope));
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function writeSession(session: Session): void {
  window.sessionStorage.setItem(storageKey(session.scope), JSON.stringify(session));
  notify(session.scope);
}

export function clearSession(scope: PortalScope): void {
  window.sessionStorage.removeItem(storageKey(scope));
  notify(scope);
}

export function createSession(params: {
  scope: PortalScope;
  userId: string;
  fullName: string;
  role: GlobalRole;
  twoFactorVerified: boolean;
}): Session {
  const now = Date.now();
  return {
    ...params,
    token: `${params.scope}.${params.userId}.${now.toString(36)}.${Math.random().toString(36).slice(2, 10)}`,
    issuedAt: now,
    expiresAt: now + TTL_MS,
  };
}
