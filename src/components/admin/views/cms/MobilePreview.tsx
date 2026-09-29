/**
 * Aperçu de l'application mobile, intégré au CMS.
 *
 * Il rend l'écran élève de la section sélectionnée avec le MÊME composant que
 * l'application (`ResourceCard`) : ce que l'administrateur voit ici est
 * littéralement ce que l'élève verra.
 *
 * L'administrateur circule d'une section à l'autre sans jamais se
 * réidentifier : les données sont servies par `getMobilePreview`, gardée par
 * SA session admin. Aucune session élève n'est créée, et l'aperçu est en
 * lecture seule.
 */
import React from 'react';
import { Eye, Lock, RefreshCw, Smartphone } from 'lucide-react';
import { ResourceCard } from '../../../shared/mobile/ResourceCard';
import { EmptyState, ErrorState, Skeleton } from '../../../shared/states';
import { useApi } from '../../../../lib/hooks';
import { getMobilePreview } from '../../../../lib/api/content';
import type { ContentResource } from '../../../../lib/data/types';

interface MobilePreviewProps {
  sectionId: string;
  /** Brouillon en cours de relecture : injecté en tête et mis en évidence. */
  draft?: ContentResource | null;
  /** Compact : utilisé dans l'étape « Aperçu » de l'assistant. */
  compact?: boolean;
  /** Clé de rafraîchissement : change quand le contenu est modifié. */
  refreshKey?: number;
}

export const MobilePreview: React.FC<MobilePreviewProps> = ({
  sectionId, draft = null, compact, refreshKey = 0,
}) => {
  const state = useApi(
    () => getMobilePreview(sectionId, draft?.id),
    [sectionId, draft?.id, refreshKey],
  );

  const items = state.data
    ? draft && !state.data.items.some((i) => i.id === draft.id)
      ? [draft, ...state.data.items]
      : state.data.items
    : [];

  const section = state.data?.section;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Smartphone size={15} className="text-[#C0512F] shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-[#241F18]">Aperçu application mobile</p>
            <p className="text-[10.5px] text-[#8A8173] truncate">
              {section?.breadcrumb ?? 'Chargement…'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={state.reload}
          aria-label="Rafraîchir l'aperçu"
          className="w-7 h-7 rounded-lg flex items-center justify-center text-[#8A8173] hover:text-[#241F18] hover:bg-[#F5F1EA] transition-colors shrink-0"
        >
          <RefreshCw size={14} className={state.loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Cadre téléphone */}
      <div
        className={`mx-auto w-full bg-[#FAF7F2] rounded-[30px] border-[7px] border-[#241F18] ring-1 ring-[#3A3226] overflow-hidden shadow-elevation flex flex-col ${
          compact ? 'max-w-[300px] h-[460px]' : 'max-w-[320px] h-[560px]'
        }`}
      >
        <div className="px-5 pt-2 pb-1.5 flex items-center justify-between text-[10px] font-bold text-[#241F18] border-b border-[#E4DCCB]/50 shrink-0">
          <span>09:41</span>
          <span className="w-14 h-3 bg-[#241F18] rounded-full" />
          <span>100%</span>
        </div>

        <div className="flex-1 overflow-y-auto">
          {state.initialLoading ? (
            <div className="p-4 flex flex-col gap-2.5">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-[62px] rounded-xl" />
              <Skeleton className="h-[62px] rounded-xl" />
              <Skeleton className="h-[62px] rounded-xl" />
            </div>
          ) : state.error ? (
            <div className="p-4">
              <ErrorState message={state.error.message} code={state.error.code} onRetry={state.reload} compact />
            </div>
          ) : (
            <div className="p-4 flex flex-col gap-2.5">
              <div className="pb-1">
                <h2 className="font-serif font-bold text-lg text-[#241F18] leading-tight">{section?.label}</h2>
                <p className="text-[11px] text-[#8A8173] mt-0.5">
                  {items.length} élément{items.length > 1 ? 's' : ''} visible{items.length > 1 ? 's' : ''}
                </p>
              </div>

              {items.length === 0 ? (
                <EmptyState
                  icon={<Eye size={20} />}
                  title="Section vide"
                  description="Aucun contenu publié : l’élève ne voit rien ici pour le moment."
                />
              ) : (
                items.map((item) => (
                  <div key={item.id}>
                    {draft?.id === item.id && (
                      <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#C0512F] mb-1">
                        Nouveau — en attente de publication
                      </p>
                    )}
                    <ResourceCard
                      resource={item}
                      layout={section?.layout ?? 'liste'}
                      highlighted={draft?.id === item.id}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      <p className="text-[10.5px] text-[#8A8173] text-center flex items-center justify-center gap-1.5">
        <Lock size={11} />
        Aperçu en lecture seule, servi par ta session administrateur.
      </p>
    </div>
  );
};
