/**
 * Parrainage utilisateur — Manuel §5.2.
 *
 * Le live annonçait « 20 % de commission immédiate » : c'est faux au regard de
 * la règle métier. Le parrainage rapporte un montant FIXE, uniquement quand le
 * filleul passe Premium (jamais à la simple inscription, jamais de niveau 2).
 * Les deux usages du crédit sont réellement branchés :
 *   • rachat de son propre Premium → réduction de solde interne, jamais comptée
 *     dans le revenu brut ni dans la file des virements sortants ;
 *   • retrait en espèces → même file `payout_requests` que les commerciaux.
 */
import React, { useState } from 'react';
import { Check, Copy, MessageSquare, Share2, Sparkles, Wallet } from 'lucide-react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { ProgressBar, StatusBadge } from '../../shared/primitives';
import { ErrorState, Skeleton } from '../../shared/states';
import { useApi, useCopyToClipboard, useMutation } from '../../../lib/hooks';
import { getReferralState, redeemCreditsForPremium, requestReferralCashPayout } from '../../../lib/api/user';
import { fcfa, relativeDay } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import { PAYOUT_METHOD_LABELS, PAYOUT_METHODS, PREMIUM_PLANS } from '../../../lib/business/constants';

interface ReferralViewProps {
  onBack: () => void;
  onConvertToPremium: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({ onBack, onConvertToPremium }) => {
  const toast = useToast();
  const state = useApi(getReferralState);
  const redeem = useMutation(redeemCreditsForPremium);
  const withdraw = useMutation(requestReferralCashPayout);
  const [copied, copy] = useCopyToClipboard();
  const [method, setMethod] = useState<(typeof PAYOUT_METHODS)[number]>('orange_money');

  if (state.initialLoading) {
    return (
      <div className="p-5 flex flex-col gap-3">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-44 rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-24 rounded-xl" />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="p-5 flex flex-col gap-4">
        <BackButton onClick={onBack} title="Accueil" />
        <ErrorState
          message={state.error?.message ?? 'Impossible de charger ton parrainage.'}
          code={state.error?.code}
          onRetry={state.reload}
        />
      </div>
    );
  }

  const d = state.data;
  const shareText = `Salut ! Prépare ton projet d'études ou ton visa soignant pour l'Allemagne avec Mon Projet Mbeng. Utilise mon code ${d.code} : ${d.shareUrl}`;
  const cheapestPlan = PREMIUM_PLANS[0];

  const useForPremium = async () => {
    const profile = await redeem.run(cheapestPlan.id);
    if (profile) {
      toast.success(
        'Crédits utilisés pour ton abonnement.',
        'Ce rachat est une réduction de solde interne : il n’entre pas dans le chiffre d’affaires.',
      );
      onConvertToPremium();
    }
  };

  const askCash = async () => {
    const request = await withdraw.run(method);
    if (request) {
      toast.success(
        `Demande de retrait de ${fcfa(request.amount)} envoyée.`,
        'Elle rejoint la même file que les commissions des commerciaux, traitée par l’administration.',
      );
      state.reload();
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        <div className="p-5 rounded-2xl bg-[#241F18] text-white mb-4 border border-[#3A3226]">
          <span className="flex items-center gap-1.5 text-[#C0512F] text-[10px] font-bold uppercase tracking-wider mb-1">
            <Sparkles size={14} /> Programme ambassadeur
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#FAF7F2] mb-1">Deviens ambassadeur Mbeng</h2>
          <p className="text-xs text-[#C7BDA8] leading-relaxed">
            Partage ton code. Dès qu'un filleul passe Premium, tu reçois{' '}
            <strong className="text-white">{fcfa(d.bonusPerConversion)}</strong>. Une seule génération de parrainage,
            aucun bonus à la simple inscription.
          </p>

          <div className="mt-4 flex items-center justify-between gap-3 p-3 rounded-xl bg-white/10 border border-white/10">
            <div className="min-w-0">
              <span className="text-[10px] text-[#8A8173] uppercase tracking-wider block">Ton code unique</span>
              <span className="font-mono font-bold text-base text-[#FAF7F2] tracking-wider">{d.code}</span>
            </div>
            <button
              type="button"
              onClick={() => { copy(d.code); toast.success('Code copié.'); }}
              className="flex items-center gap-1 text-xs font-bold bg-[#C0512F] text-white px-3 py-1.5 rounded-lg hover:bg-[#A8452A] active:bg-[#8F3B24] transition-colors shrink-0"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<MessageSquare size={16} />}
            onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')}
          >
            WhatsApp
          </Button>
          <Button
            variant="secondary"
            size="md"
            leftIcon={<Share2 size={16} />}
            onClick={() => { copy(d.shareUrl); toast.success('Lien copié.'); }}
          >
            Copier le lien
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB]">
            <span className="text-[10px] text-[#8A8173] font-bold uppercase block">Filleuls inscrits</span>
            <span className="font-serif font-bold text-2xl text-[#241F18]">{d.referredCount}</span>
            <span className="text-[10px] text-[#2F9E6E] block font-medium mt-0.5">
              {d.premiumCount} passé{d.premiumCount > 1 ? 's' : ''} Premium
            </span>
          </div>
          <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB]">
            <span className="text-[10px] text-[#8A8173] font-bold uppercase block">Crédits disponibles</span>
            <span className="font-serif font-bold text-2xl text-[#C0512F]">{fcfa(d.credits)}</span>
            <span className="text-[10px] text-[#8A8173] block font-medium mt-0.5">Solde de parrainage</span>
          </div>
        </div>

