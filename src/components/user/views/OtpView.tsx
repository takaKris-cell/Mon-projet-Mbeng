/**
 * Vérification du numéro — audit §4.
 * Corrections : la saisie ou le collage de plusieurs chiffres se répartit
 * automatiquement dans les cases suivantes (composant OtpInput partagé), et le
 * pied de page ne fait plus fuiter de nom de document interne.
 * WhatsApp reste le canal principal, avec bascule SMS automatique.
 */
import React, { useEffect, useState } from 'react';
import { CheckCircle2, MessageSquare, RefreshCw } from 'lucide-react';
import { Button } from '../../ui/Button';
import { BackButton } from '../../ui/BackButton';
import { OtpInput } from '../../shared/OtpInput';
import { DevNotice } from '../../shared/DevNotice';
import { DEV_TOOLS_ENABLED } from '../../../lib/env';
import { ErrorState } from '../../shared/states';
import { useMutation } from '../../../lib/hooks';
import { completeStudentRegistration, resendStudentOtp } from '../../../lib/api/auth';
import { formatPhoneForDisplay } from '../../../lib/validation';
import type { OtpTicket } from '../../../lib/api/otp';

interface OtpViewProps {
  phone: string;
  ticket: OtpTicket | null;
  onVerified: () => void;
  onBack: () => void;
}

export const OtpView: React.FC<OtpViewProps> = ({ phone, ticket: initialTicket, onVerified, onBack }) => {
  const [code, setCode] = useState('');
  const [ticket, setTicket] = useState<OtpTicket | null>(initialTicket);
  const [seconds, setSeconds] = useState(45);

  const verify = useMutation(completeStudentRegistration);
  const resend = useMutation(resendStudentOtp);

  useEffect(() => {
    if (seconds <= 0) return;
    const id = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [seconds]);

  const submit = async (value?: string) => {
    const session = await verify.run(phone, value ?? code);
    if (session) onVerified();
  };

  const askAgain = async () => {
    const next = await resend.run(phone);
    if (next) {
      setTicket(next);
      setCode('');
      setSeconds(45);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-[#FAF7F2] animate-fade-in">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} />
        </div>

        <div className="text-left mb-6">
          <div className="w-12 h-12 rounded-xl bg-[#FBEDE6] text-[#C0512F] flex items-center justify-center mb-3">
            <MessageSquare size={24} />
          </div>
          <h2 className="font-serif font-bold text-2xl text-[#241F18]">Vérifie ton numéro</h2>
          <p className="text-xs text-[#8A8173] mt-1.5 leading-relaxed">
            Nous avons envoyé un code à 6 chiffres par{' '}
            <strong className="text-[#241F18]">{ticket?.channel === 'sms' ? 'SMS' : 'WhatsApp'}</strong> au{' '}
            <span className="font-semibold text-[#241F18]">{formatPhoneForDisplay(phone)}</span>.
          </p>
          {ticket?.usedFallback && (
            <p className="text-[11px] text-[#A8710A] mt-1.5">
              Ce numéro ne semble pas actif sur WhatsApp : le code a été envoyé par SMS.
            </p>
          )}
        </div>

        <div className="my-6">
          <OtpInput
            value={code}
            onChange={setCode}
            error={Boolean(verify.error)}
            disabled={verify.pending}
            autoFocus
            onComplete={(v) => submit(v)}
          />
        </div>

        {verify.error && (
          <div className="mb-4">
            <ErrorState message={verify.error.message} code={verify.error.code} compact />
          </div>
        )}

        {DEV_TOOLS_ENABLED && ticket?.devCode && (
          <div className="mb-4">
            <DevNotice title="Code OTP simulé">
              Code envoyé : <strong className="font-mono text-sm">{ticket.devCode}</strong>
            </DevNotice>
          </div>
        )}

        <div className="flex items-center justify-between text-xs text-[#8A8173]">
          {seconds > 0 ? (
            <span>
              Renvoyer dans <strong className="text-[#241F18]">{seconds}s</strong>
            </span>
          ) : (
            <button
              type="button"
              onClick={askAgain}
              disabled={resend.pending}
              className="text-[#C0512F] font-bold hover:underline flex items-center gap-1 disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 rounded"
            >
              <RefreshCw size={12} /> Renvoyer le code
            </button>
          )}
          <span className="text-[11px]">Le code expire au bout de 5 minutes.</span>
        </div>

        <div className="mt-8">
          <Button
            variant="primary"
            size="lg"
            fullWidth
            isLoading={verify.pending}
            loadingLabel="Vérification…"
            disabled={code.length < 6}
            onClick={() => submit()}
          >
            Valider le code
          </Button>
        </div>
      </div>

      <div className="pt-4 text-center">
        <p className="text-[11px] text-[#8A8173] flex items-center justify-center gap-1.5">
          <CheckCircle2 size={12} className="text-[#2F9E6E]" />
          Ton numéro n'est utilisé que pour sécuriser ton compte.
        </p>
      </div>
    </div>
  );
};
