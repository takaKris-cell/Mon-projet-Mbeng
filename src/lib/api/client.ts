/**
 * Socle des appels « serveur ».
 *
 * Audit §1.3.2 / Manuel §3.1 : la vérification de session et de rôle se fait
 * AVANT toute lecture ou écriture de données, à chaque requête, dans cette
 * couche — jamais par un `if` d'affichage dans un composant. Un appel sans
 * session valide ou avec un rôle insuffisant renvoie une erreur d'autorisation
 * (401 / 403) et JAMAIS des données.
 *
 * Bascule Supabase : `requireSession` devient `supabase.auth.getUser()` +
 * policies RLS, `paginate` devient `.range()`. Aucun écran ne change.
 */
import { AppError } from '../errors';
import { SIMULATED_LATENCY_MS } from '../env';
import { readSession, SCOPE_ROLES, type Session } from '../auth/session';
import type { AdminSection, Paginated, PermissionLevel, PortalScope } from '../data/types';
import { db } from '../data/store';

export function delay(ms = SIMULATED_LATENCY_MS): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Garde d'accès : renvoie la session, ou lève 401/403. */
export function requireSession(scope: PortalScope): Session {
  const session = readSession(scope);
  if (!session) {
    throw new AppError('UNAUTHORIZED', 'Session absente ou expirée. Connecte-toi pour continuer.', 401);
  }
  if (!SCOPE_ROLES[scope].includes(session.role)) {
    throw new AppError('FORBIDDEN', "Ton rôle ne donne pas accès à cet espace.", 403);
  }
  if (scope === 'admin' && !session.twoFactorVerified) {
    throw new AppError(
      'TWO_FACTOR_REQUIRED',
      'La double authentification est obligatoire pour accéder aux données financières.',
      403,
    );
  }
  return session;
}

/**
 * Manuel §6 — permissions granulaires par section pour les accès délégués.
 * Le super_admin a toujours un accès total, non paramétrable.
 */
export function requireAdminSection(section: AdminSection, level: PermissionLevel = 'lecture'): Session {
  const session = requireSession('admin');
  if (session.role === 'super_admin') return session;

  const access = db.adminAccesses.find((a) => a.userId === session.userId);
  if (!access || access.status !== 'active') {
    throw new AppError('FORBIDDEN', "Cet accès administratif n'est pas actif.", 403);
  }
  const granted = access.permissions[section] ?? 'aucun';
  const rank: Record<PermissionLevel, number> = { aucun: 0, lecture: 1, ecriture: 2 };
  if (rank[granted] < rank[level]) {
    throw new AppError('FORBIDDEN', `Accès « ${level} » non accordé sur cette section.`, 403);
  }
  return session;
}

export interface QueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

/**
 * Manuel §9.3 — toute liste est réellement paginée côté « requête ».
 * Le total renvoyé correspond toujours au nombre de lignes réellement
 * accessibles en naviguant dans les pages (audit §3.4).
 */
export function paginate<T>(rows: T[], params: QueryParams = {}): Paginated<T> {
  const pageSize = Math.max(1, params.pageSize ?? 10);
  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, params.page ?? 1), pageCount);
  const start = (page - 1) * pageSize;
  return { rows: rows.slice(start, start + pageSize), total, page, pageSize, pageCount };
}

export function matchesSearch(haystacks: (string | null | undefined)[], needle?: string): boolean {
  if (!needle || !needle.trim()) return true;
  const q = needle.trim().toLowerCase();
  return haystacks.some((h) => (h ?? '').toLowerCase().includes(q));
}

/** Exécute une lecture protégée avec latence réseau simulée. */
export async function read<T>(produce: () => T): Promise<T> {
  await delay();
  return produce();
}

/** Exécute une écriture protégée (un peu plus lente, comme une vraie mutation). */
export async function write<T>(produce: () => T): Promise<T> {
  await delay(SIMULATED_LATENCY_MS + 180);
  return produce();
}

export function requireNonEmpty(value: string | undefined | null, code: string, message: string): string {
  const v = (value ?? '').trim();
  if (!v) throw new AppError(code, message);
  return v;
}
