/**
 * « Marketing digital » — audit §6, patron récurrent.
 * Le live n'affichait que 4 cartes de KPI agrégés. La liste des campagnes
 * individuelles, avec création, modification et arrêt, est rétablie.
 */
import React, { useState } from 'react';
import { Pause, Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../shared/Modal';
import { Select } from './AdminContent';
import { KpiCard, PageHeader, SearchInput, StatusBadge, TableShell, Td, Th, Tr } from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, RefreshingOverlay, SkeletonCards, SkeletonTable } from '../../shared/states';
import { useApi, useDebounced, useMutation } from '../../../lib/hooks';
import { createCampaign, deleteCampaign, listCampaigns, updateCampaign } from '../../../lib/api/admin';
import { fcfa, human, shortDate } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import type { MarketingCampaign } from '../../../lib/data/types';

const PLATFORMS = ['Facebook', 'Instagram', 'Google Ads', 'TikTok'] as const;
const today = () => new Date().toISOString().slice(0, 10);

export const AdminMarketingView: React.FC = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MarketingCampaign | null>(null);
  const [toDelete, setToDelete] = useState<MarketingCampaign | null>(null);
  const debounced = useDebounced(search);

  const [name, setName] = useState('');
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>('Facebook');
  const [budget, setBudget] = useState('');
  const [startDate, setStartDate] = useState(today());
  const [endDate, setEndDate] = useState(today());

  const state = useApi(() => listCampaigns({ search: debounced, page, pageSize: 10 }), [debounced, page]);
  const create = useMutation(createCampaign);
  const update = useMutation(updateCampaign);
  const remove = useMutation(deleteCampaign);

  const openCreate = () => {
    setEditing(null);
    setName(''); setPlatform('Facebook'); setBudget(''); setStartDate(today()); setEndDate(today());
    create.clearError(); update.clearError();
    setFormOpen(true);
  };

  const openEdit = (c: MarketingCampaign) => {
    setEditing(c);
    setName(c.name); setPlatform(c.platform); setBudget(String(c.budget));
    setStartDate(c.startDate.slice(0, 10)); setEndDate(c.endDate.slice(0, 10));
    create.clearError(); update.clearError();
    setFormOpen(true);
  };

  const submit = async () => {
    const payload = { name, platform, budget, startDate, endDate };
    const result = editing ? await update.run(editing.id, payload as any) : await create.run(payload);
    if (result) {
      toast.success(editing ? 'Campagne mise à jour.' : 'Campagne créée.');
      setFormOpen(false);
      state.reload();
    }
  };

  const stop = async (c: MarketingCampaign) => {
    if (await update.run(c.id, { status: 'arretee' })) {
      toast.info(`Campagne « ${c.name} » arrêtée.`);
      state.reload();
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    if (await remove.run(toDelete.id)) {
      toast.success('Campagne supprimée.');
      setToDelete(null);
      state.reload();
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Marketing digital"
        subtitle="Coût d'acquisition et performance campagne par campagne."
        actions={
          <>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Campagne, plateforme…" className="w-full sm:w-64" />
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
              Nouvelle campagne
            </Button>
          </>
        }
      />

      {(update.error || remove.error) && (
        <ErrorState message={(update.error ?? remove.error)!.message} code={(update.error ?? remove.error)!.code} compact />
      )}

      {state.initialLoading ? (
        <><SkeletonCards count={4} /><SkeletonTable rows={6} columns={7} /></>
      ) : state.error || !state.data ? (
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Budget investi" value={fcfa(state.data.kpis.budget)} hint="Toutes campagnes" />
            <KpiCard label="Clics générés" value={state.data.kpis.clicks.toLocaleString('fr-FR')} />
            <KpiCard label="Inscriptions issues d'Ads" value={state.data.kpis.signups.toLocaleString('fr-FR')} tone="success" />
            <KpiCard label="Coût par inscription" value={fcfa(state.data.kpis.costPerSignup)} tone="accent" />
          </div>

          <RefreshingOverlay active={state.loading && !state.initialLoading}>
            <TableShell
              footer={state.data.page.total > 0 ? <Pagination page={state.data.page} onPageChange={setPage} itemLabel="campagnes" /> : undefined}
            >
              {state.data.page.total === 0 ? (
                <EmptyState
                  title="Aucune campagne"
                  description="Crée ta première campagne pour suivre son budget et son coût par inscription."
                  action={<Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>Nouvelle campagne</Button>}
                />
              ) : (
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                    <tr>
                      <Th>Campagne</Th>
                      <Th>Plateforme</Th>
                      <Th>Période</Th>
                      <Th align="right">Budget</Th>
                      <Th align="right">Clics</Th>
                      <Th align="right">Inscriptions</Th>
                      <Th align="right">Coût / inscription</Th>
                      <Th>Statut</Th>
                      <Th align="right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE9DC]">
                    {state.data.page.rows.map((c) => (
                      <Tr key={c.id}>
                        <Td className="font-bold text-[#241F18] whitespace-nowrap">{c.name}</Td>
                        <Td className="text-[#8A8173]">{c.platform}</Td>
                        <Td className="text-[#8A8173] whitespace-nowrap">
                          {shortDate(c.startDate)} → {shortDate(c.endDate)}
                        </Td>
                        <Td align="right" className="text-[#241F18] font-semibold">{fcfa(c.budget)}</Td>
                        <Td align="right" className="text-[#8A8173]">{c.clicks.toLocaleString('fr-FR')}</Td>
                        <Td align="right" className="text-[#2F9E6E] font-semibold">{c.signups.toLocaleString('fr-FR')}</Td>
                        <Td align="right" className="font-serif font-bold text-[#C0512F]">{fcfa(c.costPerSignup)}</Td>
                        <Td>
                          <StatusBadge tone={c.status === 'en_cours' ? 'success' : c.status === 'arretee' ? 'danger' : 'neutral'}>
                            {human(c.status)}
                          </StatusBadge>
                        </Td>
                        <Td align="right">
                          <div className="flex items-center justify-end gap-0.5">
                            <IconButton label={`Modifier ${c.name}`} tone="accent" onClick={() => openEdit(c)}>
                              <Pencil size={15} />
                            </IconButton>
                            <IconButton
                              label={`Arrêter ${c.name}`}
                              disabled={c.status === 'arretee' || update.pending}
                              onClick={() => stop(c)}
                            >
                              <Pause size={15} />
                            </IconButton>
                            <IconButton label={`Supprimer ${c.name}`} tone="danger" onClick={() => setToDelete(c)}>
                              <Trash2 size={15} />
                            </IconButton>
                          </div>
                        </Td>
                      </Tr>
                    ))}
                  </tbody>
                </table>
              )}
            </TableShell>
          </RefreshingOverlay>
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? 'Modifier la campagne' : 'Nouvelle campagne'}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button variant="primary" size="md" isLoading={create.pending || update.pending} loadingLabel="Enregistrement…" onClick={submit}>
              {editing ? 'Enregistrer' : 'Créer la campagne'}
            </Button>
          </>
        }
      >
        {(create.error || update.error) && (
          <div className="mb-4"><ErrorState message={(create.error ?? update.error)!.message} code={(create.error ?? update.error)!.code} compact /></div>
        )}
        <div className="flex flex-col gap-4">
          <Input label="Nom de la campagne" placeholder="Ex. Rentrée Goethe B1" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Select label="Plateforme" value={platform} onChange={(v) => setPlatform(v as any)} options={PLATFORMS.map((p) => ({ value: p, label: p }))} />
            <Input label="Budget (FCFA)" type="number" min={1} placeholder="120000" value={budget} onChange={(e) => setBudget(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Date de début" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Date de fin" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Supprimer cette campagne ?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setToDelete(null)}>Annuler</Button>
            <Button variant="danger" size="md" isLoading={remove.pending} onClick={confirmDelete}>Supprimer</Button>
          </>
        }
      >
        <p className="text-[13px] text-[#3A3226]">
          <strong className="text-[#241F18]">{toDelete?.name}</strong> et ses statistiques seront retirées du suivi.
        </p>
      </Modal>
    </div>
  );
};
