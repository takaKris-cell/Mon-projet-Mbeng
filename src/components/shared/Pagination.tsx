/**
 * Pagination réelle — audit §3.4 / Manuel §9.3.
 * Le compteur affiché décrit toujours les lignes réellement accessibles :
 * « 11–20 sur 4 812 », avec des pages effectivement navigables.
 */
import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Paginated } from '../../lib/data/types';

interface PaginationProps {
  page: Pick<Paginated<unknown>, 'page' | 'pageCount' | 'pageSize' | 'total'>;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
  pageSizes?: number[];
}

export const Pagination: React.FC<PaginationProps> = ({
  page,
  onPageChange,
  onPageSizeChange,
  itemLabel = 'lignes',
  pageSizes = [10, 25, 50],
}) => {
  const from = page.total === 0 ? 0 : (page.page - 1) * page.pageSize + 1;
  const to = Math.min(page.page * page.pageSize, page.total);

  const windowed: number[] = [];
  const start = Math.max(1, Math.min(page.page - 2, page.pageCount - 4));
  for (let p = start; p <= Math.min(page.pageCount, start + 4); p++) windowed.push(p);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t border-[#EFE9DC] bg-[#FAF7F2]">
      <p className="text-[11.5px] text-[#8A8173] font-medium">
        <span className="font-bold text-[#241F18]">{from.toLocaleString('fr-FR')}–{to.toLocaleString('fr-FR')}</span>{' '}
        sur <span className="font-bold text-[#241F18]">{page.total.toLocaleString('fr-FR')}</span> {itemLabel}
      </p>

      <div className="flex items-center gap-2">
        {onPageSizeChange && (
          <select
            value={page.pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            aria-label="Lignes par page"
            className="bg-white border border-[#E4DCCB] text-[11.5px] font-semibold text-[#241F18] rounded-lg px-2 py-1.5 outline-none hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent transition-colors cursor-pointer"
          >
            {pageSizes.map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}

        <div className="flex items-center gap-1">
          <PageButton
            disabled={page.page <= 1}
            onClick={() => onPageChange(page.page - 1)}
            label="Page précédente"
          >
            <ChevronLeft size={15} />
          </PageButton>

          {windowed[0] > 1 && <span className="px-1 text-[11px] text-[#8A8173]">…</span>}

          {windowed.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page.page ? 'page' : undefined}
              className={`min-w-[30px] h-[30px] px-1.5 rounded-lg text-[11.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
                p === page.page
                  ? 'bg-[#241F18] text-white'
                  : 'bg-white border border-[#E4DCCB] text-[#241F18] hover:border-[#C0512F] hover:text-[#C0512F] active:bg-[#EFE4D5]'
              }`}
            >
              {p}
            </button>
          ))}

          {windowed[windowed.length - 1] < page.pageCount && (
            <span className="px-1 text-[11px] text-[#8A8173]">…</span>
          )}

          <PageButton
            disabled={page.page >= page.pageCount}
            onClick={() => onPageChange(page.page + 1)}
            label="Page suivante"
          >
            <ChevronRight size={15} />
          </PageButton>
        </div>
      </div>
    </div>
  );
};

const PageButton: React.FC<{
  disabled: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}> = ({ disabled, onClick, label, children }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    aria-label={label}
    className="w-[30px] h-[30px] rounded-lg flex items-center justify-center bg-white border border-[#E4DCCB] text-[#241F18] transition-colors hover:border-[#C0512F] hover:text-[#C0512F] active:bg-[#EFE4D5] disabled:text-[#C7BDA8] disabled:border-[#EFE9DC] disabled:cursor-not-allowed disabled:hover:text-[#C7BDA8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40"
  >
    {children}
  </button>
);
