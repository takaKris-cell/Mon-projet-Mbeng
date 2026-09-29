/**
 * Tableau de bord de l'agent — audit §2.3.1.
 *
 * Réintroduit le cycle hebdomadaire complet :
 *  • deux cagnottes SÉPARÉES (gains de la semaine / conversions différées),
 *    chacune avec sa propre barre de progression vers son propre seuil ;
 *  • un total réellement disponible = somme des seules cagnottes ayant atteint
 *    leur seuil, jamais un solde « disponible immédiatement » ;
 *  • « Demander le virement » crée une vraie ligne dans `payout_requests`,
 *    lue côté Super-Admin, et désactivée tant que le seuil n'est pas atteint.
 */
import React from 'react';
import { ArrowRight, CalendarClock, CheckCircle2, Clock, Wallet } from 'lucide-react';
import { Button } from '../../ui/Button';
import { PageHeader, KpiCard, ProgressBar, StatusBadge, TableShell, Th, Td, Tr } from '../../shared/primitives';
import { ErrorState, SkeletonCards, SkeletonTable, EmptyState } from '../../shared/states';
import { useApi, useMutation } from '../../../lib/hooks';
import { getAgentDashboard, requestPayout } from '../../../lib/api/agent';
import { fcfa, human, relativeDay, shortDate } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import { WEEKLY_CLOSING } from '../../../lib/business/constants';

