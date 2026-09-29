/**
 * Marketplace Betreuer — audit §4.
 * Corrections : les filtres « Horaires » et « Diplôme », promis par le texte de
 * l'écran et absents de la modale, existent désormais ; le style des chips de
 * la liste et celui des boutons segmentés de la modale sont identiques (même
 * composant) ; la liste est servie par l'API avec états de chargement et vide.
 */
import React, { useState } from 'react';
import {
  CheckCircle2, ChevronRight, Clock, GraduationCap, MapPin, Search, SlidersHorizontal, Star, Video, X,
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../../shared/states';
import { useApi, useDebounced } from '../../../lib/hooks';
import { listBetreuers, type BetreuerFilters } from '../../../lib/api/user';
import { DIPLOMA_LABELS, TIME_SLOT_LABELS, type BetreuerRecord } from '../../../data/content';
import { fcfa } from '../../../lib/format';

interface Props {
  onSelectBetreuer: (betreuer: BetreuerRecord) => void;
  onBecomeBetreuer: () => void;
}

type Chip = { value: string; label: string; icon?: React.ReactNode };

/** Chip unique, utilisé à l'identique dans la liste ET dans la modale. */
const Chip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active, onClick, children,
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-pressed={active}
    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
      active
        ? 'bg-[#241F18] text-white'
        : 'bg-white border border-[#E4DCCB] text-[#8A8173] hover:text-[#241F18] hover:border-[#C7BDA8] active:bg-[#EFE4D5]'
    }`}
  >
    <span className="flex items-center gap-1.5">{children}</span>
  </button>
);

const FORMATS: Chip[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'presentiel', label: 'Présentiel', icon: <MapPin size={13} /> },
  { value: 'en_ligne', label: 'En ligne', icon: <Video size={13} /> },
];

const LEVELS: Chip[] = [
  { value: 'tous', label: 'Tous niveaux' },
  { value: 'A1', label: 'A1' }, { value: 'A2', label: 'A2' },
  { value: 'B1', label: 'B1' }, { value: 'B2', label: 'B2' }, { value: 'C1', label: 'C1' },
];

const SLOTS: Chip[] = [
  { value: 'tous', label: 'Tous les horaires' },
  ...Object.entries(TIME_SLOT_LABELS).map(([value, label]) => ({ value, label })),
];

const DIPLOMAS: Chip[] = [
  { value: 'tous', label: 'Tous les diplômes' },
  ...Object.entries(DIPLOMA_LABELS).map(([value, label]) => ({ value, label })),
];

export const BetreuerMarketplaceView: React.FC<Props> = ({ onSelectBetreuer, onBecomeBetreuer }) => {
  const [search, setSearch] = useState('');
  const [format, setFormat] = useState<NonNullable<BetreuerFilters['format']>>('tous');
  const [level, setLevel] = useState('tous');
  const [timeSlot, setTimeSlot] = useState<NonNullable<BetreuerFilters['timeSlot']>>('tous');
  const [diploma, setDiploma] = useState<NonNullable<BetreuerFilters['diploma']>>('tous');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const debounced = useDebounced(search);

  const activeFilters =
    (format !== 'tous' ? 1 : 0) + (level !== 'tous' ? 1 : 0) +
    (timeSlot !== 'tous' ? 1 : 0) + (diploma !== 'tous' ? 1 : 0) + (availableOnly ? 1 : 0);

  const state = useApi(
    () => listBetreuers({ search: debounced, format, level, timeSlot, diploma, availableThisWeek: availableOnly }),
    [debounced, format, level, timeSlot, diploma, availableOnly],
  );

  const reset = () => {
    setFormat('tous'); setLevel('tous'); setTimeSlot('tous'); setDiploma('tous'); setAvailableOnly(false);
  };

  return (
    <div className="pb-8 animate-fade-in text-left">
      <div className="px-5 pt-4 pb-2">
        <h2 className="font-serif font-bold text-2xl text-[#241F18]">Trouver un Betreuer</h2>
        <p className="text-xs text-[#8A8173] mt-0.5">
          Des tuteurs certifiés, filtrables par niveau, format, horaires et diplôme.
        </p>
      </div>

      <div className="px-5 my-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8A8173] pointer-events-none" />
          <input
            type="search"
            placeholder="Nom, ville, spécialité…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-[#E4DCCB] text-[#241F18] text-xs font-medium pl-10 pr-3 py-2.5 rounded-xl outline-none transition-all hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent"
          />
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-label="Filtres avancés"
          className={`relative p-2.5 rounded-xl border flex items-center justify-center transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
            activeFilters > 0
              ? 'bg-[#C0512F] text-white border-[#C0512F]'
              : 'bg-white border-[#E4DCCB] text-[#241F18] hover:border-[#C7BDA8] active:bg-[#F5F1EA]'
          }`}
        >
          <SlidersHorizontal size={18} />
          {activeFilters > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4.5 h-4.5 min-w-[18px] h-[18px] rounded-full bg-[#241F18] text-white text-[10px] font-bold flex items-center justify-center">
              {activeFilters}
            </span>
          )}
        </button>
      </div>

      <div className="px-5 flex items-center gap-2 overflow-x-auto pb-2">
        {FORMATS.map((f) => (
          <Chip key={f.value} active={format === f.value} onClick={() => setFormat(f.value as any)}>
            {f.icon}{f.label}
          </Chip>
        ))}
        <Chip active={availableOnly} onClick={() => setAvailableOnly((v) => !v)}>
          Disponible cette semaine
        </Chip>
      </div>

      <div className="px-5 mt-2 flex flex-col gap-3">
        {state.initialLoading ? (
          <>
            <Skeleton className="h-[108px] rounded-xl" />
            <Skeleton className="h-[108px] rounded-xl" />
            <Skeleton className="h-[108px] rounded-xl" />
          </>
        ) : state.error ? (
          <ErrorState message={state.error.message} code={state.error.code} onRetry={state.reload} />
        ) : !state.data || state.data.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E4DCCB]">
            <EmptyState
              title="Aucun Betreuer ne correspond"
              description="Élargis tes critères pour voir plus de tuteurs disponibles."
              action={<Button variant="secondary" size="sm" onClick={reset}>Réinitialiser les filtres</Button>}
            />
          </div>
        ) : (
          state.data.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBetreuer(b)}
              className="w-full p-4 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] active:bg-[#FAF7F2] cursor-pointer transition-all flex flex-col gap-2.5 group text-left outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative shrink-0">
                    <img src={b.avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover border border-[#E4DCCB]" />
                    {b.verified && (
                      <span className="absolute -bottom-1 -right-1 bg-[#2F9E6E] text-white p-0.5 rounded-full border border-white">
                        <CheckCircle2 size={12} />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-serif font-bold text-sm text-[#241F18] group-hover:text-[#C0512F] transition-colors">
                        {b.name}
                      </span>
                      <span className="flex items-center gap-0.5 text-xs font-bold text-[#A8710A]">
                        <Star size={13} className="fill-[#A8710A]" />
                        {b.rating}
                        <span className="text-[10px] text-[#8A8173] font-normal">({b.reviewCount})</span>
                      </span>
                    </span>
                    <span className="block text-[11px] text-[#8A8173] font-medium mt-0.5 truncate">{b.title}</span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="font-serif font-bold text-sm text-[#C0512F] block">{fcfa(b.hourlyRate)}</span>
                  <span className="text-[10px] text-[#8A8173]">/ heure</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <Tag icon={<GraduationCap size={11} />}>{DIPLOMA_LABELS[b.diplomaType]}</Tag>
                {b.timeSlots.map((s) => (
                  <Tag key={s} icon={<Clock size={11} />}>{TIME_SLOT_LABELS[s].split(' ')[0]}</Tag>
                ))}
                {b.availableThisWeek && <Tag tone="success">Dispo cette semaine</Tag>}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#8A8173] pt-2 border-t border-[#EFE9DC]">
                <span className="flex items-center gap-1 truncate">
                  <MapPin size={12} className="shrink-0" /> {b.city}
                </span>
                <span className="text-[#C0512F] font-bold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform shrink-0">
                  Voir le profil <ChevronRight size={13} />
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div className="absolute inset-0 bg-[#241F18]/45 animate-fade-in" onClick={() => setModalOpen(false)} />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Filtres avancés Betreuer"
            className="relative bg-[#FAF7F2] w-full sm:max-w-sm rounded-t-3xl sm:rounded-3xl border border-[#E4DCCB] shadow-elevation animate-slide-up text-left max-h-[85vh] flex flex-col"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4DCCB] shrink-0">
              <h3 className="font-serif font-bold text-base text-[#241F18]">Filtres avancés</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                aria-label="Fermer"
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#8A8173] hover:bg-[#F5F1EA] active:bg-[#EFE4D5] transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4 flex flex-col gap-5 overflow-y-auto">
              <FilterGroup label="Format de cours">
                {FORMATS.map((f) => (
                  <Chip key={f.value} active={format === f.value} onClick={() => setFormat(f.value as any)}>
                    {f.icon}{f.label}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Niveau enseigné">
                {LEVELS.map((l) => (
                  <Chip key={l.value} active={level === l.value} onClick={() => setLevel(l.value)}>{l.label}</Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Horaires">
                {SLOTS.map((s) => (
                  <Chip key={s.value} active={timeSlot === s.value} onClick={() => setTimeSlot(s.value as any)}>
                    {s.label}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Diplôme">
                {DIPLOMAS.map((d) => (
                  <Chip key={d.value} active={diploma === d.value} onClick={() => setDiploma(d.value as any)}>
                    {d.label}
                  </Chip>
                ))}
              </FilterGroup>

              <FilterGroup label="Disponibilité">
                <Chip active={availableOnly} onClick={() => setAvailableOnly((v) => !v)}>
                  Disponible cette semaine
                </Chip>
              </FilterGroup>
            </div>

            <div className="flex gap-2 px-5 py-4 border-t border-[#E4DCCB] shrink-0">
              <Button variant="secondary" size="md" fullWidth onClick={reset}>Réinitialiser</Button>
              <Button variant="primary" size="md" fullWidth onClick={() => setModalOpen(false)}>
                Voir les résultats{state.data ? ` (${state.data.length})` : ''}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="px-5 mt-6">
        <button
          type="button"
          onClick={onBecomeBetreuer}
          className="w-full p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] active:bg-[#FAF7F2] flex items-center justify-between gap-3 transition-all text-left outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40"
        >
          <span>
            <span className="block text-xs font-bold text-[#241F18]">Tu es diplômé B2 ou bilingue allemand ?</span>
            <span className="block text-[10.5px] text-[#8A8173]">
              Rejoins le réseau de tuteurs certifiés et fixe ton tarif horaire.
            </span>
          </span>
          <span className="text-xs font-bold text-[#C0512F] whitespace-nowrap">Devenir Betreuer →</span>
        </button>
      </div>
    </div>
  );
};

const FilterGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <span className="text-xs font-semibold text-[#8A8173] block mb-2">{label}</span>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);

const Tag: React.FC<{ children: React.ReactNode; icon?: React.ReactNode; tone?: 'neutral' | 'success' }> = ({
  children, icon, tone = 'neutral',
}) => (
  <span
    className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
      tone === 'success'
        ? 'bg-[#DDF0E6] text-[#1F6B47] border-[#B9E2CC]'
        : 'bg-[#FAF7F2] text-[#3A3226] border-[#E4DCCB]'
    }`}
  >
    {icon}{children}
  </span>
);
