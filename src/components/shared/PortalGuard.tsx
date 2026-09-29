/**
 * Garde d'accès d'un portail — audit §1.3.1.
 *
 * Tant qu'une session valide du BON portail n'est pas confirmée, l'écran de
 * connexion est le seul arbre React monté : aucun composant contenant des
 * données du portail Commercial ou Administration n'est instancié, et aucun
 * appel API n'est donc émis. La garde côté base (`requireSession` dans
 * lib/api/client) reste la vérité : celle-ci n'est qu'une commodité d'affichage.
 */
import React, { useCallback, useEffect, useState } from 'react';
import type { PortalScope } from '../../lib/data/types';
import { onSessionChange, readSession, type Session } from '../../lib/auth/session';
import { logout as apiLogout } from '../../lib/api/auth';

export function usePortalSession(scope: PortalScope) {
  // État initial : lecture stricte du stockage. Par défaut « non connecté ».
  const [session, setSession] = useState<Session | null>(() => readSession(scope));

  useEffect(() => {
    const unsubscribe = onSessionChange((changed) => {
      if (changed === scope) setSession(readSession(scope));
    });
    // Une session peut expirer pendant que l'onglet est ouvert.
    const interval = setInterval(() => {
      const fresh = readSession(scope);
      setSession((prev) => (prev?.token === fresh?.token ? prev : fresh));
    }, 30_000);
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [scope]);

  const signOut = useCallback(async () => {
    await apiLogout(scope);
    setSession(null);
  }, [scope]);

  const refresh = useCallback(() => setSession(readSession(scope)), [scope]);

  return { session, signOut, refresh };
}

interface PortalGuardProps {
  scope: PortalScope;
  session: Session | null;
  login: React.ReactNode;
  children: React.ReactNode;
}

export const PortalGuard: React.FC<PortalGuardProps> = ({ session, login, children }) => {
  if (!session) return <>{login}</>;
  return <>{children}</>;
};
