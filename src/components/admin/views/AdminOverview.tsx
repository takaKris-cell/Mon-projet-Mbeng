/**
 * Vue d'ensemble — audit §6.
 * Rétablit : les 3 vues Jour / Semaine / Mois, la carte de CHURN (remplacée par
 * erreur par « Examens réservés »), la conversion en euros, les 2 graphiques
 * spécifiés (revenu par jour sur 7 barres + tendance des actifs sur 4 semaines)
 * et la répartition Gratuit / Premium.
 * Tous les montants du bloc « Marketing & charges » viennent de la même
 * fonction comptable testée que l'écran Comptabilité : ils ne peuvent plus
 * diverger (audit §3.1).
 */
import React, { useState } from 'react';
import { ArrowRight, TrendingDown, TrendingUp } from 'lucide-react';
import { BarChart, FilterChips, KpiCard, PageHeader, ProgressBar, Sparkline } from '../../shared/primitives';
import { ErrorState, Skeleton, SkeletonCards } from '../../shared/states';
import { useApi } from '../../../lib/hooks';
import { getAdminOverview, type OverviewPeriod } from '../../../lib/api/admin';
import { eur, fcfa, pct } from '../../../lib/format';

const PERIODS: { value: OverviewPeriod; label: string }[] = [
  { value: 'jour', label: 'Jour' },
  { value: 'semaine', label: 'Semaine' },
  { value: 'mois', label: 'Mois' },
];

