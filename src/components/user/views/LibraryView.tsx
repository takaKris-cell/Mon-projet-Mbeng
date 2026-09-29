/**
 * Bibliothèque — branchée sur le CMS.
 * Les ressources affichées ici sont exactement celles publiées depuis
 * l'Administration : dépublier une ressource la fait disparaître de cet écran.
 * Plus aucune liste codée en dur, et le total annoncé correspond au nombre de
 * ressources réellement accessibles.
 */
import React, { useState } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from '../../ui/Button';
import { ResourceCard } from '../../shared/mobile/ResourceCard';
import { EmptyState, ErrorState, Skeleton } from '../../shared/states';
import { useApi, useDebounced } from '../../../lib/hooks';
import { listLibrary } from '../../../lib/api/user';

interface LibraryViewProps {
  onOpenAudio: () => void;
  onOpenExam: () => void;
}

const TABS = [
  { id: 'tous', label: 'Tout' },
  { id: 'modelltest', label: 'Examens blancs' },
  { id: 'podcast', label: 'Podcasts & audios' },
  { id: 'fiche', label: 'Grammaire & fiches' },
  { id: 'livre', label: 'Livres' },
  { id: 'video', label: 'Vidéos' },
] as const;

const LEVELS = ['tous', 'A1', 'A2', 'B1', 'B2', 'C1'] as const;

export const LibraryView: React.FC<LibraryViewProps> = ({ onOpenAudio, onOpenExam }) => {
  const [type, setType] = useState<string>('tous');
  const [level, setLevel] = useState<string>('tous');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounced(search);

  const state = useApi(
    () => listLibrary({ type, level, search: debounced, page, pageSize: 8 }),
    [type, level, debounced, page],
  );

  const reset = () => { setType('tous'); setLevel('tous'); setSearch(''); setPage(1); };

  return (
    <div className="pb-8 animate-fade-in text-left">
      <div className="px-5 pt-4 pb-3">
        <h2 className="font-serif font-bold text-2xl text-[#241F18]">Bibliothèque</h2>
        <p className="text-xs text-[#8A8173]">
          {state.data
            ? `${state.data.total} ressource${state.data.total > 1 ? 's' : ''} publiée${state.data.total > 1 ? 's' : ''}`
            : 'Chargement des ressources…'}
        </p>
      </div>

      <div className="px-5 mb-3">
        <div className="relative flex items-center">
          <Search size={16} className="absolute left-3.5 text-[#8A8173] pointer-events-none" />
          <input
            type="search"
            placeholder="Rechercher une leçon, un audio, un examen…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full bg-white border border-[#E4DCCB] text-[#241F18] text-xs font-medium pl-10 pr-4 py-2.5 rounded-xl outline-none transition-all hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent"
          />
        </div>
      </div>

      <div className="px-5 flex gap-2 overflow-x-auto pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => { setType(tab.id); setPage(1); }}
            aria-pressed={type === tab.id}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
              type === tab.id
                ? 'bg-[#241F18] text-white'
                : 'bg-white border border-[#E4DCCB] text-[#8A8173] hover:text-[#241F18] hover:border-[#C7BDA8] active:bg-[#EFE4D5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="px-5 flex gap-2 overflow-x-auto pb-2">
        {LEVELS.map((l) => (
          <button
            key={l}
            type="button"
            onClick={() => { setLevel(l); setPage(1); }}
            aria-pressed={level === l}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
              level === l
                ? 'bg-[#FBEDE6] text-[#C0512F] border border-[#C0512F]'
                : 'bg-white border border-[#E4DCCB] text-[#8A8173] hover:text-[#241F18]'
            }`}
          >
            {l === 'tous' ? 'Tous niveaux' : l}
          </button>
        ))}
      </div>

      <div className="px-5 mt-3 flex flex-col gap-2.5">
        {state.initialLoading ? (
          <>
            <Skeleton className="h-[66px] rounded-xl" />
            <Skeleton className="h-[66px] rounded-xl" />
            <Skeleton className="h-[66px] rounded-xl" />
            <Skeleton className="h-[66px] rounded-xl" />
          </>
        ) : state.error ? (
          <ErrorState message={state.error.message} code={state.error.code} onRetry={state.reload} />
        ) : !state.data || state.data.total === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4DCCB]">
            <EmptyState
              title="Aucune ressource ne correspond"
              description="Change de filtre ou de mot-clé pour explorer la bibliothèque."
              action={<Button variant="secondary" size="sm" onClick={reset}>Réinitialiser</Button>}
            />
          </div>
        ) : (
          <>
            {/* Même composant de rendu que l'aperçu du CMS : les deux ne peuvent pas diverger. */}
            {state.data.rows.map((item) => (
              <ResourceCard
                key={item.id}
                resource={item}
                layout="liste"
                onOpen={() => (item.type === 'podcast' ? onOpenAudio() : onOpenExam())}
              />
            ))}

            {state.data.page < state.data.pageCount && (
              <Button
                variant="secondary"
                size="md"
                fullWidth
                isLoading={state.loading}
                loadingLabel="Chargement…"
                rightIcon={<ChevronDown size={16} />}
                onClick={() => setPage((p) => p + 1)}
              >
                Charger la suite ({state.data.total - state.data.page * state.data.pageSize} restantes)
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
};
