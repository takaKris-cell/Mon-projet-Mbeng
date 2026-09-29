/**
 * Écran Bienvenue — audit §4.
 * Corrections : grand logo NON encadré sur fond sombre (plus de vignette
 * carrée), suppression du badge « 100 % Officiel » et des cartes de
 * fonctionnalités non prévues, CTA unique « Continuer » (au lieu de deux
 * boutons), et rétablissement du sélecteur de pays.
 */
import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { CountrySelector } from '../../shared/CountrySelector';
import type { CountryCode } from '../../../lib/validation';

interface WelcomeViewProps {
  countryCode: CountryCode;
  onCountryChange: (code: CountryCode) => void;
  onContinue: () => void;
}

export const WelcomeView: React.FC<WelcomeViewProps> = ({ countryCode, onCountryChange, onContinue }) => (
  <div className="min-h-full flex flex-col justify-between bg-[#241F18] text-white p-7 animate-fade-in">
    <div className="flex-1 flex flex-col items-center justify-center text-center">
      {/* Grand logo, sans cadre ni fond rapporté. */}
      <img
        src="/assets/logos/logo_terracotta.jpg"
        alt="Mon Projet Mbeng"
        className="w-40 h-auto object-contain mb-7"
      />
      <h1 className="font-serif font-extrabold text-[26px] leading-tight tracking-tight">
        Mon Projet <span className="text-[#C0512F]">MBENG</span>
      </h1>
      <p className="text-[13px] text-[#C7BDA8] font-medium max-w-[290px] mt-3 leading-relaxed">
        Apprends l'allemand, prépare ton départ et réussis ton intégration académique et professionnelle en Allemagne.
      </p>
    </div>

    <div className="flex flex-col gap-4 pb-1">
      <div className="mbeng-dark-field">
        <CountrySelector
          label="Ton pays"
          value={countryCode}
          onChange={onCountryChange}
        />
      </div>

      <Button variant="primary" size="lg" fullWidth onClick={onContinue} rightIcon={<ArrowRight size={18} />}>
        Continuer
      </Button>

      <p className="text-center text-[10.5px] text-[#8A8173] leading-relaxed">
        Paiements sécurisés par Orange Money, MTN MoMo, PayPal et carte bancaire.
      </p>
    </div>
  </div>
);