export const AdminOverviewView: React.FC<{ onNavigate: (slug: any) => void }> = ({ onNavigate }) => {
  // La vue « Semaine » est celle par défaut dans la spec.
  const [period, setPeriod] = useState<OverviewPeriod>('semaine');
  const state = useApi(() => getAdminOverview(period), [period]);

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vue d'ensemble" subtitle="Chargement des indicateurs…" />
        <SkeletonCards count={5} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Vue d'ensemble" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const d = state.data;
  const up = d.revenueDelta >= 0;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title="Vue d'ensemble"
        subtitle={d.periodLabel}
        actions={<FilterChips options={PERIODS} value={period} onChange={setPeriod} ariaLabel="Période affichée" />}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard
          label={`Revenu — ${period}`}
          value={fcfa(d.revenue)}
          tone="dark"
          className="col-span-2 lg:col-span-1"
          hint={
            <span className="flex flex-col gap-0.5">
              <span className={up ? 'text-[#2F9E6E]' : 'text-[#E8837A]'}>
                {up ? '+' : ''}{pct(d.revenueDelta)} vs période précédente
              </span>
              <span>≈ {eur(d.revenue)}</span>
            </span>
          }
        />
        <KpiCard
          label="Utilisateurs"
          value={d.users.total.toLocaleString('fr-FR')}
          hint={`${d.users.premium.toLocaleString('fr-FR')} Premium · ${d.users.free.toLocaleString('fr-FR')} gratuits`}
        />
        <KpiCard label="Passés Premium" value={d.premiumConversions} hint="Sur la semaine comptable" tone="success" />
        {/* Carte de CHURN rétablie (audit §3.5) */}
        <KpiCard
          label="Non renouvelés"
          value={d.churn.notRenewed}
          hint={`Taux de churn ${pct(d.churn.rate)}`}
          tone={d.churn.rate > 6 ? 'danger' : 'warning'}
        />
        <KpiCard
          label="Utilisateurs actifs"
          value={d.activeUsers.toLocaleString('fr-FR')}
          hint={`${pct(d.activeUsersPct)} de la base`}
        />
      </div>

      {/* Les DEUX graphiques spécifiés */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB]">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="font-serif font-bold text-base text-[#241F18]">Revenu par jour — 7 derniers jours</h3>
              <p className="text-[11.5px] text-[#8A8173]">Granularité journalière, tous moyens de paiement.</p>
            </div>
            <span className="text-xs font-bold text-[#C0512F] bg-[#FBEDE6] px-3 py-1.5 rounded-xl whitespace-nowrap">
              {fcfa(d.revenueByDay.reduce((s, x) => s + x.value, 0))}
            </span>
          </div>
          <BarChart data={d.revenueByDay} formatValue={(v) => fcfa(v, { compact: true })} />
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB]">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h3 className="font-serif font-bold text-base text-[#241F18]">Utilisateurs actifs — 4 semaines</h3>
              <p className="text-[11.5px] text-[#8A8173]">Tendance d'engagement hebdomadaire.</p>
            </div>
            <span className="text-xs font-bold text-[#1F6B47] bg-[#DDF0E6] px-3 py-1.5 rounded-xl flex items-center gap-1 whitespace-nowrap">
              {d.activeTrend[3].value >= d.activeTrend[0].value ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
              {d.activeTrend[3].value.toLocaleString('fr-FR')}
            </span>
          </div>
          <Sparkline data={d.activeTrend} formatValue={(v) => v.toLocaleString('fr-FR')} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Répartition Gratuit / Premium rétablie */}
        <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB]">
          <h4 className="font-serif font-bold text-sm text-[#241F18] mb-3">Répartition des utilisateurs</h4>
          <div className="flex flex-col gap-3 text-xs">
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8A8173]">Gratuit</span>
                <span className="font-bold text-[#241F18]">
                  {d.users.free.toLocaleString('fr-FR')} ({pct(100 - d.users.premiumPct, 0)})
                </span>
              </div>
              <ProgressBar value={(100 - d.users.premiumPct) / 100} tone="warning" label="Part des comptes gratuits" />
            </div>
            <div>
              <div className="flex justify-between mb-1.5">
                <span className="text-[#8A8173]">Premium</span>
                <span className="font-bold text-[#2F9E6E]">
                  {d.users.premium.toLocaleString('fr-FR')} ({pct(d.users.premiumPct, 0)})
                </span>
              </div>
              <ProgressBar value={d.users.premiumPct / 100} tone="success" label="Part des comptes Premium" />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EFE9DC]">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8173] block mb-2">
              Répartition par niveau
            </span>
            <div className="flex flex-col gap-1">
              {d.levelSplit.map((l) => (
                <div key={l.label} className="flex justify-between text-[11.5px]">
                  <span className="text-[#8A8173]">Niveau {l.label}</span>
                  <span className="font-semibold text-[#241F18]">
                    {l.value.toLocaleString('fr-FR')} ({pct(l.pct, 0)})
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB] flex flex-col">
          <h4 className="font-serif font-bold text-sm text-[#241F18] mb-3">Réseau commercial</h4>
          <dl className="flex flex-col gap-2.5 text-xs flex-1">
            <Row label="Commerciaux actifs" value={String(d.network.activeAgents)} />
            <Row label="Clients générés (semaine)" value={String(d.network.clientsThisWeek)} />
            <Row label="Seuils atteints" value={`${d.network.thresholdsReached} / ${d.network.activeAgents}`} />
            <Row label="Total à payer" value={fcfa(d.network.toPay)} strong />
          </dl>
          <button
            type="button"
            onClick={() => onNavigate('commerciaux')}
            className="mt-4 text-xs font-bold text-[#C0512F] hover:underline inline-flex items-center gap-1 self-start"
          >
            Voir tous les commerciaux <ArrowRight size={13} />
          </button>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB] flex flex-col">
          <h4 className="font-serif font-bold text-sm text-[#241F18] mb-1">Marketing & charges</h4>
          <p className="text-[11px] text-[#8A8173] mb-3">{d.month.label}</p>
          <dl className="flex flex-col gap-2.5 text-xs flex-1">
            <Row label="Budget pub dépensé" value={fcfa(d.month.adBudget)} />
            <Row label="Total des charges" value={fcfa(d.month.charges)} />
            <Row label="Reversé au réseau" value={fcfa(d.month.networkPayout)} />
            <Row
              label="Résultat net du mois"
              value={`${fcfa(d.month.netProfit)}`}
              hint={`≈ ${eur(d.month.netProfit)}`}
              strong
            />
          </dl>
          <button
            type="button"
            onClick={() => onNavigate('comptabilite')}
            className="mt-4 text-xs font-bold text-[#C0512F] hover:underline inline-flex items-center gap-1 self-start"
          >
            Voir la comptabilité <ArrowRight size={13} />
          </button>
        </div>
      </div>

      {/* Métrique conservée, mais à sa place — elle ne remplace plus le churn. */}
      <div className="p-4 rounded-2xl bg-white border border-[#E4DCCB] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8173] block">
            Examens réservés (Goethe & telc)
          </span>
          <span className="font-serif font-extrabold text-xl text-[#241F18]">{d.examBookings}</span>
        </div>
        <p className="text-[11px] text-[#8A8173] max-w-md leading-relaxed">
          Cette métrique n'a aucun lien avec le renouvellement des abonnements : elle est désormais affichée à part,
          et le suivi du churn a repris sa place parmi les indicateurs principaux.
        </p>
      </div>
    </div>
  );
};

const Row: React.FC<{ label: string; value: string; hint?: string; strong?: boolean }> = ({
  label, value, hint, strong,
}) => (
  <div className="flex items-start justify-between gap-3">
    <dt className="text-[#8A8173]">{label}</dt>
    <dd className="text-right">
      <span className={strong ? 'font-serif font-bold text-sm text-[#241F18]' : 'font-bold text-[#241F18]'}>
        {value}
      </span>
      {hint && <span className="block text-[10.5px] text-[#8A8173]">{hint}</span>}
    </dd>
  </div>
);
