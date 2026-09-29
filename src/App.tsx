/**
 * Racine de l'application.
 *
 * PRIORITÉ 0 (audit §1) — ce fichier concentre la correction de la faille :
 *  • il n'existe plus AUCUN sélecteur de portail public, ni en en-tête, ni en
 *    pied de page, ni via `?portal=` ;
 *  • chaque portail est un espace de routes distinct (`/app`, `/commercial`,
 *    `/admin`) avec son PROPRE écran de connexion et sa PROPRE session ;
 *  • l'état par défaut, à tout chargement, est « non connecté » : aucun
 *    composant de données n'est monté tant qu'une session du bon portail n'est
 *    pas confirmée ;
 *  • la bascule de portail de développement est gardée par une constante que
 *    Vite remplace par `false` au build de production, ce qui l'élimine du
 *    bundle livré.
 */
import React, { useEffect } from 'react';
import { RouterProvider, useRouter, useSegments, ROUTES } from './lib/router';
import { ToastProvider } from './components/shared/Toast';
import { PortalGuard, usePortalSession } from './components/shared/PortalGuard';
import { useIsMobile } from './lib/hooks';
import { LandingWeb } from './components/web/LandingWeb';
import { UserPortal } from './components/user/UserPortal';
import { AgentLogin } from './components/commercial/AgentLogin';
import { CommercialPortal } from './components/commercial/CommercialPortal';
import { AdminLogin } from './components/admin/AdminLogin';
import { AdminPortal } from './components/admin/AdminPortal';
import { DevPortalSwitcher } from './components/shared/DevPortalSwitcher';
import { NotFound } from './components/web/NotFound';

const Routes: React.FC = () => {
  const { path, navigate } = useRouter();
  const segments = useSegments();
  const isMobile = useIsMobile();

  const root = segments[0] ?? '';

  /**
   * Point 4 de la demande : sur écran large la racine sert la page marketing,
   * sur mobile elle envoie directement dans l'application élève.
   */
  useEffect(() => {
    if (path === '/' && isMobile) navigate(ROUTES.user.root, { replace: true });
  }, [path, isMobile, navigate]);

  if (path === '/') {
    return isMobile ? <UserPortalRoute /> : <LandingWeb />;
  }

  switch (root) {
    case 'app':
      return <UserPortalRoute />;
    case 'commercial':
      return <CommercialRoute />;
    case 'admin':
      return <AdminRoute />;
    default:
      return <NotFound />;
  }
};

/* ------------------------------------------------- Portail Utilisateur */

const UserPortalRoute: React.FC = () => {
  const { session, signOut, refresh } = usePortalSession('user');
  return <UserPortal session={session} onAuthenticated={refresh} onSignOut={signOut} />;
};

/* -------------------------------------------------- Espace Commercial */

const CommercialRoute: React.FC = () => {
  const { navigate, path } = useRouter();
  const { session, signOut, refresh } = usePortalSession('commercial');

  // Toute tentative d'accès à une page protégée sans session est redirigée
  // vers l'écran de connexion du portail concerné (audit §1.3.4).
  useEffect(() => {
    if (!session && path !== ROUTES.commercial.login) {
      navigate(ROUTES.commercial.login, { replace: true });
    }
    if (session && path === ROUTES.commercial.login) {
      navigate('/commercial/tableau-de-bord', { replace: true });
    }
  }, [session, path, navigate]);

  return (
    <PortalGuard
      scope="commercial"
      session={session}
      login={
        <AgentLogin
          onSuccess={() => {
            refresh();
            navigate('/commercial/tableau-de-bord', { replace: true });
          }}
        />
      }
    >
      {session && (
        <CommercialPortal
          session={session}
          onSignOut={async () => {
            await signOut();
            navigate(ROUTES.commercial.login, { replace: true });
          }}
        />
      )}
    </PortalGuard>
  );
};

/* ---------------------------------------------------- Administration */

const AdminRoute: React.FC = () => {
  const { navigate, path } = useRouter();
  const { session, signOut, refresh } = usePortalSession('admin');

  useEffect(() => {
    if (!session && path !== ROUTES.admin.login) {
      navigate(ROUTES.admin.login, { replace: true });
    }
    if (session && path === ROUTES.admin.login) {
      navigate('/admin/vue-ensemble', { replace: true });
    }
  }, [session, path, navigate]);

  return (
    <PortalGuard
      scope="admin"
      session={session}
      login={
        <AdminLogin
          onSuccess={() => {
            refresh();
            navigate('/admin/vue-ensemble', { replace: true });
          }}
        />
      }
    >
      {session && (
        <AdminPortal
          session={session}
          onSignOut={async () => {
            await signOut();
            navigate(ROUTES.admin.login, { replace: true });
          }}
        />
      )}
    </PortalGuard>
  );
};

export const App: React.FC = () => (
  <RouterProvider>
    <ToastProvider>
      <Routes />
      {/* Éliminé du bundle de production (voir lib/env.ts). */}
      <DevPortalSwitcher />
    </ToastProvider>
  </RouterProvider>
);

export default App;
