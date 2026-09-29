/**
 * Routeur minimal basé sur l'History API.
 *
 * Les 3 portails ne sont plus des onglets d'un même écran : ce sont 3 espaces
 * de routes distincts (`/app`, `/commercial`, `/admin`), chacun avec sa propre
 * page de connexion. Changer de portail n'est plus un `setState`, c'est une
 * navigation — et chaque espace redemande une authentification (audit §1).
 */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

interface RouterValue {
  path: string;
  query: URLSearchParams;
  navigate: (to: string, options?: { replace?: boolean }) => void;
  back: () => void;
}

const RouterContext = createContext<RouterValue | null>(null);

function normalize(pathname: string): string {
  const p = pathname.replace(/\/+$/, '');
  return p === '' ? '/' : p;
}

export const RouterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLocation] = useState(() => ({
    path: normalize(window.location.pathname),
    search: window.location.search,
  }));

  useEffect(() => {
    const onPop = () =>
      setLocation({ path: normalize(window.location.pathname), search: window.location.search });
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const url = new URL(to, window.location.origin);
    if (options?.replace) window.history.replaceState({}, '', url.toString());
    else window.history.pushState({}, '', url.toString());
    setLocation({ path: normalize(url.pathname), search: url.search });
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, []);

  const value = useMemo<RouterValue>(
    () => ({
      path: location.path,
      query: new URLSearchParams(location.search),
      navigate,
      back: () => window.history.back(),
    }),
    [location, navigate],
  );

  return <RouterContext.Provider value={value}>{children}</RouterContext.Provider>;
};

export function useRouter(): RouterValue {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter doit être utilisé dans un RouterProvider.');
  return ctx;
}

/** Segments de la route courante, ex. '/admin/commerciaux' → ['admin', 'commerciaux']. */
export function useSegments(): string[] {
  const { path } = useRouter();
  return useMemo(() => path.split('/').filter(Boolean), [path]);
}

export const Link: React.FC<
  React.AnchorHTMLAttributes<HTMLAnchorElement> & { to: string; replace?: boolean }
> = ({ to, replace, onClick, children, ...rest }) => {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      onClick={(e) => {
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        onClick?.(e);
        navigate(to, { replace });
      }}
      {...rest}
    >
      {children}
    </a>
  );
};

export const ROUTES = {
  landing: '/',
  user: {
    root: '/app',
    welcome: '/app/bienvenue',
    login: '/app/connexion',
    register: '/app/inscription',
    otp: '/app/verification',
    level: '/app/niveau',
  },
  commercial: {
    root: '/commercial',
    login: '/commercial/connexion',
  },
  admin: {
    root: '/admin',
    login: '/admin/connexion',
  },
} as const;
