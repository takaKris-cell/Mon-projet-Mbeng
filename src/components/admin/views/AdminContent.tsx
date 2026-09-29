/**
 * Espace « Contenu (CMS) » — reconstruit autour de l'application mobile.
 *
 * L'ancien écran était un formulaire d'ajout posé sur une liste plate : on ne
 * savait ni où l'on publiait, ni ce que l'élève verrait, ni s'il manquait
 * quelque chose. Il est remplacé par un poste de travail en trois volets :
 *
 *   ◀ NAVIGATEUR    la structure réelle de l'application mobile, section par
 *                   section, avec ce qui est publié et ce qui ne l'est pas ;
 *   ■ CONTENU       ce que contient la section, dans l'ORDRE vu par l'élève,
 *                   avec édition, dépublication, réordonnancement, suppression ;
 *   ▶ APERÇU        l'écran mobile correspondant, rendu avec les composants de
 *                   l'application, navigable sans se réidentifier.
 *
 * L'ajout passe par l'assistant : contenu (fichier compris) → aperçu →
 * confirmation cochée → publication.
 */
import React, { useId, useState } from 'react';
import {
  ArrowDown, ArrowUp, Eye, EyeOff, FileWarning, Lock, Paperclip, Pencil, Plus, Trash2,
} from 'lucide-react';
import { Button, IconButton } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../shared/Modal';
import {
  FilterChips, PageHeader, SearchInput, StatusBadge, TableShell, Td, Th, Tr,
} from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, RefreshingOverlay, Skeleton, SkeletonTable } from '../../shared/states';
import { useApi, useDebounced, useMutation } from '../../../lib/hooks';
import {
  deleteContentResource, getSectionContent, listSectionSummaries,
  moveContentResource, publishContent, updateContentResource,
} from '../../../lib/api/content';
import { CONTENT_TYPE_DEFS, findMobileSection, formatBytes } from '../../../lib/data/mobile-sections';
import type { ContentResource } from '../../../lib/data/types';
import { relativeDay } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import { MobilePreview } from './cms/MobilePreview';
import { AddResourceWizard } from './cms/AddResourceWizard';

