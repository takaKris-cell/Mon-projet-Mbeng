/**
 * Écran de connexion de l'Espace Commercial.
 * C'est le point d'entrée OBLIGATOIRE du portail : aucun tableau de bord n'est
 * monté tant que cette étape n'a pas produit une session `commercial` valide.
 */
import React, { useState } from 'react';
import { Lock, Eye, EyeOff, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { PhoneField } from '../shared/CountrySelector';
import { DevNotice } from '../shared/DevNotice';
import { ErrorState } from '../shared/states';
import { useMutation } from '../../lib/hooks';
import { loginAgent, DEMO_ACCOUNTS } from '../../lib/api/auth';
import { DEFAULT_COUNTRY, fieldErrors, phoneSchema, type CountryCode } from '../../lib/validation';
import { Link, ROUTES } from '../../lib/router';
import { DEV_TOOLS_ENABLED } from '../../lib/env';

export const AgentLogin: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const login = useMutation(loginAgent);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const local = fieldErrors(phoneSchema, { countryCode, localNumber });
    if (!password) local.password = 'Le mot de passe est obligatoire.';
    setErrors(local);
    if (Object.keys(local).length > 0) return;

    const session = await login.run({ countryCode, localNumber, password });
    if (session) onSuccess();
  };

  return (
    <div className="min-h-screen bg-[#241F18] flex flex-col items-center justify-center p-5">
      <div className="w-full max-w-[420px]">
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
            <h1 className="font-serif font-bold text-xl text-white">Espace Commercial</h1>
            <p className="text-[11.5px] text-[#8A8173] mt-1">
              Portail réservé aux agents agréés Mon Projet Mbeng
            </p>
          </div>

          {login.error && (
            <div className="mb-4">
              <ErrorState message={login.error.message} code={login.error.code} compact />
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
            <div className="mbeng-dark-field">
              <PhoneField
                label="Numéro de téléphone professionnel"
                countryCode={countryCode}
                onCountryChange={setCountryCode}
                value={localNumber}
                onValueChange={(v) => {
                  setLocalNumber(v);
                  if (errors.localNumber) setErrors((p) => ({ ...p, localNumber: '' }));
                }}
                error={errors.localNumber}
                autoFocus
              />
            </div>

            <div className="mbeng-dark-field">
              <Input
                label="Mot de passe"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((p) => ({ ...p, password: '' }));
                }}
                error={errors.password}
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
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={login.pending}
              loadingLabel="Vérification…"
            >
              Se connecter
            </Button>
          </form>

          <p className="text-[11px] text-[#8A8173] text-center mt-5 flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-[#2F9E6E]" />
            Accès tracé : chaque connexion est journalisée.
          </p>

          {DEV_TOOLS_ENABLED && (
            <div className="mt-4">
              <DevNotice title="Compte de démonstration">
                Identifiant <strong>{DEMO_ACCOUNTS.commercial.identifier}</strong> · mot de passe{' '}
                <strong>{DEMO_ACCOUNTS.commercial.password}</strong>
              </DevNotice>
            </div>
          )}
        </div>

        <p className="text-center text-[11px] text-[#8A8173] mt-5">
          Pas encore de code commercial ? Contacte l'équipe Mon Projet Mbeng.
        </p>
      </div>
    </div>
  );
};
