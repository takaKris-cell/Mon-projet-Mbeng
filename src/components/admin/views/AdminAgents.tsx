/**
 * « Commerciaux » — audit §6.
 * Rétablit les 4 cartes résumé, les colonnes Zone / Téléphone / Seuil 5 000 F
 * (Atteint / En cours), l'action d'approbation-rejet des commissions promise
 * par le sous-titre, et une pagination réelle sur les 24 agents.
 */
import React, { useState } from 'react';
import { Ban, Check, CircleSlash, Play, X } from 'lucide-react';
import { IconButton } from '../../ui/Button';
import {
  KpiCard, PageHeader, ProgressBar, SearchInput, StatusBadge, TableShell, Td, Th, Tr,
} from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, RefreshingOverlay, SkeletonCards, SkeletonTable } from '../../shared/states';
import { useApi, useDebounced, useMutation } from '../../../lib/hooks';
import { listAdminAgents, setAgentCommissionStatus, setAgentStatus } from '../../../lib/api/admin';
import { fcfa, human } from '../../../lib/format';
import { useToast } from '../../shared/Toast';

export const AdminAgentsView: React.FC = () => {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const debounced = useDebounced(search);

  const state = useApi(() => listAdminAgents({ search: debounced, page, pageSize }), [debounced, page, pageSize]);
  const commission = useMutation(setAgentCommissionStatus);
  const status = useMutation(setAgentStatus);

  const approve = async (id: string, name: string) => {
    if (await commission.run(id, 'approved')) {
      toast.success(`Commissions de ${name} validées.`, 'Changement journalisé dans audit_log.');
      state.reload();
    }
  };
  const reject = async (id: string, name: string) => {
    if (await commission.run(id, 'rejected')) {
      toast.info(`Commissions de ${name} rejetées.`, "L'agent conserve son solde et peut refaire une demande.");
      state.reload();
    }
  };
  const toggleStatus = async (id: string, name: string, next: 'actif' | 'suspendu') => {
    if (await status.run(id, next)) {
      toast.success(`${name} — compte ${next === 'actif' ? 'réactivé' : 'suspendu'}.`);
      state.reload();
    }
  };

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Commerciaux" subtitle="Chargement du réseau…" />
        <SkeletonCards count={4} />
        <SkeletonTable rows={8} columns={7} />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Commerciaux" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const { page: result, summary, threshold } = state.data;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title={`Commerciaux (${result.total})`}
        subtitle={`Suivi des performances et validation des commissions. Seuil de retrait : ${fcfa(threshold)} par cagnotte.`}
        actions={<SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Nom, code, zone, téléphone…" className="w-full sm:w-72" />}
      />

      {(commission.error || status.error) && (
        <ErrorState message={(commission.error ?? status.error)!.message} code={(commission.error ?? status.error)!.code} compact />
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Commerciaux actifs" value={summary.activeAgents} hint={`sur ${result.total} au total`} />
        <KpiCard label="Clients générés" value={summary.clientsGenerated.toLocaleString('fr-FR')} hint="Tous agents confondus" />
        <KpiCard label="Seuils atteints" value={summary.thresholdsReached} hint="Au moins une cagnotte au-dessus du seuil" tone="success" />
        <KpiCard label="Total à verser" value={fcfa(summary.totalToPay)} hint="Somme des cagnottes demandables" tone="dark" />
      </div>

      <RefreshingOverlay active={state.loading && !state.initialLoading}>
        <TableShell
          footer={result.total > 0 ? (
            <Pagination page={result} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} itemLabel="agents" />
          ) : undefined}
        >
          {result.total === 0 ? (
            <EmptyState title="Aucun agent ne correspond" description="Modifie la recherche pour retrouver un commercial." />
          ) : (
            <table className="w-full min-w-[1080px] text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Agent</Th>
                  <Th>Code</Th>
                  <Th>Zone</Th>
                  <Th>Téléphone</Th>
                  <Th align="right">Clients</Th>
                  <Th align="right">Premium</Th>
                  <Th>Seuil {fcfa(threshold, { compact: true })}</Th>
                  <Th align="right">À verser</Th>
                  <Th>Commissions</Th>
                  <Th align="right">Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {result.rows.map((a) => (
                  <Tr key={a.id}>
                    <Td className="font-bold text-[#241F18] whitespace-nowrap">
                      {a.fullName}
                      {a.status === 'suspendu' && <span className="ml-2"><StatusBadge tone="danger">Suspendu</StatusBadge></span>}
                    </Td>
                    <Td className="font-mono text-[#8A8173] whitespace-nowrap">{a.affiliateCode}</Td>
                    <Td className="text-[#8A8173] whitespace-nowrap">{a.zone}</Td>
                    <Td className="font-mono text-[#8A8173] whitespace-nowrap">{a.phone}</Td>
                    <Td align="right" className="font-semibold text-[#241F18]">{a.clients}</Td>
                    <Td align="right" className="font-semibold text-[#2F9E6E]">{a.premium}</Td>
                    <Td>
                      <div className="w-32">
                        <div className="flex items-center justify-between mb-1">
                          <StatusBadge tone={a.thresholdReached ? 'success' : 'warning'}>
                            {a.thresholdReached ? 'Atteint' : 'En cours'}
                          </StatusBadge>
                          <span className="text-[10.5px] text-[#8A8173]">{fcfa(a.weeklyEarnings, { compact: true })}</span>
                        </div>
                        <ProgressBar
                          value={a.weeklyEarnings / threshold}
                          tone={a.thresholdReached ? 'success' : 'warning'}
                          label={`Cagnotte hebdomadaire de ${a.fullName}`}
                        />
                      </div>
                    </Td>
                    <Td align="right" className="font-serif font-bold text-[#C0512F] whitespace-nowrap">
                      {fcfa(a.available)}
                    </Td>
                    <Td>
                      <StatusBadge
                        tone={
                          a.commissionStatus === 'approved' || a.commissionStatus === 'paid' ? 'success'
                          : a.commissionStatus === 'rejected' ? 'danger'
                          : 'warning'
                        }
                      >
                        {human(a.commissionStatus)}
                      </StatusBadge>
                    </Td>
                    <Td align="right">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label={`Valider les commissions de ${a.fullName}`}
                          tone="success"
                          disabled={commission.pending || a.commissionStatus === 'approved'}
                          onClick={() => approve(a.id, a.fullName)}
                        >
                          <Check size={15} />
                        </IconButton>
                        <IconButton
                          label={`Rejeter les commissions de ${a.fullName}`}
                          tone="danger"
                          disabled={commission.pending || a.commissionStatus === 'rejected'}
                          onClick={() => reject(a.id, a.fullName)}
                        >
                          <X size={15} />
                        </IconButton>
                        <IconButton
                          label={a.status === 'actif' ? `Suspendre ${a.fullName}` : `Réactiver ${a.fullName}`}
                          tone={a.status === 'actif' ? 'neutral' : 'accent'}
                          disabled={status.pending}
                          onClick={() => toggleStatus(a.id, a.fullName, a.status === 'actif' ? 'suspendu' : 'actif')}
                        >
                          {a.status === 'actif' ? <Ban size={15} /> : <Play size={15} />}
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

      <p className="text-[11px] text-[#8A8173] flex items-center gap-1.5">
        <CircleSlash size={12} />
        Chaque validation, rejet ou suspension écrit une ligne dans <code className="font-mono">audit_log</code> (qui,
        quand, ancien et nouveau statut).
      </p>
    </div>
  );
};
