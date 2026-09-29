/**
 * Retour visuel des actions. Toute action qui modifie une donnée confirme
 * explicitement son effet : plus aucun bouton ne reste « sans suite ».
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

type ToastTone = 'success' | 'error' | 'info';

interface ToastItem {
  id: number;
  tone: ToastTone;
  message: string;
  detail?: string;
}

interface ToastApi {
  success: (message: string, detail?: string) => void;
  error: (message: string, detail?: string) => void;
  info: (message: string, detail?: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ToastItem[]>([]);

  const push = useCallback((tone: ToastTone, message: string, detail?: string) => {
    const id = Date.now() + Math.random();
    setItems((prev) => [...prev, { id, tone, message, detail }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), tone === 'error' ? 7000 : 4500);
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (m, d) => push('success', m, d),
      error: (m, d) => push('error', m, d),
      info: (m, d) => push('info', m, d),
    }),
    [push],
  );

  const dismiss = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  const tones: Record<ToastTone, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    success: { bg: 'bg-[#DDF0E6]', border: 'border-[#B9E2CC]', text: 'text-[#1F6B47]', icon: <CheckCircle2 size={17} /> },
    error: { bg: 'bg-[#FBE9E7]', border: 'border-[#F0BDB8]', text: 'text-[#B3261E]', icon: <AlertTriangle size={17} /> },
    info: { bg: 'bg-white', border: 'border-[#E4DCCB]', text: 'text-[#241F18]', icon: <Info size={17} /> },
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed z-[80] bottom-4 right-4 left-4 sm:left-auto sm:w-[380px] flex flex-col gap-2 pointer-events-none">
        {items.map((t) => {
          const tone = tones[t.tone];
          return (
            <div
              key={t.id}
              role="status"
              className={`pointer-events-auto flex items-start gap-2.5 p-3.5 rounded-2xl border shadow-elevation animate-slide-up ${tone.bg} ${tone.border} ${tone.text}`}
            >
              <span className="shrink-0 mt-0.5">{tone.icon}</span>
              <div className="flex-1 text-left">
                <p className="text-[13px] font-bold leading-snug">{t.message}</p>
                {t.detail && <p className="text-[11.5px] opacity-80 mt-0.5 leading-snug">{t.detail}</p>}
              </div>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Fermer la notification"
                className="shrink-0 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast doit être utilisé dans un ToastProvider.');
  return ctx;
}
