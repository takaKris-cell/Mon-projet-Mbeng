/**
 * « Paramètres & RIB » — audit §5 (recommandation de sécurité) / Manuel §3.5.
 *
 * Le numéro qui reçoit les commissions n'est plus modifiable en texte libre :
 *  1. l'agent demande un code OTP envoyé sur son numéro de compte ;
 *  2. le backend refuse l'écriture sans code valide ;
 *  3. le changement est journalisé dans `audit_log` ;
 *  4. une notification part sur l'ANCIEN et le NOUVEAU numéro.
 */
import React, { useState } from 'react';
import { BellRing, Check, Pencil, ShieldAlert, ShieldCheck, Smartphone } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Modal } from '../../shared/Modal';
import { OtpInput } from '../../shared/OtpInput';
import { PhoneField } from '../../shared/CountrySelector';
import { DevNotice } from '../../shared/DevNotice';
import { DEV_TOOLS_ENABLED } from '../../../lib/env';
import { PageHeader, StatusBadge } from '../../shared/primitives';
import { ErrorState, Skeleton } from '../../shared/states';
import { useApi, useMutation } from '../../../lib/hooks';
import { getAgentSettings, requestPayoutNumberOtp, updatePayoutNumber } from '../../../lib/api/agent';
import { DEFAULT_COUNTRY, fieldErrors, formatPhoneForDisplay, phoneSchema, type CountryCode } from '../../../lib/validation';
import { human, initials } from '../../../lib/format';
import { useToast } from '../../shared/Toast';
import type { OtpTicket } from '../../../lib/api/otp';
import { PAYOUT_METHOD_LABELS, PAYOUT_METHODS, type PayoutMethod } from '../../../lib/business/constants';

