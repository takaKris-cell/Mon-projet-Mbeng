/**
 * Briques d'affichage réutilisées par les portails bureau (Commercial, Admin).
 * Regrouper ces motifs garantit que les mêmes états (chargement, survol, actif)
 * existent partout, au lieu d'être réécrits écran par écran.
 */
import React from 'react';
import { Skeleton } from './states';

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, actions }) => (
  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E4DCCB]">
    <div className="min-w-0">
      <h1 className="font-serif font-bold text-2xl text-[#241F18] leading-tight">{title}</h1>
      {subtitle && <p className="text-xs text-[#8A8173] mt-1 max-w-2xl leading-relaxed">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

export const KpiCard: React.FC<{
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: 'neutral' | 'dark' | 'success' | 'warning' | 'danger' | 'accent';
  loading?: boolean;
  className?: string;
}> = ({ label, value, hint, tone = 'neutral', loading, className = '' }) => {
  const tones = {
    neutral: 'bg-white border-[#E4DCCB] text-[#241F18]',
    dark: 'bg-[#241F18] border-[#3A3226] text-[#FAF7F2]',
    success: 'bg-white border-[#B9E2CC] text-[#1F6B47]',
    warning: 'bg-white border-[#F0D9A8] text-[#A8710A]',
    danger: 'bg-white border-[#F0BDB8] text-[#B3261E]',
    accent: 'bg-white border-[#C0512F]/35 text-[#C0512F]',
  };
  const labelTone = tone === 'dark' ? 'text-[#C0512F]' : 'text-[#8A8173]';

  return (
    <div className={`p-4 rounded-2xl border ${tones[tone]} ${className}`}>
      <span className={`text-[10px] font-bold uppercase tracking-wider block ${labelTone}`}>{label}</span>
      {loading ? (
        <Skeleton className="h-7 w-24 mt-2" />
      ) : (
        <span className="font-serif font-extrabold text-2xl mt-1 block leading-tight">{value}</span>
      )}
      {hint && !loading && (
        <span className={`text-[10.5px] mt-1 block ${tone === 'dark' ? 'text-[#C7BDA8]' : 'text-[#8A8173]'}`}>
          {hint}
        </span>
      )}
    </div>
  );
};

export const ProgressBar: React.FC<{
  value: number;
  tone?: 'accent' | 'success' | 'warning';
  className?: string;
  label?: string;
}> = ({ value, tone = 'accent', className = '', label }) => {
  const colors = { accent: 'bg-[#C0512F]', success: 'bg-[#2F9E6E]', warning: 'bg-[#A8710A]' };
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div
      className={`h-2 rounded-full bg-[#EFE9DC] overflow-hidden ${className}`}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className={`h-full rounded-full transition-[width] duration-500 ${colors[tone]}`} style={{ width: `${pct}%` }} />
    </div>
  );
};

export const StatusBadge: React.FC<{
  children: React.ReactNode;
  tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'accent' | 'info';
}> = ({ children, tone = 'neutral' }) => {
  const tones = {
    neutral: 'bg-[#FAF7F2] text-[#8A8173] border-[#E4DCCB]',
    success: 'bg-[#DDF0E6] text-[#1F6B47] border-[#B9E2CC]',
    warning: 'bg-[#FBF0DC] text-[#A8710A] border-[#F0D9A8]',
    danger: 'bg-[#FBE9E7] text-[#B3261E] border-[#F0BDB8]',
    accent: 'bg-[#FBEDE6] text-[#C0512F] border-[#C0512F]/25',
    info: 'bg-white text-[#241F18] border-[#E4DCCB]',
  };
  return (
    <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap ${tones[tone]}`}>
      {children}
    </span>
  );
};

/** Barre d'onglets / de filtres, avec un état actif franc. */
export const FilterChips = <T extends string>({
  options, value, onChange, ariaLabel,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
}) => (
  <div className="flex flex-wrap gap-2" role="tablist" aria-label={ariaLabel}>
    {options.map((o) => {
      const active = o.value === value;
      return (
        <button
          key={o.value}
          type="button"
          role="tab"
          aria-selected={active}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
            active
              ? 'bg-[#241F18] text-white'
              : 'bg-white border border-[#E4DCCB] text-[#8A8173] hover:text-[#241F18] hover:border-[#C7BDA8] active:bg-[#EFE4D5]'
          }`}
        >
          {o.label}
          {typeof o.count === 'number' && (
            <span className={`ml-1.5 ${active ? 'text-white/70' : 'text-[#B8AF9E]'}`}>{o.count}</span>
          )}
        </button>
      );
    })}
  </div>
);

