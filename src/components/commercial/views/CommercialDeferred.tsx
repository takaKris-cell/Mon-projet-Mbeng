/**
 * « Conversions différées » — audit §3.3.
 *
 * Règle tranchée : la commission est un MONTANT FIXE par conversion
 * (Manuel §5.1, source de vérité unique), indépendant du prix de l'abonnement.
 * La colonne « Montant abonnement » — ajout positif du live, conservé — reste
 * affichée pour la transparence, mais n'entre plus dans le calcul.
 */
import React, { useState } from 'react';
import { Info } from 'lucide-react';
import { PageHeader, KpiCard, ProgressBar, StatusBadge, TableShell, Td, Th, Tr } from '../../shared/primitives';
import { Pagination } from '../../shared/Pagination';
import { EmptyState, ErrorState, RefreshingOverlay, SkeletonCards, SkeletonTable } from '../../shared/states';
import { useApi } from '../../../lib/hooks';
import { listDeferredConversions } from '../../../lib/api/agent';
import { fcfa, shortDate } from '../../../lib/format';
import { AGENT_CONVERSION_BONUS } from '../../../lib/business/constants';

export const CommercialDeferred: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const state = useApi(() => listDeferredConversions({ page, pageSize }), [page, pageSize]);

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Conversions différées" subtitle="Chargement…" />
        <SkeletonCards count={3} />
        <SkeletonTable rows={6} columns={5} />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Conversions différées" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const { page: result, total, threshold } = state.data;
  const reached = total >= threshold;

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Conversions Premium différées"
        subtitle="Clients inscrits lors d'une semaine antérieure et passés Premium pendant la semaine en cours. Cette cagnotte a son propre seuil et n'est jamais mélangée aux gains de la semaine."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Total de la cagnotte" value={fcfa(total)} tone="dark" hint={`${result.total} conversion${result.total > 1 ? 's' : ''}`} />
        <KpiCard label="Barème par conversion" value={fcfa(AGENT_CONVERSION_BONUS)} hint="Montant fixe, quel que soit l'abonnement" tone="accent" />
        <KpiCard label="Seuil de retrait" value={fcfa(threshold)} hint={reached ? 'Seuil atteint' : `Encore ${fcfa(threshold - total)}`} tone={reached ? 'success' : 'warning'} />
      </div>

      <div className="p-4 rounded-2xl bg-white border border-[#E4DCCB]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-[#241F18]">Progression vers le seuil</span>
          <StatusBadge tone={reached ? 'success' : 'warning'}>{reached ? 'Seuil atteint' : 'En cours'}</StatusBadge>
        </div>
        <ProgressBar value={threshold ? total / threshold : 0} tone={reached ? 'success' : 'warning'} label="Progression de la cagnotte des conversions différées" />
      </div>

      <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] flex items-start gap-2.5">
        <Info size={15} className="text-[#8A8173] shrink-0 mt-0.5" />
        <p className="text-[11.5px] text-[#3A3226] leading-relaxed">
          La commission est un montant <strong>fixe</strong> de {fcfa(AGENT_CONVERSION_BONUS)} par conversion. Le montant
          de l'abonnement souscrit est affiché à titre informatif : il n'influe pas sur ta commission.
        </p>
      </div>

      <RefreshingOverlay active={state.loading && !state.initialLoading}>
        <TableShell
          footer={result.total > 0 ? (
            <Pagination page={result} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} itemLabel="conversions" />
          ) : undefined}
        >
          {result.total === 0 ? (
            <EmptyState
              title="Aucune conversion différée cette semaine"
              description="Dès qu'un client inscrit une semaine précédente passera Premium, il apparaîtra ici."
            />
          ) : (
            <table className="w-full min-w-[640px] text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Client</Th>
                  <Th>Compte créé le</Th>
                  <Th>Passé Premium le</Th>
                  <Th align="right">Montant abonnement</Th>
                  <Th align="right">Commission agent</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {result.rows.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-bold text-[#241F18]">{r.clientName}</Td>
                    <Td className="text-[#8A8173]">{shortDate(r.accountCreatedAt)}</Td>
                    <Td className="font-semibold text-[#241F18]">{shortDate(r.premiumPurchasedAt)}</Td>
                    <Td align="right" className="text-[#8A8173]">
                      {r.subscriptionAmount ? fcfa(r.subscriptionAmount) : '—'}
                    </Td>
                    <Td align="right" className="font-serif font-bold text-[#2F9E6E]">
                      {fcfa(r.commission, { sign: true })}
                    </Td>
                  </Tr>
                ))}
              </tbody>
              <tfoot className="bg-[#241F18] text-white">
                <tr>
                  <td colSpan={4} className="py-3 px-4 text-xs font-bold">Total de la cagnotte</td>
                  <td className="py-3 px-4 text-sm text-right font-serif font-extrabold">{fcfa(total)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </TableShell>
      </RefreshingOverlay>
    </div>
  );
};
