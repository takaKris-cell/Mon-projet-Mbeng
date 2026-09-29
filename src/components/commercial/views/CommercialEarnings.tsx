/**
 * « Mes gains » — page absente de la navigation dans le live (audit §5).
 * Répartition mensuelle par semaines, en distinguant toujours les deux
 * cagnottes : gains de la semaine et conversions différées ne sont jamais
 * additionnés sous un même libellé sans être détaillés.
 */
import React from 'react';
import { PageHeader, KpiCard, BarChart, TableShell, Td, Th, Tr } from '../../shared/primitives';
import { EmptyState, ErrorState, Skeleton, SkeletonCards } from '../../shared/states';
import { useApi } from '../../../lib/hooks';
import { getAgentEarnings } from '../../../lib/api/agent';
import { fcfa } from '../../../lib/format';
import { WEEKLY_PAYOUT_THRESHOLD } from '../../../lib/business/constants';

export const CommercialEarnings: React.FC = () => {
  const state = useApi(getAgentEarnings);

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Mes gains" subtitle="Chargement de ta répartition mensuelle…" />
        <SkeletonCards count={3} />
        <Skeleton className="h-60 rounded-2xl" />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Mes gains" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const { monthLabel, total, weeks } = state.data;
  const weeklyTotal = weeks.reduce((s, w) => s + w.weeklyEarnings, 0);
  const deferredTotal = weeks.reduce((s, w) => s + w.deferredEarnings, 0);

  return (
    <div className="flex flex-col gap-5 animate-fade-in">
      <PageHeader
        title="Mes gains"
        subtitle={`Répartition semaine par semaine sur les 4 dernières semaines comptables. Chaque semaine se clôture le samedi à 16 h ; le seuil de ${fcfa(WEEKLY_PAYOUT_THRESHOLD)} s'applique par cagnotte.`}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label={`Total ${monthLabel}`} value={fcfa(total)} hint="4 dernières semaines" tone="dark" />
        <KpiCard label="Gains de la semaine (cumul)" value={fcfa(weeklyTotal)} hint="Inscriptions + conversions immédiates" />
        <KpiCard label="Conversions différées (cumul)" value={fcfa(deferredTotal)} hint="Cagnotte séparée" tone="accent" />
      </div>

      <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB]">
        <h3 className="font-serif font-bold text-base text-[#241F18] mb-1">Gains par semaine</h3>
        <p className="text-[11.5px] text-[#8A8173] mb-2">Total des deux cagnottes pour chaque semaine comptable.</p>
        {weeks.every((w) => w.total === 0) ? (
          <EmptyState title="Aucun gain sur la période" description="Tes prochaines inscriptions apparaîtront ici dès leur première connexion." />
        ) : (
          <BarChart
            data={weeks.map((w) => ({ label: w.label.replace('Semaine du ', ''), value: w.total }))}
            formatValue={(v) => fcfa(v, { compact: true })}
          />
        )}
      </div>

      <TableShell>
        <table className="w-full min-w-[520px] text-left">
          <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
            <tr>
              <Th>Semaine comptable</Th>
              <Th align="right">Gains de la semaine</Th>
              <Th align="right">Conversions différées</Th>
              <Th align="right">Total</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EFE9DC]">
            {weeks.map((w) => (
              <Tr key={w.label}>
                <Td className="font-semibold text-[#241F18]">{w.label}</Td>
                <Td align="right" className="text-[#241F18]">{fcfa(w.weeklyEarnings)}</Td>
                <Td align="right" className="text-[#C0512F] font-semibold">{fcfa(w.deferredEarnings)}</Td>
                <Td align="right" className="font-serif font-bold text-[#241F18]">{fcfa(w.total)}</Td>
              </Tr>
            ))}
          </tbody>
          <tfoot className="bg-[#241F18] text-white">
            <tr>
              <td className="py-3 px-4 text-xs font-bold">Total sur la période</td>
              <td className="py-3 px-4 text-xs text-right">{fcfa(weeklyTotal)}</td>
              <td className="py-3 px-4 text-xs text-right">{fcfa(deferredTotal)}</td>
              <td className="py-3 px-4 text-sm text-right font-serif font-extrabold">{fcfa(total)}</td>
            </tr>
          </tfoot>
        </table>
      </TableShell>
    </div>
  );
};
