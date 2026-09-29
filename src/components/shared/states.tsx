/**
 * États transverses d'un écran branché sur de vraies données :
 * chargement (squelette), erreur (avec réessai), vide.
 * Aucun tableau ni aucune carte ne se rend sans passer par ces états.
 */
import React from 'react';
import { AlertTriangle, Inbox, RefreshCw } from 'lucide-react';

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`mbeng-skeleton rounded-lg ${className}`} aria-hidden="true" />
);

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ lines = 3, className = '' }) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={`h-3.5 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} />
    ))}
  </div>
);

export const SkeletonCards: React.FC<{ count?: number; className?: string }> = ({ count = 4, className = '' }) => (
  <div className={`grid grid-cols-2 md:grid-cols-4 gap-3 ${className}`}>
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-[92px] rounded-2xl" />
    ))}
  </div>
);

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ rows = 6, columns = 5 }) => (
  <div className="bg-white rounded-2xl border border-[#E4DCCB] overflow-hidden">
    <div className="bg-[#FAF7F2] border-b border-[#E4DCCB] px-4 py-3">
      <Skeleton className="h-3 w-40" />
    </div>
    <div className="divide-y divide-[#EFE9DC]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3.5 flex items-center gap-4">
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton key={c} className={`h-3 ${c === 0 ? 'w-1/4' : 'flex-1'}`} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const ErrorState: React.FC<{
  message: string;
  code?: string;
  onRetry?: () => void;
  compact?: boolean;
}> = ({ message, code, onRetry, compact }) => (
  <div
    role="alert"
    className={`rounded-2xl bg-[#FBE9E7] border border-[#F0BDB8] text-left flex items-start gap-3 ${
      compact ? 'p-3' : 'p-5'
    }`}
  >
    <AlertTriangle size={compact ? 16 : 20} className="text-[#B3261E] shrink-0 mt-0.5" />
    <div className="flex-1">
      <p className="text-[13px] font-bold text-[#B3261E] leading-snug">{message}</p>
      {code && <p className="text-[11px] text-[#B3261E]/70 font-mono mt-0.5">{code}</p>}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[#B3261E] hover:text-[#7D1913] underline underline-offset-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B3261E]/40 rounded"
        >
          <RefreshCw size={13} /> Réessayer
        </button>
      )}
    </div>
  </div>
);

export const EmptyState: React.FC<{
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="py-12 px-6 flex flex-col items-center text-center gap-2">
    <div className="w-12 h-12 rounded-2xl bg-[#F5F1EA] border border-[#E4DCCB] text-[#8A8173] flex items-center justify-center">
      {icon ?? <Inbox size={22} />}
    </div>
    <h4 className="font-serif font-bold text-base text-[#241F18] mt-1">{title}</h4>
    {description && <p className="text-xs text-[#8A8173] max-w-xs leading-relaxed">{description}</p>}
    {action && <div className="mt-3">{action}</div>}
  </div>
);

/** Petit voile discret pendant un rechargement (la donnée précédente reste lisible). */
export const RefreshingOverlay: React.FC<{ active: boolean; children: React.ReactNode }> = ({ active, children }) => (
  <div className={`relative transition-opacity duration-200 ${active ? 'opacity-55' : 'opacity-100'}`}>
    {children}
    {active && (
      <div className="absolute inset-0 flex items-start justify-center pt-6 pointer-events-none">
        <span className="mbeng-spinner-sm" />
      </div>
    )}
  </div>
);