        {(redeem.error || withdraw.error) && (
          <div className="mb-4">
            <ErrorState message={(redeem.error ?? withdraw.error)!.message} code={(redeem.error ?? withdraw.error)!.code} compact />
          </div>
        )}

        {/* Usage 1 — rachat de son propre Premium */}
        <div className="p-4 rounded-xl bg-[#241F18] text-white border border-[#3A3226] mb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#FAF7F2]">Utiliser mes crédits pour mon Premium</h4>
              <p className="text-[11px] text-[#8A8173] mt-0.5 leading-relaxed">
                Possible dès {fcfa(d.thresholds.premiumRedemption)} de crédits.
              </p>
            </div>
            <StatusBadge tone={d.canRedeemForPremium ? 'success' : 'warning'}>
              {d.canRedeemForPremium ? 'Disponible' : 'En cours'}
            </StatusBadge>
          </div>
          <div className="mt-3">
            <ProgressBar
              value={d.credits / d.thresholds.premiumRedemption}
              tone={d.canRedeemForPremium ? 'success' : 'warning'}
              label="Progression vers le rachat Premium"
            />
          </div>
          <Button
            variant="primary"
            size="md"
            fullWidth
            className="mt-3"
            disabled={!d.canRedeemForPremium}
            isLoading={redeem.pending}
            loadingLabel="Application du crédit…"
            onClick={useForPremium}
          >
            {d.canRedeemForPremium
              ? `Payer ${cheapestPlan.label.toLowerCase()} avec mes crédits`
              : `Encore ${fcfa(Math.max(0, d.thresholds.premiumRedemption - d.credits))}`}
          </Button>
        </div>

        {/* Usage 2 — retrait en espèces */}
        <div className="p-4 rounded-xl bg-white border border-[#E4DCCB]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-[#241F18] flex items-center gap-1.5">
                <Wallet size={14} className="text-[#C0512F]" /> Retirer en Mobile Money
              </h4>
              <p className="text-[11px] text-[#8A8173] mt-0.5 leading-relaxed">
                Possible dès {fcfa(d.thresholds.cashWithdrawal)} de crédits.
              </p>
            </div>
            <StatusBadge tone={d.canWithdrawCash ? 'success' : 'warning'}>
              {d.canWithdrawCash ? 'Disponible' : 'En cours'}
            </StatusBadge>
          </div>

          <div className="mt-3">
            <ProgressBar
              value={d.credits / d.thresholds.cashWithdrawal}
              tone={d.canWithdrawCash ? 'success' : 'warning'}
              label="Progression vers le retrait en espèces"
            />
          </div>

          {d.pendingPayout ? (
            <div className="mt-3 p-3 rounded-xl bg-[#FBF0DC] border border-[#F0D9A8] text-[11.5px] text-[#6B4A08] leading-relaxed">
              Demande de <strong>{fcfa(d.pendingPayout.amount)}</strong> transmise{' '}
              {relativeDay(d.pendingPayout.requestedAt).toLowerCase()}. Elle est en attente de traitement par
              l'administration.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {PAYOUT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    aria-pressed={method === m}
                    className={`p-2.5 rounded-xl border text-[11.5px] font-bold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
                      method === m
                        ? 'bg-[#FBEDE6] border-[#C0512F] text-[#C0512F]'
                        : 'bg-white border-[#E4DCCB] text-[#241F18] hover:border-[#C7BDA8] active:bg-[#F5F1EA]'
                    }`}
                  >
                    {PAYOUT_METHOD_LABELS[m]}
                  </button>
                ))}
              </div>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                className="mt-2.5"
                disabled={!d.canWithdrawCash}
                isLoading={withdraw.pending}
                loadingLabel="Envoi de la demande…"
                onClick={askCash}
              >
                {d.canWithdrawCash
                  ? `Demander le retrait de ${fcfa(d.credits)}`
                  : `Encore ${fcfa(Math.max(0, d.thresholds.cashWithdrawal - d.credits))}`}
              </Button>
            </>
          )}
        </div>

        {d.recent.length > 0 && (
          <div className="mt-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8173] block mb-2">
              Mes filleuls récents
            </span>
            <div className="flex flex-col gap-1.5">
              {d.recent.map((r) => (
                <div
                  key={`${r.name}-${r.date}`}
                  className="p-3 rounded-xl bg-white border border-[#E4DCCB] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-[#241F18] truncate">{r.name}</span>
                    <span className="block text-[10.5px] text-[#8A8173]">Inscrit {relativeDay(r.date).toLowerCase()}</span>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${r.amount > 0 ? 'text-[#2F9E6E]' : 'text-[#8A8173]'}`}>
                    {r.amount > 0 ? fcfa(r.amount, { sign: true }) : 'Gratuit'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="pt-5 text-center">
        <p className="text-[10.5px] text-[#8A8173] leading-relaxed">
          Les retraits sont traités manuellement par l'administration, qui confirme chaque virement avec une référence
          de transaction.
        </p>
      </div>
    </div>
  );
};
