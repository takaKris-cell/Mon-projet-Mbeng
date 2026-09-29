/**
 * « Charges » — audit §6, patron récurrent.
 * Le live n'affichait qu'un total et un formulaire d'ajout. L'historique des
 * charges individuelles, avec édition et suppression, est rétabli — et chaque
 * écriture met à jour le grand livre, donc la comptabilité reste cohérente.
 */
import React, { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Button, IconButton } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../shared/Modal';
import { Select } from './AdminContent';
import { KpiCard, PageHeader, SearchInput, StatusBadge, TableShell, Td, Th, Tr } from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, RefreshingOverlay, SkeletonCards, SkeletonTable } from '../../shared/states';
import { useApi, useDebounced, useMutation } from '../../../lib/hooks';
import { createCharge, deleteCharge, listCharges, updateCharge } from '../../../lib/api/admin';
import { eur, fcfa, human, shortDate } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import type { Charge } from '../../../lib/data/types';

const CATEGORIES = ['infrastructure', 'marketing', 'physique', 'rh', 'autre'] as const;

export const AdminChargesView: React.FC = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Charge | null>(null);
  const [toDelete, setToDelete] = useState<Charge | null>(null);
  const debounced = useDebounced(search);

  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>('infrastructure');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  const state = useApi(() => listCharges({ search: debounced, page, pageSize: 10 }), [debounced, page]);
  const create = useMutation(createCharge);
  const update = useMutation(updateCharge);
  const remove = useMutation(deleteCharge);

  const openCreate = () => {
    setEditing(null);
    setLabel(''); setCategory('infrastructure'); setAmount(''); setDate(new Date().toISOString().slice(0, 10));
    create.clearError(); update.clearError();
    setFormOpen(true);
  };

  const openEdit = (c: Charge) => {
    setEditing(c);
    setLabel(c.label); setCategory(c.category); setAmount(String(c.amount)); setDate(c.date.slice(0, 10));
    create.clearError(); update.clearError();
    setFormOpen(true);
  };

  const submit = async () => {
    const result = editing
      ? await update.run(editing.id, { label, amount: Number(amount) })
      : await create.run({ label, category, amount, date });
    if (result) {
      toast.success(
        editing ? 'Charge mise à jour.' : 'Charge enregistrée.',
        'Le grand livre du mois et la comptabilité globale sont recalculés.',
      );
      setFormOpen(false);
      state.reload();
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    if (await remove.run(toDelete.id)) {
      toast.success('Charge supprimée.', 'Le total du mois a été recalculé.');
      setToDelete(null);
      state.reload();
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Charges de l'entreprise"
        subtitle="Historique complet des dépenses, avec modification et suppression. Chaque écriture met immédiatement à jour la comptabilité."
        actions={
          <>
            <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Libellé, catégorie…" className="w-full sm:w-64" />
            <Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>
              Enregistrer une dépense
            </Button>
          </>
        }
      />

      {(update.error || remove.error) && (
        <ErrorState message={(update.error ?? remove.error)!.message} code={(update.error ?? remove.error)!.code} compact />
      )}

      {state.initialLoading ? (
        <><SkeletonCards count={3} /><SkeletonTable rows={7} columns={5} /></>
      ) : state.error || !state.data ? (
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <KpiCard
              label={`Total — ${state.data.monthLabel}`}
              value={fcfa(state.data.monthTotal)}
              hint={`≈ ${eur(state.data.monthTotal)}`}
              tone="dark"
              className="sm:col-span-1"
            />
            {state.data.byCategory.slice(0, 2).map((c) => (
              <KpiCard key={c.label} label={human(c.label)} value={fcfa(c.amount)} hint="Ce mois-ci" tone="warning" />
            ))}
          </div>

          <RefreshingOverlay active={state.loading && !state.initialLoading}>
            <TableShell
              footer={state.data.page.total > 0 ? <Pagination page={state.data.page} onPageChange={setPage} itemLabel="charges" /> : undefined}
            >
              {state.data.page.total === 0 ? (
                <EmptyState
                  title="Aucune charge ce mois-ci"
                  description="Enregistre une dépense pour la voir apparaître ici et dans la comptabilité."
                  action={<Button variant="primary" size="sm" leftIcon={<Plus size={14} />} onClick={openCreate}>Enregistrer une dépense</Button>}
                />
              ) : (
                <table className="w-full min-w-[700px] text-left">
                  <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                    <tr>
                      <Th>Dépense</Th>
                      <Th>Catégorie</Th>
                      <Th>Date</Th>
                      <Th align="right">Montant</Th>
                      <Th align="right">Équivalent €</Th>
                      <Th align="right">Actions</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EFE9DC]">
                    {state.data.page.rows.map((c) => (
                      <Tr key={c.id}>
                        <Td className="font-bold text-[#241F18]">{c.label}</Td>
                        <Td><StatusBadge tone="neutral">{human(c.category)}</StatusBadge></Td>
                        <Td className="text-[#8A8173] whitespace-nowrap">{shortDate(c.date)}</Td>
                        <Td align="right" className="font-serif font-bold text-[#241F18] whitespace-nowrap">{fcfa(c.amount)}</Td>
                        <Td align="right" className="text-[#8A8173] whitespace-nowrap">{eur(c.amount)}</Td>
                        <Td align="right">
                          <div className="flex items-center justify-end gap-0.5">
                            <IconButton label={`Modifier ${c.label}`} tone="accent" onClick={() => openEdit(c)}>
                              <Pencil size={15} />
                            </IconButton>
                            <IconButton label={`Supprimer ${c.label}`} tone="danger" onClick={() => setToDelete(c)}>
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
        title={editing ? 'Modifier la charge' : 'Enregistrer une dépense'}
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setFormOpen(false)}>Annuler</Button>
            <Button variant="primary" size="md" isLoading={create.pending || update.pending} loadingLabel="Enregistrement…" onClick={submit}>
              {editing ? 'Enregistrer' : 'Ajouter la charge'}
            </Button>
          </>
        }
      >
        {(create.error || update.error) && (
          <div className="mb-4"><ErrorState message={(create.error ?? update.error)!.message} code={(create.error ?? update.error)!.code} compact /></div>
        )}
        <div className="flex flex-col gap-4">
          <Input label="Libellé de la charge" placeholder="Ex. Hébergement cloud (serveurs)" value={label} onChange={(e) => setLabel(e.target.value)} autoFocus />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select label="Catégorie" value={category} onChange={(v) => setCategory(v as any)} options={CATEGORIES.map((c) => ({ value: c, label: human(c) }))} />
            <Input label="Montant (FCFA)" type="number" min={1} placeholder="45000" value={amount} onChange={(e) => setAmount(e.target.value)} />
            <Input label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={Boolean(editing)} />
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        title="Supprimer cette charge ?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="md" onClick={() => setToDelete(null)}>Annuler</Button>
            <Button variant="danger" size="md" isLoading={remove.pending} onClick={confirmDelete}>Supprimer</Button>
          </>
        }
      >
        <p className="text-[13px] text-[#3A3226]">
          <strong className="text-[#241F18]">{toDelete?.label}</strong> ({fcfa(toDelete?.amount ?? 0)}) sera retirée du
          grand livre. Le bénéfice net du mois sera recalculé immédiatement.
        </p>
      </Modal>
    </div>
  );
};
