/**
 * Connexion / inscription élève.
 * Le sélecteur de pays est le composant partagé `PhoneField` : il est donc
 * présent et identique sur mobile comme sur écran large (point 2 de la demande).
 * Aucun identifiant n'est pré-rempli : l'état par défaut est « non connecté ».
 */
import React, { useState } from 'react';
import { Eye, EyeOff, Gift, Lock, Mail, User } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { BackButton } from '../../ui/BackButton';
import { PhoneField } from '../../shared/CountrySelector';
import { DevNotice } from '../../shared/DevNotice';
import { DEV_TOOLS_ENABLED } from '../../../lib/env';
import { ErrorState } from '../../shared/states';
import { useMutation } from '../../../lib/hooks';
import { DEMO_ACCOUNTS, loginStudent, startStudentRegistration } from '../../../lib/api/auth';
import { fieldErrors, studentLoginSchema, studentRegisterSchema, type CountryCode } from '../../../lib/validation';
import type { OtpTicket } from '../../../lib/api/otp';

interface AuthViewProps {
  mode: 'login' | 'register';
  countryCode: CountryCode;
  onCountryChange: (code: CountryCode) => void;
  presetReferralCode?: string;
  onSwitchMode: (mode: 'login' | 'register') => void;
  onLoggedIn: () => void;
  onOtpRequired: (phone: string, ticket: OtpTicket) => void;
  onBack: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({
  mode, countryCode, onCountryChange, presetReferralCode, onSwitchMode, onLoggedIn, onOtpRequired, onBack,
}) => {
  const [localNumber, setLocalNumber] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [referralCode, setReferralCode] = useState(presetReferralCode ?? '');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const login = useMutation(loginStudent);
  const register = useMutation(startStudentRegistration);
  const pending = login.pending || register.pending;
  const apiError = login.error ?? register.error;

  const clear = (key: string) => setErrors((p) => (p[key] ? { ...p, [key]: '' } : p));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      const local = fieldErrors(studentLoginSchema, { countryCode, localNumber, password });
      setErrors(local);
      if (Object.keys(local).length > 0) return;
      if (await login.run({ countryCode, localNumber, password })) onLoggedIn();
    } else {
      const payload = { fullName, email, countryCode, localNumber, password, referralCode };
      const local = fieldErrors(studentRegisterSchema, payload);
      setErrors(local);
      if (Object.keys(local).length > 0) return;
      const result = await register.run(payload);
      if (result) onOtpRequired(result.phone, result.ticket);
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-[#FAF7F2] animate-fade-in">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} />
        </div>

        <div className="mb-6 text-left">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-1 rounded-md">
            {mode === 'login' ? 'Espace élève' : 'Nouveau compte'}
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-2.5">
            {mode === 'login' ? 'Content de te revoir' : 'Rejoins la communauté Mbeng'}
          </h2>
          <p className="text-xs text-[#8A8173] mt-1 leading-relaxed">
            {mode === 'login'
              ? "Connecte-toi pour reprendre tes révisions d'allemand."
              : 'Accède aux examens blancs, aux tuteurs certifiés et aux démarches pour l’Allemagne.'}
          </p>
        </div>

        {apiError && (
          <div className="mb-4">
            <ErrorState message={apiError.message} code={apiError.code} compact />
          </div>
        )}

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {mode === 'register' && (
            <>
              <Input
                label="Nom complet"
                placeholder="Ton prénom et ton nom"
                autoComplete="name"
                value={fullName}
                onChange={(e) => { setFullName(e.target.value); clear('fullName'); }}
                error={errors.fullName}
                leftElement={<User size={16} />}
              />
              <Input
                label="Adresse email"
                type="email"
                autoComplete="email"
                placeholder="nom@exemple.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clear('email'); }}
                error={errors.email}
                leftElement={<Mail size={16} />}
              />
            </>
          )}

          <PhoneField
            countryCode={countryCode}
            onCountryChange={onCountryChange}
            value={localNumber}
            onValueChange={(v) => { setLocalNumber(v); clear('localNumber'); }}
            error={errors.localNumber}
            autoFocus={mode === 'login'}
          />

          <Input
            label="Mot de passe"
            type={showPassword ? 'text' : 'password'}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clear('password'); }}
            error={errors.password}
            helperText={mode === 'register' ? '8 caractères minimum.' : undefined}
            leftElement={<Lock size={16} />}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                className="hover:text-[#241F18] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 rounded"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            }
          />

          {mode === 'register' && (
            <Input
              label="Code de parrainage (facultatif)"
              placeholder="Ex. MVG-2026"
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
              helperText="Si un conseiller t'a orienté, saisis son code ici."
              leftElement={<Gift size={16} />}
            />
          )}

          <div className="pt-1">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={pending}
              loadingLabel={mode === 'login' ? 'Connexion…' : 'Envoi du code…'}
            >
              {mode === 'login' ? 'Se connecter' : 'Valider et recevoir mon code'}
            </Button>
          </div>
        </form>

        {DEV_TOOLS_ENABLED && mode === 'login' && (
          <div className="mt-4">
            <DevNotice title="Compte de démonstration">
              Numéro <strong>{DEMO_ACCOUNTS.user.identifier}</strong> · mot de passe{' '}
              <strong>{DEMO_ACCOUNTS.user.password}</strong>
            </DevNotice>
          </div>
        )}
      </div>

      <div className="pt-6 border-t border-[#E4DCCB] mt-6 text-center">
        <p className="text-xs text-[#8A8173]">
          {mode === 'login' ? 'Pas encore de compte ? ' : 'Tu as déjà un compte ? '}
          <button
            type="button"
            onClick={() => { setErrors({}); login.clearError(); register.clearError(); onSwitchMode(mode === 'login' ? 'register' : 'login'); }}
            className="font-bold text-[#C0512F] hover:underline outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40 rounded"
          >
            {mode === 'login' ? 'Créer un compte' : 'Se connecter'}
          </button>
        </p>
      </div>
    </div>
  );
};
