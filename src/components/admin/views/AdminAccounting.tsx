/**
 * « Comptabilité globale / Depuis la création » — audit §3.1 et §6.
 *
 * Le bug des trois totaux incohérents est corrigé à la racine : TOUS les
 * chiffres de cet écran sortent d'un unique appel à `computeAccounting`, qui
 * somme toutes les périodes depuis le lancement et lève une AppError si
 * l'identité brut − reversé − charges = net est rompue. Un test unitaire
 * verrouille cette identité (lib/business/__tests__/accounting.test.ts).
 * L'équivalent € est affiché partout où la spec le prévoyait.
 */
import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { BarChart, KpiCard, PageHeader, TableShell, Td, Th, Tr } from '../../shared/primitives';
import { ErrorState, Skeleton, SkeletonCards } from '../../shared/states';
import { useApi } from '../../../lib/hooks';
import { getAdminAccounting } from '../../../lib/api/admin';
import { eur, fcfa, pct } from '../../../lib/format';

export const AdminAccountingView: React.FC = () => {
  const state = useApi(getAdminAccounting);

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Comptabilité globale" subtitle="Chargement du grand livre…" />
        <SkeletonCards count={4} />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Comptabilité globale" />
        <ErrorState
          message={state.error?.message ?? 'Chargement impossible.'}
          code={state.error?.code}
          onRetry={state.reload}
        />
      </div>
    );
  }

  const { sinceLaunch, currentMonth, history } = state.data;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Comptabilité globale"
        subtitle="Cumul depuis la création : toutes les périodes sont sommées, jamais la valeur du dernier mois."
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Revenu brut depuis la création"
          value={fcfa(sinceLaunch.grossRevenue)}
          hint={`≈ ${eur(sinceLaunch.grossRevenue)}`}
          tone="dark"
        />
        <KpiCard
          label="Reversement réseau total"
          value={fcfa(sinceLaunch.networkPayout)}
          hint={`≈ ${eur(sinceLaunch.networkPayout)}`}
          tone="accent"
        />
        <KpiCard
          label="Charges cumulées"
          value={fcfa(sinceLaunch.charges)}
          hint={`≈ ${eur(sinceLaunch.charges)}`}
          tone="warning"
        />
        <KpiCard
          label="Bénéfice net"
          value={fcfa(sinceLaunch.netProfit)}
          hint={`${pct(sinceLaunch.netMarginPct)} de marge · ≈ ${eur(sinceLaunch.netProfit)}`}
          tone="success"
        />
      </div>

      {/* Chaîne de calcul explicite : chaque ligne découle de la précédente. */}
      <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB]">
        <h3 className="font-serif font-bold text-base text-[#241F18] mb-1">Chaîne de calcul</h3>
        <p className="text-[11.5px] text-[#8A8173] mb-4">
          Chaque ligne découle de la précédente. Aucune valeur n'est saisie à la main.
        </p>

        <div className="flex flex-col gap-2 text-xs">
          <LedgerLine label="Revenu brut" value={sinceLaunch.grossRevenue} />
          <LedgerLine label="− Commissions agents commerciaux" value={-sinceLaunch.agentCommissions} indent />
          <LedgerLine label="− Parrainage utilisateurs (versé en espèces)" value={-sinceLaunch.referralPayouts} indent />
          <LedgerLine label="= Total reversé au réseau" value={-sinceLaunch.networkPayout} emphasis />
          <LedgerLine label="= Revenu net" value={sinceLaunch.netRevenue} emphasis />
          <LedgerLine label="− Charges" value={-sinceLaunch.charges} indent />
          <LedgerLine label="= Bénéfice net" value={sinceLaunch.netProfit} total />
        </div>

        <div className="mt-4 p-3 rounded-xl bg-[#DDF0E6] border border-[#B9E2CC] flex items-start gap-2.5">
          <ShieldCheck size={16} className="text-[#2F9E6E] shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-[#1F6B47] leading-relaxed">
            Contrôle de cohérence validé : {fcfa(sinceLaunch.grossRevenue)} − {fcfa(sinceLaunch.networkPayout)} −{' '}
            {fcfa(sinceLaunch.charges)} = {fcfa(sinceLaunch.netProfit)}. Si cette égalité était rompue, cet écran
            afficherait une erreur au lieu de chiffres faux.
          </p>
        </div>
      </div>

      {/* Graphique mensuel du bénéfice net — absent du live */}
      <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB]">
        <h3 className="font-serif font-bold text-base text-[#241F18] mb-1">Bénéfice net par mois</h3>
        <p className="text-[11.5px] text-[#8A8173] mb-2">
          Mois en cours : {currentMonth.label} · {fcfa(currentMonth.netProfit)} (≈ {eur(currentMonth.netProfit)})
        </p>
        <BarChart
          data={[...history].reverse().map((m) => ({ label: m.label.split(' ')[0].slice(0, 4), value: m.netProfit }))}
          formatValue={(v) => fcfa(v, { compact: true })}
          height={190}
        />
      </div>

      {/* Historique complet mois par mois, avec équivalents € — absent du live */}
      <div>
        <h3 className="font-serif font-bold text-base text-[#241F18] mb-3">Historique complet</h3>
        <TableShell>
          <table className="w-full min-w-[860px] text-left">
            <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
              <tr>
                <Th>Mois</Th>
                <Th align="right">Revenu brut</Th>
                <Th align="right">Commissions agents</Th>
                <Th align="right">Parrainage</Th>
                <Th align="right">Charges</Th>
                <Th align="right">Bénéfice net</Th>
                <Th align="right">Équivalent €</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9DC]">
              {history.map((m) => (
                <Tr key={m.month}>
                  <Td className="font-bold text-[#241F18] whitespace-nowrap capitalize">{m.label}</Td>
                  <Td align="right" className="text-[#241F18]">{fcfa(m.grossRevenue)}</Td>
                  <Td align="right" className="text-[#C0512F]">−{fcfa(m.agentCommissions)}</Td>
                  <Td align="right" className="text-[#C0512F]">−{fcfa(m.referralPayouts)}</Td>
                  <Td align="right" className="text-[#A8710A]">−{fcfa(m.charges)}</Td>
                  <Td align="right" className="font-serif font-bold text-[#1F6B47]">{fcfa(m.netProfit)}</Td>
                  <Td align="right" className="text-[#8A8173]">{eur(m.netProfit)}</Td>
                </Tr>
              ))}
            </tbody>
            <tfoot className="bg-[#241F18] text-white">
              <tr>
                <td className="py-3 px-4 text-xs font-bold">Depuis la création</td>
                <td className="py-3 px-4 text-xs text-right">{fcfa(sinceLaunch.grossRevenue)}</td>
                <td className="py-3 px-4 text-xs text-right">−{fcfa(sinceLaunch.agentCommissions)}</td>
                <td className="py-3 px-4 text-xs text-right">−{fcfa(sinceLaunch.referralPayouts)}</td>
                <td className="py-3 px-4 text-xs text-right">−{fcfa(sinceLaunch.charges)}</td>
                <td className="py-3 px-4 text-sm text-right font-serif font-extrabold">{fcfa(sinceLaunch.netProfit)}</td>
                <td className="py-3 px-4 text-xs text-right text-[#C7BDA8]">{eur(sinceLaunch.netProfit)}</td>
              </tr>
            </tfoot>
          </table>
        </TableShell>
      </div>
    </div>
  );
};

const LedgerLine: React.FC<{
  label: string;
  value: number;
  indent?: boolean;
  emphasis?: boolean;
  total?: boolean;
}> = ({ label, value, indent, emphasis, total }) => (
  <div
    className={`flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl ${
      total ? 'bg-[#241F18] text-white'
      : emphasis ? 'bg-[#F5F1EA] border border-[#E4DCCB]'
      : 'bg-[#FAF7F2]'
    } ${indent ? 'ml-0 sm:ml-6' : ''}`}
  >
    <span className={total ? 'font-bold' : emphasis ? 'font-semibold text-[#241F18]' : 'text-[#3A3226]'}>{label}</span>
    <span className={`font-serif whitespace-nowrap ${total ? 'font-extrabold text-sm' : 'font-bold text-[#241F18]'}`}>
      {value < 0 ? `−${fcfa(Math.abs(value))}` : fcfa(value)}
    </span>
  </div>
);