export const CommercialDashboard: React.FC<{ onNavigate: (slug: any) => void }> = ({ onNavigate }) => {
  const toast = useToast();
  const state = useApi(getAgentDashboard);
  const payout = useMutation(requestPayout);

  const ask = async (bucket: 'weekly' | 'deferred') => {
    const request = await payout.run(bucket);
    if (request) {
      toast.success(
        `Demande de ${fcfa(request.amount)} transmise.`,
        'Elle apparaît dès maintenant dans la file du Super-Admin, qui la marquera « payée » ou la rejettera.',
      );
      state.reload();
    }
  };

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Tableau de bord" subtitle="Chargement de tes gains…" />
        <SkeletonCards count={4} />
        <SkeletonTable rows={5} columns={5} />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Tableau de bord" />
        <ErrorState
          message={state.error?.message ?? 'Impossible de charger ton tableau de bord.'}
          code={state.error?.code}
          onRetry={state.reload}
        />
      </div>
    );
  }

  const { agent, balances, kpis, closing, pendingRequests, recentClients, bonusScale } = state.data;
  const pending = pendingRequests[0] ?? null;

  return (
    <div className="flex flex-col gap-6 animate-fade-in">
      <PageHeader
        title={`Bonjour ${agent.fullName.split(' ')[0]}`}
        subtitle={`Barème en vigueur : ${fcfa(bonusScale.signup)} par compte actif créé, ${fcfa(bonusScale.conversion)} par conversion Premium. Seuil de retrait : ${fcfa(bonusScale.threshold)} par cagnotte.`}
        actions={
          <span className="text-xs font-semibold text-[#241F18] bg-white border border-[#E4DCCB] px-3 py-2 rounded-xl flex items-center gap-1.5">
            <CalendarClock size={14} className="text-[#C0512F]" />
            Clôture {closing.label} à {WEEKLY_CLOSING.hour} h
          </span>
        }
      />

      {payout.error && <ErrorState message={payout.error.message} code={payout.error.code} compact />}

      {/* KPI : la 3ᵉ carte mesure bien l'ENGAGEMENT (audit §5) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Comptes créés" value={kpis.totalClients} hint="Portefeuille total" />
        <KpiCard
          label="Passés Premium"
          value={kpis.premiumClients}
          hint={kpis.totalClients ? `${Math.round((kpis.premiumClients / kpis.totalClients) * 100)} % de conversion` : '—'}
          tone="success"
        />
        <KpiCard
          label="Comptes actifs cette semaine"
          value={`${kpis.activeThisWeek}/${kpis.totalClients}`}
          hint={`${kpis.activityRate} % d'activité · ${kpis.toFollowUp} à relancer`}
        />
        <KpiCard
          label="Disponible au retrait"
          value={fcfa(balances.availableForWithdrawal)}
          hint={
            balances.availableForWithdrawal > 0
              ? 'Cagnotte(s) au-dessus du seuil'
              : 'Aucune cagnotte n’a atteint son seuil'
          }
          tone="dark"
        />
      </div>

      {/* Les DEUX cagnottes, séparées, avec leur propre seuil */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <PotCard
          title="Gains de la semaine"
          description="Comptes créés et conversions Premium survenues pendant la semaine comptable en cours."
          earnings={balances.weekly.earnings}
          threshold={balances.weekly.threshold}
          progress={balances.weekly.progress}
          reached={balances.weekly.reached}
          remaining={balances.weekly.remaining}
          disabled={Boolean(pending) || payout.pending}
          pending={payout.pending}
          onRequest={() => ask('weekly')}
        />
        <PotCard
          title="Conversions Premium différées"
          description="Clients inscrits une semaine antérieure et passés Premium cette semaine. Cagnotte séparée, seuil séparé."
          earnings={balances.deferred.earnings}
          threshold={balances.deferred.threshold}
          progress={balances.deferred.progress}
          reached={balances.deferred.reached}
          remaining={balances.deferred.remaining}
          disabled={Boolean(pending) || payout.pending}
          pending={payout.pending}
          onRequest={() => ask('deferred')}
          footer={
            <button
              type="button"
              onClick={() => onNavigate('conversions-differees')}
              className="text-[11.5px] font-bold text-[#C0512F] hover:underline inline-flex items-center gap-1"
            >
              Voir le détail des conversions <ArrowRight size={12} />
            </button>
          }
        />
      </div>

      {/* Reste « en cours », reporté à la semaine suivante */}
      {balances.carriedOver > 0 && (
        <div className="p-4 rounded-2xl bg-[#FBF0DC] border border-[#F0D9A8] flex items-start gap-3">
          <Clock size={17} className="text-[#A8710A] shrink-0 mt-0.5" />
          <p className="text-xs text-[#6B4A08] leading-relaxed">
            <strong>{fcfa(balances.carriedOver)} en cours.</strong> Ce montant n'a pas atteint son seuil : il n'est pas
            perdu, il est reporté sur la semaine suivante et deviendra demandable dès que sa cagnotte atteindra{' '}
            {fcfa(balances.weekly.threshold)}.
          </p>
        </div>
      )}

      {/* Demande en attente côté Super-Admin */}
      {pending && (
        <div className="p-4 rounded-2xl bg-[#DDF0E6] border border-[#B9E2CC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <CheckCircle2 size={18} className="text-[#2F9E6E] shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-[#1F6B47]">
                Demande de {fcfa(pending.amount)} en attente de traitement
              </p>
              <p className="text-[11.5px] text-[#1F6B47]/80 mt-0.5">
                Transmise {relativeDay(pending.requestedAt).toLowerCase()} vers {human(pending.paymentMethod)}{' '}
                {pending.paymentNumber}. Le Super-Admin la marquera « payée » avec une référence de transaction, ou la
                rejettera avec un motif.
              </p>
            </div>
          </div>
          <StatusBadge tone="warning">En attente</StatusBadge>
        </div>
      )}

      {/* Derniers clients */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-serif font-bold text-base text-[#241F18]">Derniers clients parrainés</h3>
          <button
            type="button"
            onClick={() => onNavigate('mes-clients')}
            className="text-xs font-bold text-[#C0512F] hover:underline inline-flex items-center gap-1"
          >
            Voir les {kpis.totalClients} clients <ArrowRight size={13} />
          </button>
        </div>

        <TableShell>
          {recentClients.length === 0 ? (
            <EmptyState
              title="Aucun client pour le moment"
              description="Partage ton code promo pour enregistrer tes premières inscriptions."
            />
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#FAF7F2] border-b border-[#E4DCCB]">
                <tr>
                  <Th>Client</Th>
                  <Th>Téléphone</Th>
                  <Th>Email</Th>
                  <Th>Inscrit le</Th>
                  <Th>Statut</Th>
                  <Th align="right">Activité</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EFE9DC]">
                {recentClients.map((c) => (
                  <Tr key={c.id}>
                    <Td className="font-bold text-[#241F18]">{c.fullName}</Td>
                    <Td className="text-[#8A8173] font-mono">{c.phone}</Td>
                    <Td className="text-[#8A8173] truncate max-w-[200px]">{c.email}</Td>
                    <Td className="text-[#8A8173]">{shortDate(c.createdAt)}</Td>
                    <Td>
                      <StatusBadge
                        tone={
                          c.conversionStatus === 'premium' ? 'success'
                          : c.conversionStatus === 'en_cours_de_relance' ? 'warning'
                          : 'neutral'
                        }
                      >
                        {human(c.conversionStatus)}
                      </StatusBadge>
                    </Td>
                    <Td align="right" className="text-[#8A8173]">{relativeDay(c.lastActivityAt)}</Td>
                  </Tr>
                ))}
              </tbody>
            </table>
          )}
        </TableShell>
      </div>
    </div>
  );
};

const PotCard: React.FC<{
  title: string;
  description: string;
  earnings: number;
  threshold: number;
  progress: number;
  reached: boolean;
  remaining: number;
  disabled: boolean;
  pending: boolean;
  onRequest: () => void;
  footer?: React.ReactNode;
}> = ({ title, description, earnings, threshold, progress, reached, remaining, disabled, pending, onRequest, footer }) => (
  <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB] flex flex-col gap-3">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="font-serif font-bold text-base text-[#241F18] flex items-center gap-2">
          <Wallet size={16} className="text-[#C0512F]" /> {title}
        </h3>
        <p className="text-[11.5px] text-[#8A8173] mt-1 leading-relaxed">{description}</p>
      </div>
      <StatusBadge tone={reached ? 'success' : 'warning'}>{reached ? 'Seuil atteint' : 'En cours'}</StatusBadge>
    </div>

    <div>
      <div className="flex items-end justify-between mb-1.5">
        <span className="font-serif font-extrabold text-2xl text-[#241F18]">{fcfa(earnings)}</span>
        <span className="text-[11.5px] text-[#8A8173] font-semibold">seuil {fcfa(threshold)}</span>
      </div>
      <ProgressBar value={progress} tone={reached ? 'success' : 'warning'} label={`${title} : progression vers le seuil`} />
      <p className="text-[11px] text-[#8A8173] mt-1.5">
        {reached
          ? 'Montant demandable dès la clôture comptable.'
          : `Encore ${fcfa(remaining)} avant de pouvoir demander le virement.`}
      </p>
    </div>

    <Button
      variant={reached ? 'primary' : 'secondary'}
      size="md"
      fullWidth
      disabled={!reached || disabled}
      isLoading={pending}
      loadingLabel="Envoi de la demande…"
      onClick={onRequest}
    >
      {reached ? 'Demander le virement' : `Seuil non atteint (${fcfa(threshold)})`}
    </Button>

    {footer}
  </div>
);