export const CommercialSettings: React.FC = () => {
  const toast = useToast();
  const state = useApi(getAgentSettings);
  const askOtp = useMutation(requestPayoutNumberOtp);
  const confirm = useMutation(updatePayoutNumber);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'form' | 'otp'>('form');
  const [provider, setProvider] = useState<PayoutMethod>('orange_money');
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState('');
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState<OtpTicket | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (state.initialLoading) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl">
        <PageHeader title="Paramètres & RIB" subtitle="Chargement…" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="flex flex-col gap-5 max-w-2xl">
        <PageHeader title="Paramètres & RIB" />
        <ErrorState message={state.error?.message ?? 'Chargement impossible.'} code={state.error?.code} onRetry={state.reload} />
      </div>
    );
  }

  const agent = state.data;

  const openModal = () => {
    setProvider(agent.payoutMethod);
    setLocalNumber('');
    setCode('');
    setTicket(null);
    setErrors({});
    setStep('form');
    askOtp.clearError();
    confirm.clearError();
    setOpen(true);
  };

  const sendOtp = async () => {
    const local = fieldErrors(phoneSchema, { countryCode, localNumber });
    setErrors(local);
    if (Object.keys(local).length > 0) return;
    const result = await askOtp.run();
    if (result) {
      setTicket(result);
      setStep('otp');
    }
  };

  const save = async () => {
    const result = await confirm.run({ provider, countryCode, localNumber, otpCode: code });
    if (result) {
      toast.success(
        'Numéro de paiement mis à jour.',
        `Une notification de sécurité a été envoyée à l'ancien (${formatPhoneForDisplay(result.notified[0])}) et au nouveau numéro.`,
      );
      setOpen(false);
      state.reload();
    }
  };

  return (
    <div className="flex flex-col gap-5 animate-fade-in max-w-2xl">
      <PageHeader
        title="Paramètres & RIB"
        subtitle="Profil agent et coordonnées de versement de tes commissions."
      />

      {/* Bloc profil, disparu du live */}
      <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB] flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#C0512F] text-white flex items-center justify-center font-serif font-bold text-lg shrink-0">
          {initials(agent.fullName)}
        </div>
        <div className="min-w-0">
          <h3 className="font-serif font-bold text-lg text-[#241F18] leading-tight">{agent.fullName}</h3>
          <p className="text-xs text-[#8A8173] mt-0.5">Agent commercial · {agent.zone}</p>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <StatusBadge tone="accent">Code {agent.affiliateCode}</StatusBadge>
            <StatusBadge tone={agent.status === 'actif' ? 'success' : 'danger'}>{human(agent.status)}</StatusBadge>
            <StatusBadge tone={agent.commissionStatus === 'rejected' ? 'danger' : 'info'}>
              Commissions : {human(agent.commissionStatus)}
            </StatusBadge>
          </div>
        </div>
      </div>

      <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB] flex flex-col gap-4">
        <div>
          <h3 className="font-serif font-bold text-base text-[#241F18]">Numéros de paiement</h3>
          <p className="text-[11.5px] text-[#8A8173] mt-0.5">
            C'est sur ce numéro que le Super-Admin envoie tes commissions.
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white border border-[#E4DCCB] flex items-center justify-center shrink-0">
              <Smartphone size={18} className="text-[#C0512F]" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8173] block">
                {PAYOUT_METHOD_LABELS[agent.payoutMethod]} — compte principal
              </span>
              <span className="font-mono font-bold text-sm text-[#241F18]">
                {formatPhoneForDisplay(agent.payoutNumber)}
              </span>
            </div>
          </div>
          <Button variant="secondary" size="sm" leftIcon={<Pencil size={13} />} onClick={openModal}>
            Modifier
          </Button>
        </div>

        {agent.backupPayoutNumber && (
          <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#E4DCCB] flex items-center justify-center shrink-0">
                <Smartphone size={18} className="text-[#8A8173]" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8173] block">
                  Numéro de secours
                </span>
                <span className="font-mono font-bold text-sm text-[#241F18]">
                  {formatPhoneForDisplay(agent.backupPayoutNumber)}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-[#FBF0DC] border border-[#F0D9A8] flex items-start gap-2.5">
          <ShieldAlert size={16} className="text-[#A8710A] shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-[#6B4A08] leading-relaxed">
            Rediriger un paiement vers un numéro non autorisé équivaut à une fraude. Toute modification exige donc un
            code de vérification envoyé sur ton numéro, est journalisée, et déclenche une notification sur l'ancien
            comme sur le nouveau numéro.
          </p>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Modifier mon numéro de paiement"
        description={
          step === 'form'
            ? 'Un code de vérification te sera envoyé avant tout enregistrement.'
            : 'Saisis le code reçu pour confirmer le changement.'
        }
        footer={
          step === 'form' ? (
            <>
              <Button variant="ghost" size="md" onClick={() => setOpen(false)}>Annuler</Button>
              <Button variant="primary" size="md" isLoading={askOtp.pending} loadingLabel="Envoi du code…" onClick={sendOtp}>
                Recevoir le code de vérification
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={() => setStep('form')}>Retour</Button>
              <Button
                variant="primary"
                size="md"
                isLoading={confirm.pending}
                loadingLabel="Enregistrement…"
                disabled={code.length < 6}
                onClick={save}
              >
                Confirmer le changement
              </Button>
            </>
          )
        }
      >
        {(askOtp.error || confirm.error) && (
          <div className="mb-4">
            <ErrorState message={(confirm.error ?? askOtp.error)!.message} code={(confirm.error ?? askOtp.error)!.code} compact />
          </div>
        )}

        {step === 'form' ? (
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-semibold text-[#8A8173] block mb-2">Opérateur</span>
              <div className="grid grid-cols-2 gap-2">
                {PAYOUT_METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setProvider(m)}
                    aria-pressed={provider === m}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 ${
                      provider === m
                        ? 'bg-[#FBEDE6] border-[#C0512F] text-[#C0512F]'
                        : 'bg-white border-[#E4DCCB] text-[#241F18] hover:border-[#C7BDA8] active:bg-[#F5F1EA]'
                    }`}
                  >
                    <span className="flex items-center justify-center gap-1.5">
                      {provider === m && <Check size={13} />}
                      {PAYOUT_METHOD_LABELS[m]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <PhoneField
              label="Nouveau numéro de paiement"
              countryCode={countryCode}
              onCountryChange={setCountryCode}
              value={localNumber}
              onValueChange={(v) => { setLocalNumber(v); setErrors((p) => ({ ...p, localNumber: '' })); }}
              error={errors.localNumber}
              helperText="Le numéro doit être au nom du titulaire du compte agent."
            />

            <Input label="Numéro actuel" value={formatPhoneForDisplay(agent.payoutNumber)} disabled />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="p-3.5 rounded-xl bg-[#FAF7F2] border border-[#EFE9DC] flex items-start gap-2.5">
              <ShieldCheck size={16} className="text-[#2F9E6E] shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-[#3A3226] leading-relaxed">
                Code envoyé par <strong>{ticket?.channel === 'sms' ? 'SMS' : 'WhatsApp'}</strong> au{' '}
                {formatPhoneForDisplay(agent.phone)}. Il expire dans 5 minutes.
              </p>
            </div>

            <OtpInput value={code} onChange={setCode} error={Boolean(confirm.error)} disabled={confirm.pending} autoFocus />

            {DEV_TOOLS_ENABLED && ticket?.devCode && (
              <DevNotice title="Code OTP simulé">
                Code envoyé : <strong className="font-mono text-sm">{ticket.devCode}</strong>
              </DevNotice>
            )}

            <div className="p-3.5 rounded-xl bg-[#FBEDE6] border border-[#C0512F]/20 flex items-start gap-2.5">
              <BellRing size={16} className="text-[#C0512F] shrink-0 mt-0.5" />
              <p className="text-[11.5px] text-[#8F3B24] leading-relaxed">
                Après confirmation, une alerte de sécurité partira sur l'ancien numéro{' '}
                <strong className="font-mono">{formatPhoneForDisplay(agent.payoutNumber)}</strong> et sur le nouveau.
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
