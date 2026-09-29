import React, { useState, useEffect } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { PaymentMethodIcon } from '../../ui/PaymentMethodIcon';
import { StatusIcon } from '../../ui/StatusIcon';
import { PaymentProvider } from '../../../types';
import { Check, CheckCircle2, ShieldCheck, Sparkles, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';
import { DEV_TOOLS_ENABLED } from '../../../lib/env';
import { payPremium, type PaymentOutcome } from '../../../lib/api/user';
import { PREMIUM_PLANS } from '../../../lib/business/constants';
import { useMutation } from '../../../lib/hooks';
import { ErrorState } from '../../shared/states';
import { DevNotice } from '../../shared/DevNotice';

interface PaymentTunnelViewProps {
  onBack: () => void;
  onPaymentSuccess: () => void;
  initialPlanPrice?: number;
}

type TunnelStep = 
  | 'paywall' 
  | 'select_provider' 
  | 'provider_input' 
  | 'loading' 
  | 'timeout' 
  | 'insufficient_funds' 
  | 'failure' 
  | 'success';

export const PaymentTunnelView: React.FC<PaymentTunnelViewProps> = ({
  onBack,
  onPaymentSuccess,
  initialPlanPrice = 5000,
}) => {
  const [step, setStep] = useState<TunnelStep>('paywall');
  const [selectedPlan, setSelectedPlan] = useState<'month' | 'semester' | 'year'>('semester');
  const [selectedProvider, setSelectedProvider] = useState<PaymentProvider>('orange');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [timeoutTimer, setTimeoutTimer] = useState(15);

  const pay = useMutation(payPremium);

  // Tarifs lus depuis la source unique (lib/business/constants), jamais recopiés.
  const PLAN_BY_KEY = {
    month: PREMIUM_PLANS[0],
    semester: PREMIUM_PLANS[1],
    year: PREMIUM_PLANS[2],
  } as const;

  const currentPlan = PLAN_BY_KEY[selectedPlan];
  const currentPrice = currentPlan.price;

  // Simulation du timeout de validation Mobile Money (Section 5.1 du manuel)
  useEffect(() => {
    let timerId: any;
    if (step === 'loading') {
      setTimeoutTimer(8);
      timerId = setInterval(() => {
        setTimeoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(timerId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerId);
  }, [step]);

  /**
   * Le paiement passe par l'API : une transaction est réellement créée, le
   * statut Premium du compte est mis à jour et l'encaissement remonte dans la
   * comptabilité. `forceOutcome` n'est transmis que depuis les outils de
   * développement, absents du bundle de production.
   */
  const submitPayment = async (forceOutcome?: PaymentOutcome) => {
    setStep('loading');
    const result = await pay.run({
      planId: currentPlan.id,
      provider: selectedProvider,
      account: phoneOrEmail,
      forceOutcome,
    });

    if (!result) {
      setStep('provider_input');
      return;
    }

    switch (result.outcome) {
      case 'success':
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.5 } });
        setStep('success');
        break;
      case 'insufficient':
        setStep('insufficient_funds');
        break;
      case 'failed':
        setStep('failure');
        break;
      case 'timeout':
        setStep('timeout');
        break;
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton 
            onClick={step === 'paywall' ? onBack : () => setStep('paywall')} 
            title={step === 'paywall' ? "Retour" : "Changer de forfait"} 
          />
        </div>

        {/* 1. PAYWALL OFFICIEL (Pages 10, 11, 28 du PDF) */}
        {step === 'paywall' && (
          <div>
            <div className="text-center mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
                PASS PREMIUM OFFICIEL
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-2 mb-1">
                Passe en Premium
              </h2>
              <p className="text-xs text-[#8A8173] max-w-xs mx-auto">
                Mets toutes les chances de ton côté pour décrocher ton visa et ton examen B1/B2.
              </p>
            </div>

            {/* Avantages Premium avec puces */}
            <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] mb-5">
              <ul className="flex flex-col gap-2 text-xs text-[#3A3226]">
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#2F9E6E] shrink-0" />
                  <span>Bibliothèque complète et examens blancs illimités</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#2F9E6E] shrink-0" />
                  <span>Contacter et réserver des cours avec un Betreuer</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#2F9E6E] shrink-0" />
                  <span>Accompagnement complet Ausbildung / Studium</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-[#2F9E6E] shrink-0" />
                  <span>Aucune publicité</span>
                </li>
                <li className="flex items-center gap-2 font-semibold text-[#C0512F]">
                  <Sparkles size={16} className="shrink-0" />
                  <span>20% de réduction avec un code de parrainage</span>
                </li>
              </ul>
            </div>

            {/* 3 Formules d'abonnement (1 000 F, 5 000 F, 10 000 F) */}
            <div className="flex flex-col gap-2.5 mb-6">
              {([
                { id: 'month', label: PREMIUM_PLANS[0].label, price: `${PREMIUM_PLANS[0].price.toLocaleString('fr-FR')} F`, note: PREMIUM_PLANS[0].note },
                { id: 'semester', label: PREMIUM_PLANS[1].label, price: `${PREMIUM_PLANS[1].price.toLocaleString('fr-FR')} F`, note: 'Recommandé pour préparer le B1', badge: 'Populaire' },
                { id: 'year', label: PREMIUM_PLANS[2].label, price: `${PREMIUM_PLANS[2].price.toLocaleString('fr-FR')} F`, note: "Accompagnement jusqu'au départ en Allemagne", badge: 'Meilleure offre' },
              ] as { id: string; label: string; price: string; note: string; badge?: string }[]).map((p) => {
                const active = selectedPlan === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPlan(p.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      active
                        ? 'bg-[#FBEDE6] border-[#C0512F] shadow-focus-accent'
                        : 'bg-white border-[#E4DCCB] hover:border-[#8A8173]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-sm text-[#241F18]">{p.label}</span>
                        {p.badge && (
                          <span className="text-[10px] font-bold bg-[#C0512F] text-white px-2 py-0.2 rounded-full">
                            {p.badge}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-[#8A8173]">{p.note}</span>
                    </div>

                    <div className="text-right">
                      <span className="font-serif font-extrabold text-base text-[#241F18]">{p.price}</span>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ml-auto mt-1 ${
                        active ? 'border-[#C0512F] bg-[#C0512F] text-white' : 'border-[#E4DCCB]'
                      }`}>
                        {active && <Check size={12} strokeWidth={3} />}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={() => setStep('select_provider')}
              rightIcon={<ArrowRight size={16} />}
            >
              S'abonner ({currentPrice.toLocaleString()} F)
            </Button>
          </div>
        )}

        {/* 2. CHOIX DU MOYEN DE PAIEMENT (Section 1.3 & Page 28 du PDF) */}
        {step === 'select_provider' && (
          <div>
            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
                Tunnel de paiement sécurisé
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
                Choisir un moyen de paiement
              </h2>
              <p className="text-xs text-[#8A8173]">
                Total à régler : <strong className="text-[#241F18] font-bold">{currentPrice.toLocaleString()} FCFA</strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { id: 'orange', name: 'Orange Money', color: 'border-[#FF7900]' },
                { id: 'mtn', name: 'MTN MoMo', color: 'border-[#FFCC00]' },
                { id: 'paypal', name: 'PayPal', color: 'border-[#003087]' },
                { id: 'card', name: 'Carte bancaire', color: 'border-[#241F18]' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(prov.id as any);
                    setStep('provider_input');
                  }}
                  className={`p-4 rounded-xl bg-white border border-[#E4DCCB] hover:${prov.color} hover:shadow-subtle transition-all flex flex-col items-center text-center gap-2 group`}
                >
                  <PaymentMethodIcon type={prov.id as any} className="w-12 h-12" />
                  <span className="text-xs font-bold text-[#241F18] group-hover:text-[#C0512F]">
                    {prov.name}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] text-xs text-[#8A8173] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#2F9E6E] shrink-0" />
              <span>Paiement chiffré de bout en bout avec vérification par webhook serveur.</span>
            </div>
          </div>
        )}

        {/* 3. SAISIE DES IDENTIFIANTS DU PRESTATAIRE */}
        {step === 'provider_input' && (
          <div>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A8173] block">
                  Payer avec
                </span>
                <h3 className="font-serif font-bold text-xl text-[#241F18]">
                  {selectedProvider === 'orange' && 'Orange Money'}
                  {selectedProvider === 'mtn' && 'MTN Mobile Money'}
                  {selectedProvider === 'paypal' && 'PayPal'}
                  {selectedProvider === 'card' && 'Carte Bancaire'}
                </h3>
              </div>
              <PaymentMethodIcon type={selectedProvider} className="w-10 h-10" />
            </div>

            <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] flex flex-col gap-3.5 mb-5">
              <div>
                <label className="text-xs font-semibold text-[#8A8173] block mb-1">
                  {selectedProvider === 'paypal' ? 'Compte PayPal' : 'Numéro de compte débité'}
                </label>
                <input
                  type={selectedProvider === 'paypal' ? 'email' : 'tel'}
                  inputMode={selectedProvider === 'paypal' ? 'email' : 'tel'}
                  value={phoneOrEmail}
                  placeholder={selectedProvider === 'paypal' ? 'nom@exemple.com' : '+237 6XX XX XX XX'}
                  onChange={(e) => setPhoneOrEmail(e.target.value)}
                  className="w-full bg-[#FAF7F2] border border-[#E4DCCB] text-xs font-semibold p-3 rounded-xl outline-none transition-all hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent"
                />
              </div>

              {(selectedProvider === 'orange' || selectedProvider === 'mtn') && (
                <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#EFE9DC] text-[11.5px] text-[#3A3226]">
                  ℹ️ Tu recevras une invite USSD sur ton téléphone pour composer ton code secret et confirmer.
                </div>
              )}
            </div>

            {pay.error && (
              <div className="mb-3">
                <ErrorState message={pay.error.message} code={pay.error.code} compact />
              </div>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              isLoading={pay.pending}
              loadingLabel="Traitement…"
              disabled={!phoneOrEmail.trim()}
              onClick={() => submitPayment()}
            >
              Payer {currentPrice.toLocaleString('fr-FR')} FCFA
            </Button>

            {/*
              Audit §1.4 — le panneau de test était visible en production.
              Il est désormais rendu UNIQUEMENT lorsque DEV_TOOLS_ENABLED est
              vrai, c'est-à-dire jamais dans un build de production : la
              condition est évaluée à la compilation et tout le bloc disparaît.
            */}
            {DEV_TOOLS_ENABLED && (
              <div className="mt-8">
                <DevNotice title="Simulation des états de paiement">
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <button
                      type="button"
                      onClick={() => submitPayment('insufficient')}
                      className="p-2 rounded-lg bg-white border border-[#F0BDB8] text-[#B3261E] font-bold hover:bg-[#FBE9E7] transition-colors"
                    >
                      Fonds insuffisants
                    </button>
                    <button
                      type="button"
                      onClick={() => submitPayment('failed')}
                      className="p-2 rounded-lg bg-white border border-[#F0BDB8] text-[#B3261E] font-bold hover:bg-[#FBE9E7] transition-colors"
                    >
                      Transaction rejetée
                    </button>
                    <button
                      type="button"
                      onClick={() => submitPayment('timeout')}
                      className="col-span-2 p-2 rounded-lg bg-white border border-[#F0D9A8] text-[#A8710A] font-bold hover:bg-[#FBF0DC] transition-colors"
                    >
                      Timeout de validation USSD
                    </button>
                  </div>
                </DevNotice>
              </div>
            )}
          </div>
        )}

        {/* 4. ÉCRAN CHARGEMENT AVEC SPINNER OFFICIEL MBENG (#413A2E & #C0512F) */}
        {step === 'loading' && (
          <div className="text-center py-12 animate-fade-in">
            <div className="mbeng-spinner mx-auto mb-5" />
            <h3 className="font-serif font-bold text-xl text-[#241F18] mb-1">
              Traitement du paiement...
            </h3>
            <p className="text-xs text-[#8A8173] max-w-xs mx-auto">
              Veuillez confirmer la transaction sur votre téléphone en saisissant votre code secret.
            </p>
          </div>
        )}

        {/* 5. GESTION DU TIMEOUT (Section 5.1 du manuel : "basculer vers Toujours en attente / Réessayer") */}
        {step === 'timeout' && (
          <div className="text-center py-8 animate-scale-in">
            <StatusIcon type="warning" size="lg" className="mx-auto mb-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8710A] bg-[#FBF0DC] px-2.5 py-0.5 rounded border border-[#F0D9A8]">
              Toujours en attente
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#241F18] mt-2 mb-1">
              Délai de confirmation dépassé
            </h3>
            <p className="text-xs text-[#8A8173] max-w-xs mx-auto leading-relaxed mt-2">
              Nous n'avons pas encore reçu la confirmation de ton opérateur <strong className="text-[#241F18]">{selectedProvider === 'orange' ? 'Orange' : 'MTN'}</strong>. Ton compte n'a pas été débité.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => submitPayment()}
                leftIcon={<RefreshCw size={16} />}
              >
                Vérifier à nouveau le paiement
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setStep('select_provider')}
              >
                Changer de moyen de paiement
              </Button>
            </div>
          </div>
        )}

        {/* 6. FONDS INSUFFISANTS (Section 5.1 du manuel : écran spécifique Mobile Money) */}
        {step === 'insufficient_funds' && (
          <div className="text-center py-8 animate-scale-in">
            <StatusIcon type="error" size="lg" className="mx-auto mb-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3261E] bg-[#FBE9E7] px-2.5 py-0.5 rounded border border-[#F0BDB8]">
              Solde insuffisant
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#241F18] mt-2 mb-1">
              Fonds insuffisants sur le compte
            </h3>
            <div className="mt-3 p-3.5 rounded-xl bg-[#FBE9E7] border border-[#F0BDB8] text-xs text-[#B3261E] text-left max-w-xs mx-auto leading-relaxed">
              Le solde de ton compte <strong className="text-[#B3261E]">{selectedProvider === 'orange' ? 'Orange Money' : 'MTN MoMo'}</strong> ne permet pas de régler {currentPrice.toLocaleString()} FCFA.
            </div>

            <p className="text-xs text-[#8A8173] mt-3 max-w-xs mx-auto">
              Recharge ton compte mobile ou sélectionne un autre mode de règlement pour finaliser l'activation.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setStep('provider_input')}
              >
                Réessayer avec ce numéro
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={() => setStep('select_provider')}
              >
                Choisir un autre moyen de paiement
              </Button>
            </div>
          </div>
        )}

        {/* 7. ÉCHEC GÉNÉRAL / REFUS DE PAIEMENT (Section 1.2 & 5.1 : ROUGE #B3261E sans cul-de-sac) */}
        {step === 'failure' && (
          <div className="text-center py-8 animate-scale-in">
            <StatusIcon type="error" size="lg" className="mx-auto mb-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3261E] bg-[#FBE9E7] px-2.5 py-0.5 rounded border border-[#F0BDB8]">
              Paiement refusé
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#241F18] mt-2 mb-1">
              La transaction a échoué
            </h3>
            <p className="text-xs text-[#8A8173] max-w-xs mx-auto leading-relaxed mt-2">
              L'émetteur a rejeté la demande de débit. Aucun montant n'a été prélevé sur votre solde.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setStep('select_provider')}
              >
                Réessayer un autre moyen de paiement
              </Button>
              <Button
                variant="secondary"
                size="md"
                fullWidth
                onClick={onBack}
              >
                Retour à l'accueil
              </Button>
            </div>
          </div>
        )}

        {/* 8. SUCCÈS CONFIRMÉ AVEC BADGE VERT #2F9E6E ET CONFETTI (Section 1.2) */}
        {step === 'success' && (
          <div className="text-center py-8 animate-scale-in">
            <StatusIcon type="success" size="lg" className="mx-auto mb-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F9E6E] bg-[#DDF0E6] px-2.5 py-0.5 rounded">
              Paiement confirmé
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#241F18] mt-2 mb-1">
              Bienvenue dans le Premium !
            </h3>
            <p className="text-xs text-[#8A8173] max-w-xs mx-auto leading-relaxed">
              Ton compte est maintenant activé. Tu as désormais un accès sans restriction à l'ensemble des leçons, modelltests d'examens et à la messagerie avec les Betreuer.
            </p>

            <div className="mt-8 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={onPaymentSuccess}
              >
                Commencer à explorer mes cours
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