export const SearchInput: React.FC<{
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ value, onChange, placeholder = 'Rechercher…', className = '' }) => (
  <div className={`relative ${className}`}>
    <svg
      className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8173] pointer-events-none"
      width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
      strokeLinecap="round" aria-hidden="true"
    >
      <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
    </svg>
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full bg-white border border-[#E4DCCB] text-xs font-medium text-[#241F18] pl-9 pr-3 py-2.5 rounded-xl outline-none transition-all hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent"
    />
  </div>
);

/** Conteneur de tableau : défilement horizontal maîtrisé sur petit écran. */
export const TableShell: React.FC<{ children: React.ReactNode; footer?: React.ReactNode }> = ({ children, footer }) => (
  <div className="bg-white rounded-2xl border border-[#E4DCCB] overflow-hidden">
    <div className="overflow-x-auto">{children}</div>
    {footer}
  </div>
);

// Classes statiques : Tailwind ne peut pas générer une classe construite à la volée.
const ALIGN = { left: 'text-left', right: 'text-right', center: 'text-center' } as const;

export const Th: React.FC<{ children: React.ReactNode; align?: keyof typeof ALIGN }> = ({
  children, align = 'left',
}) => (
  <th
    scope="col"
    className={`py-3 px-4 font-semibold text-[10.5px] uppercase tracking-wide text-[#8A8173] whitespace-nowrap ${ALIGN[align]}`}
  >
    {children}
  </th>
);

export const Td: React.FC<{
  children: React.ReactNode;
  align?: keyof typeof ALIGN;
  className?: string;
}> = ({ children, align = 'left', className = '' }) => (
  <td className={`py-3 px-4 text-xs ${ALIGN[align]} ${className}`}>{children}</td>
);

export const Tr: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <tr className="hover:bg-[#FAF7F2] transition-colors">{children}</tr>
);

/** Graphique en barres simple, accessible, sans dépendance externe. */
export const BarChart: React.FC<{
  data: { label: string; value: number }[];
  formatValue: (v: number) => string;
  highlightLast?: boolean;
  height?: number;
}> = ({ data, formatValue, highlightLast = true, height = 160 }) => {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2 sm:gap-4 pt-6 px-1 border-b border-[#EFE9DC]" style={{ height }}>
      {data.map((d, i) => {
        const isLast = highlightLast && i === data.length - 1;
        return (
          <div key={`${d.label}-${i}`} className="flex-1 flex flex-col items-center gap-2 group min-w-0">
            <span className="text-[10px] font-bold text-[#8A8173] group-hover:text-[#241F18] transition-colors whitespace-nowrap">
              {formatValue(d.value)}
            </span>
            <div
              className={`w-full rounded-t-lg transition-all ${
                isLast ? 'bg-[#C0512F]' : 'bg-[#241F18] group-hover:bg-[#3A3226]'
              }`}
              style={{ height: `${Math.max(4, (d.value / max) * 100)}%` }}
              title={`${d.label} : ${formatValue(d.value)}`}
            />
            <span className="text-[10.5px] font-medium text-[#8A8173] truncate max-w-full">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
};

/** Courbe de tendance (sparkline) sur 4 points. */
export const Sparkline: React.FC<{
  data: { label: string; value: number }[];
  formatValue: (v: number) => string;
}> = ({ data, formatValue }) => {
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = data.map((d, i) => {
    const x = (i / Math.max(1, data.length - 1)) * 100;
    const y = 100 - ((d.value - min) / span) * 80 - 10;
    return { x, y, ...d };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');

  return (
    <div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-24" role="img"
        aria-label={`Tendance : ${data.map((d) => `${d.label} ${formatValue(d.value)}`).join(', ')}`}>
        <path d={`${path} L100,100 L0,100 Z`} fill="#2F9E6E" opacity="0.12" />
        <path d={path} fill="none" stroke="#2F9E6E" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#2F9E6E" vectorEffect="non-scaling-stroke" />
        ))}
      </svg>
      <div className="flex justify-between mt-1">
        {data.map((d) => (
          <span key={d.label} className="text-[10px] text-[#8A8173] font-medium">{d.label}</span>
        ))}
      </div>
    </div>
  );
};