export const AdminContentView: React.FC = () => {
  const toast = useToast();
  const [sectionId, setSectionId] = useState('bibliotheque');
  const [filter, setFilter] = useState<'tous' | 'publie' | 'brouillon'>('tous');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editing, setEditing] = useState<ContentResource | null>(null);
  const [toDelete, setToDelete] = useState<ContentResource | null>(null);
  const debounced = useDebounced(search);

  const summaries = useApi(listSectionSummaries, [refreshKey]);
  const content = useApi(
    () => getSectionContent(sectionId, { filter, search: debounced, page }),
    [sectionId, filter, debounced, page, refreshKey],
  );

  const update = useMutation(updateContentResource);
  const move = useMutation(moveContentResource);
  const remove = useMutation(deleteContentResource);
  const publish = useMutation(publishContent);

  const section = content.data?.section ?? findMobileSection(sectionId);
  const refresh = () => setRefreshKey((k) => k + 1);

  const selectSection = (id: string) => {
    setSectionId(id);
    setPage(1);
    setSearch('');
    setFilter('tous');
  };

  const togglePublish = async (row: ContentResource) => {
    if (row.status === 'publie') {
      if (await update.run(row.id, { status: 'brouillon', publishedAt: null })) {
        toast.info(`« ${row.title} » retiré de l'application.`, 'Les élèves ne le voient plus.');
        refresh();
      }
      return;
    }
    // Republier passe par la même garde que la première publication.
    const done = await publish.run({ resourceId: row.id, previewChecked: true, contentChecked: true });
    if (done) {
      toast.success(`« ${row.title} » est de nouveau en ligne.`);
      refresh();
    }
  };

  const reorder = async (row: ContentResource, direction: 'up' | 'down') => {
    if (await move.run(row.id, direction)) refresh();
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    if (await remove.run(toDelete.id)) {
      toast.success('Ressource supprimée.', 'Elle disparaît immédiatement de l’application.');
      setToDelete(null);
      refresh();
    }
  };

  const mutationError = update.error ?? move.error ?? remove.error ?? publish.error;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Contenu de l'application"
        subtitle="Parcours l'application mobile section par section, vois exactement ce que voient les élèves, et publie du nouveau contenu après aperçu et confirmation."
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setWizardOpen(true)}
          >
            Ajouter dans « {section.label} »
          </Button>
        }
      />

      {mutationError && <ErrorState message={mutationError.message} code={mutationError.code} compact />}

      <div className="grid grid-cols-1 xl:grid-cols-[260px_minmax(0,1fr)_340px] gap-5 items-start">
        {/* ------------------------------------------------- NAVIGATEUR */}
        <nav className="bg-white rounded-2xl border border-[#E4DCCB] overflow-hidden" aria-label="Sections de l'application mobile">
          <div className="px-4 py-3 border-b border-[#EFE9DC] bg-[#FAF7F2]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A8173]">
              Structure de l'application
            </p>
          </div>

          {summaries.initialLoading ? (
            <div className="p-3 flex flex-col gap-2">
              {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-11 rounded-lg" />)}
            </div>
          ) : summaries.error || !summaries.data ? (
            <div className="p-3">
              <ErrorState message={summaries.error?.message ?? 'Chargement impossible.'} onRetry={summaries.reload} compact />
            </div>
          ) : (
            <ul className="p-2 flex flex-col gap-0.5 max-h-[560px] overflow-y-auto">
              {summaries.data.map((s) => {
                const active = s.id === sectionId;
                return (
                  <li key={s.id}>
                    <button
                      type="button"
                      onClick={() => selectSection(s.id)}
                      aria-current={active ? 'true' : undefined}
                      className={`w-full text-left px-3 py-2.5 rounded-xl transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
                        active
                          ? 'bg-[#241F18] text-white'
                          : 'text-[#241F18] hover:bg-[#F5F1EA] active:bg-[#EFE4D5]'
                      }`}
                    >
                      <span className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold truncate">{s.label}</span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                            active ? 'bg-white/15 text-white' : 'bg-[#FAF7F2] text-[#8A8173]'
                          }`}
                        >
                          {s.published}
                        </span>
                      </span>
                      <span
                        className={`block text-[10.5px] mt-0.5 ${active ? 'text-[#C7BDA8]' : 'text-[#8A8173]'}`}
                      >
                        {s.drafts > 0
                          ? `${s.drafts} brouillon${s.drafts > 1 ? 's' : ''} en attente`
                          : s.lastUpdatedAt
                            ? `Modifié ${relativeDay(s.lastUpdatedAt).toLowerCase()}`
                            : 'Section vide'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        {/* ---------------------------------------------------- CONTENU */}
        <section className="flex flex-col gap-3 min-w-0">
          <div className="bg-white rounded-2xl border border-[#E4DCCB] p-4">
            <h2 className="font-serif font-bold text-lg text-[#241F18]">{section.label}</h2>
            <p className="text-[11.5px] text-[#8A8173] mt-0.5">{section.description}</p>
            <p className="text-[11px] text-[#C0512F] font-semibold mt-1.5">{section.breadcrumb}</p>

            {content.data && (
              <div className="flex flex-wrap gap-2 mt-3">
                <StatusBadge tone="success">{content.data.counts.published} publié(s)</StatusBadge>
                {content.data.counts.drafts > 0 && (
                  <StatusBadge tone="warning">{content.data.counts.drafts} brouillon(s)</StatusBadge>
                )}
                {content.data.counts.premium > 0 && (
                  <StatusBadge tone="accent">{content.data.counts.premium} réservé(s) Premium</StatusBadge>
                )}
                <StatusBadge tone="info">
                  Types acceptés : {section.allowedTypes.map((t) => CONTENT_TYPE_DEFS[t].label).join(', ')}
                </StatusBadge>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <FilterChips
              options={[
                { value: 'tous', label: 'Tout' },
                { value: 'publie', label: 'En ligne' },
                { value: 'brouillon', label: 'Brouillons' },
              ]}
              value={filter}
              onChange={(v) => { setFilter(v); setPage(1); }}
              ariaLabel="Filtrer le contenu de la section"
            />
            <SearchInput
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Titre, description, type…"
              className="w-full sm:w-64"
            />
          </div>

          {content.initialLoading ? (
            <SkeletonTable rows={6} columns={5} />
          ) : content.error || !content.data ? (
            <ErrorState
              message={content.error?.message ?? 'Chargement impossible.'}
              code={content.error?.code}
              onRetry={content.reload}
            />
          ) : (
            <RefreshingOverlay active={content.loading && !content.initialLoading}>
              <TableShell
                footer={
                  content.data.page.total > 0 ? (
                    <Pagination page={content.data.page} onPageChange={setPage} itemLabel="ressources" />
                  ) : undefined
                }
              >
                {content.data.page.total === 0 ? (
                  <EmptyState
                    title="Rien dans cette section"
                    description="Ajoute un premier contenu : il sera d'abord enregistré en brouillon, puis publié après ton aperçu."
                    action={
                      <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={() => setWizardOpen(true)}>
                        Ajouter dans « {section.label} »
                      </Button>
                    }
                  />
                ) : (
                  <table className="w-full min-w-[720px] text-left">
                    <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                      <tr>
                        <Th>Ordre</Th>
                        <Th>Contenu</Th>
                        <Th>Type</Th>
                        <Th>Support</Th>
                        <Th>Statut</Th>
                        <Th align="right">Actions</Th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EFE9DC]">
                      {content.data.page.rows.map((row, index) => {
                        const def = CONTENT_TYPE_DEFS[row.type];
                        const missingFile = def.fileRequired && !row.file;
                        return (
                          <Tr key={row.id}>
                            <Td>
                              <div className="flex items-center gap-1">
                                <span className="text-[11px] font-bold text-[#8A8173] w-5">{row.position}</span>
                                <IconButton
                                  label={`Remonter ${row.title}`}
                                  disabled={index === 0 || move.pending}
                                  onClick={() => reorder(row, 'up')}
                                >
                                  <ArrowUp size={13} />
                                </IconButton>
                                <IconButton
                                  label={`Descendre ${row.title}`}
                                  disabled={index === content.data!.page.rows.length - 1 || move.pending}
                                  onClick={() => reorder(row, 'down')}
                                >
                                  <ArrowDown size={13} />
                                </IconButton>
                              </div>
                            </Td>
                            <Td>
                              <span className="font-bold text-[#241F18] flex items-center gap-1.5">
                                {row.title}
                                {row.premiumOnly && <Lock size={11} className="text-[#A8710A]" />}
                              </span>
                              <span className="block text-[11px] text-[#8A8173] mt-0.5 max-w-[320px] truncate">
                                {row.subtitle || row.body || '—'}
                              </span>
                            </Td>
                            <Td className="text-[#8A8173] whitespace-nowrap">
                              {def.label}
                              {row.durationMin && <span className="block text-[10.5px]">{row.durationMin} min</span>}
                            </Td>
                            <Td>
                              {row.file ? (
                                <span className="flex items-center gap-1.5 text-[#1F6B47]">
                                  <Paperclip size={12} className="shrink-0" />
                                  <span className="truncate max-w-[150px]" title={row.file.name}>{row.file.name}</span>
                                  <span className="text-[10.5px] text-[#8A8173] shrink-0">
                                    {formatBytes(row.file.size)}
                                  </span>
                                </span>
                              ) : missingFile ? (
                                <span className="flex items-center gap-1.5 text-[#B3261E] font-semibold">
                                  <FileWarning size={12} /> Fichier manquant
                                </span>
                              ) : (
                                <span className="text-[#8A8173]">—</span>
                              )}
                            </Td>
                            <Td>
                              <StatusBadge tone={row.status === 'publie' ? 'success' : 'warning'}>
                                {row.status === 'publie' ? 'En ligne' : 'Brouillon'}
                              </StatusBadge>
                              <span className="block text-[10px] text-[#8A8173] mt-0.5">
                                {relativeDay(row.updatedAt)}
                              </span>
                            </Td>
                            <Td align="right">
                              <div className="flex items-center justify-end gap-0.5">
                                <IconButton label={`Modifier ${row.title}`} tone="accent" onClick={() => setEditing(row)}>
                                  <Pencil size={15} />
                                </IconButton>
                                <IconButton
                                  label={row.status === 'publie' ? `Retirer ${row.title}` : `Publier ${row.title}`}
                                  disabled={update.pending || publish.pending || missingFile}
                                  onClick={() => togglePublish(row)}
                                >
                                  {row.status === 'publie' ? <EyeOff size={15} /> : <Eye size={15} />}
                                </IconButton>
                                <IconButton label={`Supprimer ${row.title}`} tone="danger" onClick={() => setToDelete(row)}>
                                  <Trash2 size={15} />
                                </IconButton>
                              </div>
                            </Td>
                          </Tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </TableShell>
            </RefreshingOverlay>
          )}
        </section>

        {/* ----------------------------------------------------- APERÇU */}
        <aside className="bg-white rounded-2xl border border-[#E4DCCB] p-4 xl:sticky xl:top-6">
          <MobilePreview sectionId={sectionId} refreshKey={refreshKey} />
        </aside>
      </div>

      <AddResourceWizard
        open={wizardOpen}
        section={section}
        onClose={() => setWizardOpen(false)}
        onPublished={() => { setWizardOpen(false); refresh(); }}
      />

      <EditResourceModal
        resource={editing}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); refresh(); }}
      />

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Supprimer cette ressource ?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setToDelete(null)}>Annuler</Button>
            <Button variant="danger" size="md" isLoading={remove.pending} onClick={confirmDelete}>
              Supprimer définitivement
            </Button>
          </>
        }
      >
        <p className="text-[13px] text-[#3A3226] leading-relaxed">
          <strong className="text-[#241F18]">{toDelete?.title}</strong> disparaîtra immédiatement de l'application
          mobile{toDelete?.file ? `, ainsi que son fichier ${toDelete.file.name}` : ''}. L'action est journalisée.
        </p>
      </Modal>
    </div>
  );
};

/* ------------------------------------------------------- édition rapide */

const EditResourceModal: React.FC<{
  resource: ContentResource | null;
  onClose: () => void;
  onSaved: () => void;
}> = ({ resource, onClose, onSaved }) => {
  const toast = useToast();
  const update = useMutation(updateContentResource);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [body, setBody] = useState('');
  const [premiumOnly, setPremiumOnly] = useState(false);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  // Synchronise le formulaire avec la ressource ouverte, sans effet différé.
  if (resource && loadedFor !== resource.id) {
    setLoadedFor(resource.id);
    setTitle(resource.title);
    setSubtitle(resource.subtitle);
    setBody(resource.body);
    setPremiumOnly(resource.premiumOnly);
    update.clearError();
  }

  const save = async () => {
    if (!resource) return;
    if (await update.run(resource.id, { title, subtitle, body, premiumOnly })) {
      toast.success('Ressource mise à jour.', 'La modification est visible immédiatement dans l’aperçu.');
      onSaved();
    }
  };

  return (
    <Modal
      open={Boolean(resource)}
      onClose={onClose}
      title="Modifier la ressource"
      description={resource ? CONTENT_TYPE_DEFS[resource.type].label : undefined}
      footer={
        <>
          <Button variant="ghost" size="md" onClick={onClose}>Annuler</Button>
          <Button variant="primary" size="md" isLoading={update.pending} loadingLabel="Enregistrement…" onClick={save}>
            Enregistrer
          </Button>
        </>
      }
    >
      {update.error && (
        <div className="mb-4"><ErrorState message={update.error.message} code={update.error.code} compact /></div>
      )}
      <div className="flex flex-col gap-4">
        <Input label="Titre" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        <Input label="Sous-titre" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
        <div className="flex flex-col gap-1.5 text-left">
          <label htmlFor="edit-body" className="text-xs font-semibold text-[#8A8173]">Description</label>
          <textarea
            id="edit-body"
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="w-full rounded-xl px-3.5 py-3 text-[13.5px] font-medium bg-white border border-[#E4DCCB] text-[#241F18] outline-none transition-all hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent resize-y"
          />
        </div>
        <label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] cursor-pointer">
          <span className="text-xs font-bold text-[#241F18]">Réservé aux abonnés Premium</span>
          <input
            type="checkbox"
            checked={premiumOnly}
            onChange={(e) => setPremiumOnly(e.target.checked)}
            className="w-4 h-4 accent-[#C0512F] cursor-pointer"
          />
        </label>

        {resource?.file && (
          <div className="p-3 rounded-xl bg-[#DDF0E6] border border-[#B9E2CC] flex items-center gap-2.5">
            <Paperclip size={15} className="text-[#1F6B47] shrink-0" />
            <div className="min-w-0">
              <p className="text-xs font-bold text-[#1F6B47] truncate">{resource.file.name}</p>
              <p className="text-[11px] text-[#1F6B47]/75">{formatBytes(resource.file.size)}</p>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------ partagé */

/** Liste déroulante du design system, avec libellé réellement associé au champ. */
export const Select: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  id?: string;
}> = ({ label, value, onChange, options, id }) => {
  const autoId = useId();
  const selectId = id ?? `select-${autoId}`;
  return (
    <div className="flex flex-col gap-1.5 text-left">
      <label htmlFor={selectId} className="text-xs font-semibold text-[#8A8173]">
        {label}
      </label>
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-[#E4DCCB] text-[13.5px] font-medium text-[#241F18] px-3 py-3 rounded-xl outline-none transition-all hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
};
