/**
 * « Mon code promo » — page absente de la navigation dans le live (audit §5).
 * Le barème affiché provient de lib/business/constants : il ne peut pas
 * diverger de celui réellement appliqué.
 */
import React from 'react';
import { Check, Copy, MessageCircle, Share2 } from 'lucide-react';
import { Button } from '../../ui/Button';
import { PageHeader, KpiCard } from '../../shared/primitives';
import { ErrorState, Skeleton, SkeletonCards } from '../../shared/states';
import { useApi, useCopyToClipboard } from '../../../lib/hooks';
import { getPromoCode } from '../../../lib/api/agent';
import { fcfa } from '../../../lib/format';
import { useToast } from '../../shared/Toast';

export const CommercialPromoCode: React.FC = () => {
  const toast = useToast();
  const state = useApi(getPromoCode);
  const [copiedCode, copyCode] = useCopyToClipboard();
  const [copiedLink, copyLink] = useCopyToClipboard();

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Mon code promo" subtitle="Chargement…" />
        <Skeleton className="h-40 rounded-2xl" />
        <SkeletonCards count={3} />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-5">
        <PageHeader title="Mon code promo" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const { code, shareUrl, signups, premium, scale } = state.data;
  const shareText = `Rejoins Mon Projet Mbeng avec mon code ${code} : cours d'allemand, examens blancs Goethe/telc et accompagnement vers l'Allemagne. ${shareUrl}`;

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-3xl">
      <PageHeader
        title="Mon code promo"
        subtitle="Chaque compte créé avec ce code t'est rattaché automatiquement et alimente tes cagnottes."
      />

      <div className="p-6 rounded-2xl bg-[#241F18] text-white border border-[#3A3226]">
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] block">
          Ton code d'affiliation
        </span>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="font-serif font-extrabold text-3xl tracking-wide">{code}</span>
          <button
            type="button"
            onClick={() => { copyCode(code); toast.success('Code copié.'); }}
            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/25 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]"
          >
            {copiedCode ? <Check size={14} className="text-[#2F9E6E]" /> : <Copy size={14} />}
            {copiedCode ? 'Copié' : 'Copier'}
          </button>
        </div>

        <div className="mt-5 p-3 rounded-xl bg-white/5 border border-white/10">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8173] block mb-1.5">
            Lien d'inscription direct
          </span>
          <p className="text-[11.5px] font-mono text-[#C7BDA8] break-all">{shareUrl}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<MessageCircle size={14} />}
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener')}
            >
              Partager sur WhatsApp
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="!border-white/25 !text-white hover:!bg-white/10"
              leftIcon={copiedLink ? <Check size={14} /> : <Share2 size={14} />}
              onClick={() => { copyLink(shareUrl); toast.success('Lien copié.'); }}
            >
              {copiedLink ? 'Lien copié' : 'Copier le lien'}
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <KpiCard label="Inscriptions via ce code" value={signups} hint={`${fcfa(scale.signup)} par compte actif`} />
        <KpiCard label="Conversions Premium" value={premium} hint={`${fcfa(scale.conversion)} par conversion`} tone="success" />
        <KpiCard
          label="Taux de conversion"
          value={signups ? `${Math.round((premium / signups) * 100)} %` : '—'}
          hint="Premium / inscriptions"
          tone="accent"
        />
      </div>
    </div>
  );
};
