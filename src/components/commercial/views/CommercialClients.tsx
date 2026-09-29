/**
 * « Mes clients » — audit §5.
 * Rétablit : barre de recherche, chips de filtre, 4 cartes résumé, les
 * 9 colonnes prévues (dont Email, Ville, Activité, Dernière activité), le
 * bouton de relance réellement fonctionnel, et une pagination réelle :
 * le compteur du titre correspond au nombre de lignes accessibles.
 */
import React, { useState } from 'react';
import { PhoneCall } from 'lucide-react';
import { IconButton } from '../../ui/Button';
import {
  FilterChips, KpiCard, PageHeader, SearchInput, StatusBadge, TableShell, Td, Th, Tr,
} from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, RefreshingOverlay, SkeletonCards, SkeletonTable } from '../../shared/states';
import { useApi, useDebounced, useMutation } from '../../../lib/hooks';
import { followUpClient, listAgentClients, type ClientFilter } from '../../../lib/api/agent';
import { fcfa, human, relativeDay, shortDate } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import { AGENT_CONVERSION_BONUS, AGENT_SIGNUP_BONUS } from '../../../lib/business/constants';

const FILTERS: { value: ClientFilter; label: string }[] = [
  { value: 'tous', label: 'Tous' },
  { value: 'premium', label: 'Premium' },
  { value: 'gratuit', label: 'Gratuit' },
  { value: 'actifs', label: 'Actifs' },
  { value: 'inactifs', label: 'Inactifs' },
];

export const CommercialClients: React.FC = () => {
  const toast = useToast();
  const [filter, setFilter] = useState<ClientFilter>('tous');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounced = useDebounced(search);

  const state = useApi(
    () => listAgentClients({ filter, search: debounced, page, pageSize }),
    [filter, debounced, page, pageSize],
  );
  const followUp = useMutation(followUpClient);

  const relance = async (clientId: string, name: string, phone: string) => {
    const updated = await followUp.run(clientId);
    if (updated) {
      toast.success(`Relance enregistrée pour ${name}.`, 'Le statut passe en « En cours de relance » et l’action est journalisée.');
      window.open(
        `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(
          `Bonjour ${name}, c'est ton conseiller Mon Projet Mbeng. Où en es-tu dans ta préparation ?`,
        )}`,
        '_blank',
        'noopener',
      );
      state.reload();
    }
  };

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Mes clients" subtitle="Chargement de ton portefeuille…" />
        <SkeletonCards count={4} />
        <SkeletonTable rows={8} columns={6} />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Mes clients" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const { page: result, summary } = state.data;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title={`Mes clients (${summary.total})`}
        subtitle="Relance tes comptes gratuits pour débloquer tes commissions Premium. Le bouton de relance enregistre le contact et ouvre WhatsApp."
        actions={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom, téléphone, email, ville…" className="w-full sm:w-72" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Comptes au total" value={summary.total} hint={`${fcfa(AGENT_SIGNUP_BONUS)} par compte actif`} />
        <KpiCard label="Clients Premium" value={summary.premium} hint={`${fcfa(AGENT_CONVERSION_BONUS)} par conversion`} tone="success" />
        <KpiCard label="Comptes actifs" value={summary.active} hint={`${summary.total - summary.active} inactifs à relancer`} />
        <KpiCard label="Commissions de la semaine" value={fcfa(summary.pendingCommission)} hint="Cagnottes en cours + acquises" tone="accent" />
      </div>

      <FilterChips options={FILTERS} value={filter} onChange={(v) => { setFilter(v); setPage(1); }} ariaLabel="Filtrer les clients" />

      <RefreshingOverlay active={state.loading && !state.initialLoading}>
        <TableShell
          footer={
            result.total > 0 ? (
              <Pagination page={result} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} itemLabel="clients" />
            ) : undefined
          }
        >
          {result.total === 0 ? (
            <EmptyState
              title="Aucun client ne correspond"
              description="Modifie la recherche ou le filtre sélectionné pour retrouver tes comptes."
            />
          ) : (
            <table className="w-full min-w-[920px] text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Client</Th>
                  <Th>Téléphone</Th>
                  <Th>Email</Th>
                  <Th>Ville</Th>
                  <Th>Inscrit le</Th>
                  <Th>Statut</Th>
                  <Th>Activité</Th>
                  <Th>Dernière activité</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {result.rows.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-bold text-[#241F18] whitespace-nowrap">{c.fullName}</Td>
                    <Td className="text-[#8A8173] font-mono whitespace-nowrap">{c.phone}</Td>
                    <Td className="text-[#8A8173] truncate max-w-[190px]">{c.email}</Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{c.city}</Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{shortDate(c.createdAt)}</Td>
                    <Td>
                      <StatusBadge tone={c.conversionStatus === 'premium' ? 'success' : c.conversionStatus === 'en_cours_de_relance' ? 'warning' : 'neutral'}>
                        {human(c.conversionStatus)}
                      </StatusBadge>
                    </Td>
                    <Td>
                      <StatusBadge tone={c.active ? 'success' : 'danger'}>{c.active ? 'Actif' : 'Inactif'}</StatusBadge>
                    </Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{relativeDay(c.lastActivityAt)}</Td>
                    <Td align="right">
                      <IconButton
                        label={`Relancer ${c.fullName} sur WhatsApp`}
                        tone="accent"
                        disabled={followUp.pending}
                        onClick={() => relance(c.id, c.fullName, c.phone)}
                      >
                        <PhoneCall size={15} />
                      </IconButton>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </TableShell>
      </RefreshingOverlay>
    </div>
  );
};
