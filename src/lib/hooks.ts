/**
 * Hooks transverses : appels API avec états de chargement/erreur réels,
 * détection du format d'écran, presse-papiers, notifications.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActionResult } from './errors';

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: { code: string; message: string } | null;
  /** Vrai uniquement lors du tout premier chargement (pour les squelettes). */
  initialLoading: boolean;
  reload: () => void;
}

/**
 * Chaque écran passe par ici : il y a donc TOUJOURS un état de chargement, un
 * état d'erreur et un état vide gérés, jamais un rendu direct de données.
 */
export function useApi<T>(fetcher: () => Promise<ActionResult<T>>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [nonce, setNonce] = useState(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetcherRef
      .current()
      .then((result) => {
        if (cancelled) return;
        if (result.success) {
          setData(result.data);
          setError(null);
        } else {
          setError(result.error);
        }
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
        setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, loading, error, initialLoading, reload };
}

/** Exécute une mutation en exposant un état « en cours » pour désactiver le bouton. */
export function useMutation<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<ActionResult<TResult>>,
) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);

  const run = useCallback(
    async (...args: TArgs): Promise<TResult | null> => {
      setPending(true);
      setError(null);
      try {
        const result = await action(...args);
        if (!result.success) {
          setError(result.error);
          return null;
        }
        return result.data;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  return { run, pending, error, clearError: () => setError(null) };
}

/**
 * Format d'écran. Sert au routage desktop → landing marketing /
 * mobile → application (point 4 de la demande).
 */
export function useIsMobile(breakpoint = 900): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? false : window.innerWidth < breakpoint,
  );
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [breakpoint]);
  return isMobile;
}

export function useDebounced<T>(value: T, ms = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

export function useCopyToClipboard(): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      },
      () => setCopied(false),
    );
  }, []);
  return [copied, copy];
}
