/**
 * Erreur métier unique de l'application — Manuel backend §2.4.
 * Aucune erreur technique brute ne doit jamais atteindre l'interface :
 * tout est traduit en AppError avec un code stable avant de remonter au client.
 */
export class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public httpStatus = 400,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Manuel backend §4.2 — format de réponse uniforme. */
export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

export function ok<T>(data: T): ActionResult<T> {
  return { success: true, data };
}

export function fail(e: unknown): ActionResult<never> {
  if (e instanceof AppError) {
    return { success: false, error: { code: e.code, message: e.message } };
  }
  // Jamais de stack trace ni de message technique vers l'interface.
  if (import.meta.env.DEV) console.error('[erreur inattendue]', e);
  return {
    success: false,
    error: { code: 'INTERNAL_ERROR', message: 'Une erreur est survenue. Réessaie dans un instant.' },
  };
}
