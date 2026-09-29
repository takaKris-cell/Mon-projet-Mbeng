import React, { useState } from 'react';
import { UserProfile, UserScreen } from '../../../types';
import { 
  User, 
  Phone, 
  Globe, 
  CreditCard, 
  Share2, 
  HelpCircle, 
  LogOut, 
  ChevronRight, 
  ShieldCheck, 
  Sparkles, 
  Smartphone,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { Button } from '../../ui/Button';
import { PhoneField } from '../../shared/CountrySelector';
import { OtpInput } from '../../shared/OtpInput';
import { DevNotice } from '../../shared/DevNotice';
import { DEV_TOOLS_ENABLED } from '../../../lib/env';
import { ErrorState } from '../../shared/states';
import { useMutation } from '../../../lib/hooks';
import { confirmPhoneChange, requestPhoneChangeOtp } from '../../../lib/api/user';
import { DEFAULT_COUNTRY, formatPhoneForDisplay, type CountryCode } from '../../../lib/validation';
import type { OtpTicket } from '../../../lib/api/otp';
import { useToast } from '../../shared/Toast';
import { fcfa } from '../../../lib/format';

interface AccountViewProps {
  user: UserProfile;
  onNavigate: (screen: UserScreen) => void;
  onGoPremium: () => void;
  onLogout: () => void;
  /** Recharge le profil après une modification réellement enregistrée côté API. */
  onProfileChanged: () => void;
}

export const AccountView: React.FC<AccountViewProps> = ({
  user,
  onNavigate,
  onGoPremium,
  onLogout,
  onProfileChanged,
}) => {
  const toast = useToast();
  const [activeModal, setActiveModal] = useState<'phone' | 'language' | 'payment_methods' | 'support' | null>(null);
  const [countryCode, setCountryCode] = useState<CountryCode>(DEFAULT_COUNTRY);
  const [localNumber, setLocalNumber] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<'fr' | 'de' | 'en'>('fr');
  const [otpCode, setOtpCode] = useState('');
  const [pendingPhone, setPendingPhone] = useState('');
  const [ticket, setTicket] = useState<OtpTicket | null>(null);

  const askOtp = useMutation(requestPhoneChangeOtp);
  const confirmChange = useMutation(confirmPhoneChange);

  const openPhoneModal = () => {
    setLocalNumber(''); setOtpCode(''); setTicket(null); setPendingPhone('');
    askOtp.clearError(); confirmChange.clearError();
    setActiveModal('phone');
  };

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await askOtp.run(countryCode, localNumber);
    if (result) {
      setPendingPhone(result.phone);
      setTicket(result.ticket);
    }
  };

  const handleVerifyNewPhone = async () => {
    const profile = await confirmChange.run(pendingPhone, otpCode);
    if (profile) {
      toast.success('Numéro de téléphone mis à jour.', 'Le changement est journalisé pour ta sécurité.');
      onProfileChanged();
      setActiveModal(null);
    }
  };

  return (
    <div className="pb-8 animate-fade-in text-left">
      {/* Header Profil */}
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[#241F18] text-white flex items-center justify-center font-serif font-bold text-xl border border-[#E4DCCB]">
            {user.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <h2 className="font-serif font-bold text-xl text-[#241F18]">
              {user.name}
            </h2>
            <p className="text-xs text-[#8A8173] font-medium">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold text-[#C0512F] bg-[#FBEDE6] px-2 py-0.5 rounded">
                Niveau {user.level}
              </span>
              <span className="text-[10px] text-[#8A8173]">
                {user.city}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 flex flex-col gap-4">
        {/* CARTE STATUT ABONNEMENT */}
        <div className="p-4 rounded-xl bg-[#241F18] text-white border border-[#3A3226] flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8A8173] block">
              Abonnement actuel
            </span>
            <h3 className="font-serif font-bold text-lg text-[#FAF7F2]">
              {user.isPremium ? 'Membre Premium Actif' : 'Formule Découverte (Gratuit)'}
            </h3>
            <p className="text-[11px] text-[#E4DCCB]/80 mt-0.5">
              {user.isPremium ? 'Accès illimité à tous les modelltests et guides' : 'Accès aux leçons libres et au Modelltest 1'}
            </p>
          </div>
          {!user.isPremium && (
            <button
              onClick={onGoPremium}
              className="text-xs font-bold bg-[#C0512F] text-white px-3.5 py-2 rounded-xl hover:bg-[#A8452A] transition-colors whitespace-nowrap ml-2 shadow-sm"
            >
              Passer Premium
            </button>
          )}
        </div>

        {/* SECTION PROFIL & COMPTE */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8173] block mb-2">
            PROFIL & LANGUE
          </span>
          <div className="bg-white rounded-xl border border-[#E4DCCB] divide-y divide-[#EFE9DC]">
            {/* Ligne Téléphone */}
            <div 
              onClick={openPhoneModal}
              className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Phone size={17} className="text-[#8A8173] group-hover:text-[#C0512F]" />
                <div>
                  <span className="text-xs font-semibold text-[#241F18] block">Numéro de téléphone</span>
                  <span className="text-[11px] text-[#8A8173]">{formatPhoneForDisplay(user.phone)}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F]" />
            </div>

            {/* Ligne Langue */}
            <div 
              onClick={() => setActiveModal('language')}
              className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Globe size={17} className="text-[#8A8173] group-hover:text-[#C0512F]" />
                <div>
                  <span className="text-xs font-semibold text-[#241F18] block">Langue de l'interface</span>
                  <span className="text-[11px] text-[#8A8173]">
                    {selectedLanguage === 'fr' ? 'Français' : selectedLanguage === 'de' ? 'Deutsch' : 'English'}
                  </span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F]" />
            </div>
          </div>
        </div>

        {/* SECTION PARRAINAGE & PAIEMENT */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8173] block mb-2">
            PARRAINAGE & PAIEMENT
          </span>
          <div className="bg-white rounded-xl border border-[#E4DCCB] divide-y divide-[#EFE9DC]">
            <div 
              onClick={() => onNavigate('referral')}
              className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Share2 size={17} className="text-[#8A8173] group-hover:text-[#C0512F]" />
                <div>
                  <span className="text-xs font-semibold text-[#241F18] block">Mon code de parrainage</span>
                  <span className="text-[11px] text-[#C0512F] font-bold">{user.referralCode}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F]" />
            </div>

            <div 
              onClick={() => onNavigate('referral')}
              className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <DollarSign size={17} className="text-[#8A8173] group-hover:text-[#C0512F]" />
                <div>
                  <span className="text-xs font-semibold text-[#241F18] block">Mes gains accumulés</span>
                  <span className="text-[11px] text-[#2F9E6E] font-bold">{fcfa(user.referralEarnings)}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F]" />
            </div>

            <div 
              onClick={() => setActiveModal('payment_methods')}
              className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <CreditCard size={17} className="text-[#8A8173] group-hover:text-[#C0512F]" />
                <div>
                  <span className="text-xs font-semibold text-[#241F18] block">Moyens de paiement</span>
                  <span className="text-[11px] text-[#8A8173]">Orange Money, MTN MoMo, Carte</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F]" />
            </div>
          </div>
        </div>

        {/* SECTION SUPPORT & ASSISTANCE (Créée conformément à la section 5.2 du manuel !) */}
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8173] block mb-2">
            ASSISTANCE & APPLICATION
          </span>
          <div className="bg-white rounded-xl border border-[#E4DCCB] divide-y divide-[#EFE9DC]">
            <div 
              onClick={() => setActiveModal('support')}
              className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <HelpCircle size={17} className="text-[#8A8173] group-hover:text-[#C0512F]" />
                <div>
                  <span className="text-xs font-semibold text-[#241F18] block">Aide & Nous contacter</span>
                  <span className="text-[11px] text-[#8A8173]">Support WhatsApp direct & FAQ</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F]" />
            </div>

            <div 
              onClick={() => onNavigate('become_betreuer_intro')}
              className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <ShieldCheck size={17} className="text-[#8A8173] group-hover:text-[#C0512F]" />
                <div>
                  <span className="text-xs font-semibold text-[#241F18] block">Devenir Betreuer</span>
                  <span className="text-[11px] text-[#8A8173]">Postuler comme répétiteur agréé</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F]" />
            </div>
          </div>
        </div>

        {/* Bouton Déconnexion */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onLogout}
            className="w-full py-3 px-4 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#B3261E] text-xs font-bold text-[#B3261E] flex items-center justify-center gap-2 transition-all hover:bg-[#FBE9E7]/30"
          >
            <LogOut size={16} />
            <span>Se déconnecter</span>
          </button>
        </div>
      </div>

      {/* MODAL 1 : CHANGER LE NUMÉRO AVEC RE-VÉRIFICATION OTP (Exigence 5.2) */}
      {activeModal === 'phone' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-sm rounded-2xl p-5 border border-[#E4DCCB] shadow-elevation animate-slide-up text-left">
            <h3 className="font-serif font-bold text-base text-[#241F18] mb-1">
              Changer de numéro de téléphone
            </h3>
            <p className="text-xs text-[#8A8173] mb-4">
              Un code de vérification sera envoyé au nouveau numéro : sans lui, le changement n'est pas enregistré.
            </p>

            {(askOtp.error || confirmChange.error) && (
              <div className="mb-3">
                <ErrorState
                  message={(confirmChange.error ?? askOtp.error)!.message}
                  code={(confirmChange.error ?? askOtp.error)!.code}
                  compact
                />
              </div>
            )}

            {!ticket ? (
              <form onSubmit={handleSendPhoneOtp} className="flex flex-col gap-3">
                <PhoneField
                  label="Nouveau numéro"
                  countryCode={countryCode}
                  onCountryChange={setCountryCode}
                  value={localNumber}
                  onValueChange={setLocalNumber}
                  helperText={`Numéro actuel : ${formatPhoneForDisplay(user.phone)}`}
                  autoFocus
                />
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="md" fullWidth type="button" onClick={() => setActiveModal(null)}>
                    Annuler
                  </Button>
                  <Button variant="primary" size="md" fullWidth type="submit" isLoading={askOtp.pending} loadingLabel="Envoi…">
                    Recevoir le code
                  </Button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col gap-3">
                <p className="text-[11.5px] text-[#3A3226] leading-relaxed">
                  Code envoyé par <strong>{ticket.channel === 'sms' ? 'SMS' : 'WhatsApp'}</strong> au{' '}
                  <strong>{formatPhoneForDisplay(pendingPhone)}</strong>.
                </p>
                <OtpInput
                  value={otpCode}
                  onChange={setOtpCode}
                  error={Boolean(confirmChange.error)}
                  disabled={confirmChange.pending}
                  autoFocus
                  onComplete={() => handleVerifyNewPhone()}
                />
                {DEV_TOOLS_ENABLED && ticket.devCode && (
                  <DevNotice title="Code OTP simulé">
                    Code envoyé : <strong className="font-mono text-sm">{ticket.devCode}</strong>
                  </DevNotice>
                )}
                <Button
                  variant="primary"
                  size="md"
                  fullWidth
                  disabled={otpCode.length < 6}
                  isLoading={confirmChange.pending}
                  loadingLabel="Vérification…"
                  onClick={handleVerifyNewPhone}
                >
                  Confirmer le nouveau numéro
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2 : CHANGER LA LANGUE (Exigence 5.2) */}
      {activeModal === 'language' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-sm rounded-2xl p-5 border border-[#E4DCCB] shadow-elevation animate-slide-up text-left">
            <h3 className="font-serif font-bold text-base text-[#241F18] mb-3">
              Choisir la langue de l'application
            </h3>
            <div className="flex flex-col gap-2 mb-4">
              {[
                { code: 'fr', label: 'Français (Cameroun & Diaspora)' },
                { code: 'de', label: 'Deutsch (Immersion)' },
                { code: 'en', label: 'English' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => {
                    setSelectedLanguage(lang.code as any);
                    setActiveModal(null);
                  }}
                  className={`p-3 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                    selectedLanguage === lang.code
                      ? 'bg-[#FBEDE6] border-[#C0512F] text-[#C0512F]'
                      : 'bg-white border-[#E4DCCB] text-[#241F18]'
                  }`}
                >
                  <span>{lang.label}</span>
                  {selectedLanguage === lang.code && <CheckCircle2 size={16} />}
                </button>
              ))}
            </div>
            <Button variant="secondary" size="md" fullWidth onClick={() => setActiveModal(null)}>
              Fermer
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 3 : MOYENS DE PAIEMENT ENREGISTRÉS */}
      {activeModal === 'payment_methods' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-sm rounded-2xl p-5 border border-[#E4DCCB] shadow-elevation animate-slide-up text-left">
            <h3 className="font-serif font-bold text-base text-[#241F18] mb-3">
              Moyens de paiement associés
            </h3>
            <div className="flex flex-col gap-2 mb-4">
              <div className="p-3 rounded-xl bg-white border border-[#E4DCCB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#FF7900] block">Orange Money</span>
                  <span className="text-[11px] text-[#8A8173]">{formatPhoneForDisplay(user.phone)}</span>
                </div>
                <span className="text-[10px] bg-[#DDF0E6] text-[#2F9E6E] font-bold px-2 py-0.5 rounded">Par défaut</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-[#E4DCCB] flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[#04263B] block">MTN Mobile Money</span>
                  <span className="text-[11px] text-[#8A8173]">+237 671 22 90 14</span>
                </div>
                <span className="text-[10px] text-[#8A8173]">Actif</span>
              </div>
            </div>
            <Button variant="secondary" size="md" fullWidth onClick={() => setActiveModal(null)}>
              Fermer
            </Button>
          </div>
        </div>
      )}

      {/* MODAL 4 : AIDE & NOUS CONTACTER (Créée conformément à la section 5.2) */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#FAF7F2] w-full max-w-sm rounded-2xl p-5 border border-[#E4DCCB] shadow-elevation animate-slide-up text-left">
            <h3 className="font-serif font-bold text-base text-[#241F18] mb-1">
              Centre d'Aide & Support
            </h3>
            <p className="text-xs text-[#8A8173] mb-4">
              Notre équipe d'assistance est joignable 7j/7 de 8h à 20h (heure de Yaoundé/Douala).
            </p>
            <div className="flex flex-col gap-2.5 mb-5">
              <button
                type="button"
                onClick={() => {
                  window.open('https://wa.me/237699456128?text=Bonjour,%20j\'ai%20besoin%20d\'aide%20sur%20Mon%20Projet%20Mbeng', '_blank');
                }}
                className="p-3.5 rounded-xl bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/30 font-bold text-xs flex items-center justify-between hover:bg-[#25D366]/20 transition-all"
              >
                <span>Discussion instantanée WhatsApp</span>
                <ChevronRight size={16} />
              </button>

              <div className="p-3 rounded-xl bg-white border border-[#E4DCCB]">
                <h5 className="text-xs font-bold text-[#241F18]">Email d'assistance</h5>
                <p className="text-[11px] text-[#8A8173]">support@monprojetmbeng.com</p>
              </div>

              <div className="p-3 rounded-xl bg-white border border-[#E4DCCB]">
                <h5 className="text-xs font-bold text-[#241F18]">Foire Aux Questions (FAQ)</h5>
                <p className="text-[11px] text-[#8A8173]">Comment fonctionne le déblocage des examens blancs ?</p>
              </div>
            </div>
            <Button variant="secondary" size="md" fullWidth onClick={() => setActiveModal(null)}>
              Fermer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
