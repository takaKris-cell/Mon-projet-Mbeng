/**
 * Écran de connexion de la Super-Administration.
 *
 * Deux étapes obligatoires (Manuel §3.3) : email + mot de passe, PUIS second
 * facteur envoyé par WhatsApp. Aucun jeton n'est émis à la première étape :
 * il est impossible d'atteindre l'administration sans valider la 2FA.
 */
import React, { useState } from 'react';
import { ArrowLeft, KeyRound, Lock, Mail, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { OtpInput } from '../shared/OtpInput';
import { DevNotice } from '../shared/DevNotice';
import { ErrorState } from '../shared/states';
import { useMutation } from '../../lib/hooks';
import { completeAdminLogin, startAdminLogin, DEMO_ACCOUNTS, type AdminChallenge } from '../../lib/api/auth';
import { Link, ROUTES } from '../../lib/router';
import { DEV_TOOLS_ENABLED } from '../../lib/env';

export const AdminLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [challenge, setChallenge] = useState<AdminChallenge | null>(null);
  const [code, setCode] = useState('');

  const step1 = useMutation(startAdminLogin);
  const step2 = useMutation(completeAdminLogin);

  const submitCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await step1.run({ email, password });
    if (result) {
      setChallenge(result);
      setCode('');
    }
  };

  const submitCode = async (value?: string) => {
    if (!challenge) return;
    const session = await step2.run(challenge.email, value ?? code);
    if (session) onSuccess();
  };

  const resend = async () => {
    const result = await step1.run({ email, password });
    if (result) setChallenge(result);
  };

  return (
    <div className="min-h-screen bg-[#241F18] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[430px]">
        <Link
          to={ROUTES.landing}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8A8173] hover:text-[#FAF7F2] transition-colors mb-5"
        >
          <ArrowLeft size={14} /> Retour au site
        </Link>

        <div className="bg-[#2C261D] rounded-3xl border border-[#3A3226] p-7 shadow-elevation">
          <div className="flex flex-col items-center text-center mb-7">
            <img
              src="/assets/logos/logo_terracotta.jpg"
              alt="Mon Projet Mbeng"
              className="h-14 w-auto object-contain mb-4"
            />
            <h1 className="font-serif font-bold text-xl text-white">Super-Administration</h1>
            <p className="text-[11.5px] text-[#8A8173] mt-1">
              {challenge
                ? 'Étape 2 sur 2 — vérification en deux étapes'
                : 'Étape 1 sur 2 — identifiants administrateur'}
            </p>
          </div>

          {(step1.error || step2.error) && (
            <div className="mb-4">
              <ErrorState
                message={(step2.error ?? step1.error)!.message}
                code={(step2.error ?? step1.error)!.code}
                compact
              />
            </div>
          )}

          {!challenge ? (
            <form onSubmit={submitCredentials} className="flex flex-col gap-4" noValidate>
              <div className="mbeng-dark-field">
                <Input
                  label="Email administrateur"
                  type="email"
                  autoComplete="username"
                  placeholder="admin@monprojetmbeng.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftElement={<Mail size={16} />}
                  autoFocus
                />
              </div>
              <div className="mbeng-dark-field">
                <Input
                  label="Mot de passe"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftElement={<Lock size={16} />}
                />
              </div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={step1.pending}
                loadingLabel="Vérification…"
              >
                Continuer
              </Button>
            </form>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="p-3.5 rounded-xl bg-[#241F18] border border-[#3A3226] flex items-start gap-2.5">
                <KeyRound size={16} className="text-[#C0512F] shrink-0 mt-0.5" />
                <p className="text-[11.5px] text-[#C7BDA8] leading-relaxed">
                  Un code à 6 chiffres a été envoyé par{' '}
                  <strong className="text-white">
                    {challenge.ticket.channel === 'whatsapp' ? 'WhatsApp' : 'SMS'}
                  </strong>{' '}
                  au numéro <span className="font-mono text-white">{challenge.phoneMasked}</span>.
                </p>
              </div>

              <OtpInput
                value={code}
                onChange={setCode}
                error={Boolean(step2.error)}
                disabled={step2.pending}
                autoFocus
                onComplete={(v) => submitCode(v)}
              />

              {DEV_TOOLS_ENABLED && challenge.ticket.devCode && (
                <DevNotice title="Code 2FA simulé">
                  Code envoyé : <strong className="font-mono text-sm">{challenge.ticket.devCode}</strong>
                </DevNotice>
              )}

              <Button
                variant="primary"
                size="lg"
                fullWidth
                isLoading={step2.pending}
                loadingLabel="Vérification…"
                onClick={() => submitCode()}
              >
                Valider et accéder
              </Button>

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={resend}
                  disabled={step1.pending}
                  className="text-[11.5px] font-bold text-[#C0512F] hover:text-[#D9704F] inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={12} /> Renvoyer le code
                </button>
                <button
                  type="button"
                  onClick={() => { setChallenge(null); setCode(''); }}
                  className="text-[11.5px] font-semibold text-[#8A8173] hover:text-white transition-colors"
                >
                  Changer de compte
                </button>
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#8A8173] text-center mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-[#2F9E6E]" />
            2FA obligatoire pour tout accès aux données financières.
          </p>

          {DEV_TOOLS_ENABLED && !challenge && (
            <div className="mt-4">
              <DevNotice title="Compte de démonstration">
                Email <strong>{DEMO_ACCOUNTS.admin.identifier}</strong> · mot de passe{' '}
                <strong>{DEMO_ACCOUNTS.admin.password}</strong>
                <br />
                Le code 2FA s'affichera à l'étape suivante.
              </DevNotice>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
