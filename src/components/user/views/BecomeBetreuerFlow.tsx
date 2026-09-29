import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { DevNotice } from '../../shared/DevNotice';
import { DEV_TOOLS_ENABLED } from '../../../lib/env';
import { Input } from '../../ui/Input';
import { StatusIcon } from '../../ui/StatusIcon';
import { 
  Upload, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  MapPin, 
  DollarSign, 
  FileText, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BecomeBetreuerFlowProps {
  onBack: () => void;
  onFinishPublished: () => void;
}

type BetreuerStage = 'intro' | 'form' | 'pending' | 'rejected' | 'approved' | 'create_offer';

export const BecomeBetreuerFlow: React.FC<BecomeBetreuerFlowProps> = ({
  onBack,
  onFinishPublished,
}) => {
  const [stage, setStage] = useState<BetreuerStage>('intro');
  const [name, setName] = useState('Yannick Kamga');
  const [phone, setPhone] = useState('+237 671 22 90 14');
  const [level, setLevel] = useState('B2');
  const [certificateType, setCertificateType] = useState('Goethe-Zertifikat B2');
  const [fileName, setFileName] = useState('Goethe_B2_Zertifikat_Scan.pdf');
  const [formatOption, setFormatOption] = useState<'les_deux' | 'presentiel' | 'en_ligne'>('les_deux');
  const [hourlyRate, setHourlyRate] = useState('10000');
  const [city, setCity] = useState('Douala');
  const [bio, setBio] = useState('Enseignant d\'allemand expérimenté, spécialisé en préparation aux examens et simulations orales.');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStage('pending');
    }, 700);
  };

  const handleSimulateApproval = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.6 }
    });
    setStage('approved');
  };

  const handleSimulateRejection = () => {
    setStage('rejected');
  };

  const handlePublishOffer = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 }
      });
      onFinishPublished();
    }, 700);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={stage === 'intro' ? onBack : () => setStage('intro')} title="Retour" />
        </div>

        {/* 1. ÉCRAN INTRO DEVENIR BETREUER */}
        {stage === 'intro' && (
          <div>
            <div className="p-5 rounded-2xl bg-[#241F18] text-white mb-5 border border-[#3A3226]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#C0512F]/15 px-2 py-0.5 rounded">
                PROGRAMME TUTEURS
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#FAF7F2] mt-2 mb-1">
                Devenir Betreuer Mbeng
              </h2>
              <p className="text-xs text-[#E4DCCB]/85 leading-relaxed">
                Partage ton expérience, aide les candidats camerounais à réussir leurs examens d'allemand et gagne des revenus réguliers.
              </p>
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#DDF0E6] text-[#2F9E6E] flex items-center justify-center shrink-0">
                  <DollarSign size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#241F18]">Fixe ton tarif horaire librement</h4>
                  <p className="text-[11px] text-[#8A8173]">De 8 000 à 15 000 FCFA par heure de cours</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FBEDE6] text-[#C0512F] flex items-center justify-center shrink-0">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#241F18]">Validation sous 48h</h4>
                  <p className="text-[11px] text-[#8A8173]">Vérification rigoureuse de ton diplôme de langue</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#FAF7F2] text-[#241F18] flex items-center justify-center shrink-0 border border-[#E4DCCB]">
                  <Clock size={18} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#241F18]">Choisis tes créneaux</h4>
                  <p className="text-[11px] text-[#8A8173]">Cours en présentiel ou en ligne selon ton emploi du temps</p>
                </div>
              </div>
            </div>

            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setStage('form')}
              >
                Postuler maintenant
              </Button>
            </div>
          </div>
        )}

        {/* 2. FORMULAIRE DE CANDIDATURE */}
        {stage === 'form' && (
          <div>
            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
                Étape 1 sur 2
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
                Candidature Betreuer
              </h2>
              <p className="text-xs text-[#8A8173]">
                Téléverse ton attestation officielle de niveau (Goethe, telc, ECL ou TestDaF).
              </p>
            </div>

            <form onSubmit={handleSubmitApplication} className="flex flex-col gap-3.5">
              <Input
                label="Nom et Prénom"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <Input
                label="Numéro de téléphone WhatsApp"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-[#8A8173]">Niveau de certification</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-white border border-[#E4DCCB] text-[#241F18] text-xs font-medium px-3.5 py-3 rounded-xl outline-none focus:border-[#C0512F]"
                >
                  <option value="B2">Niveau B2 (Goethe / telc)</option>
                  <option value="C1">Niveau C1 (Goethe / TestDaF / DSH)</option>
                  <option value="C2">Niveau C2 (Bilingue / Diplômé d'État)</option>
                </select>
              </div>

              {/* Upload de justificatif */}
              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-[#8A8173]">Attestation / Diplôme officiel</label>
                <div className="p-4 rounded-xl bg-white border-2 border-dashed border-[#E4DCCB] hover:border-[#C0512F] transition-colors flex flex-col items-center justify-center text-center cursor-pointer">
                  <Upload size={24} className="text-[#C0512F] mb-1.5" />
                  <span className="text-xs font-bold text-[#241F18]">{fileName}</span>
                  <span className="text-[10px] text-[#8A8173] mt-0.5">PDF ou photo scannée (max. 10 Mo)</span>
                </div>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Soumettre mon dossier
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* 3. ÉCRAN VÉRIFICATION EN COURS (Ambre neutre #A8710A selon 1.2) */}
        {stage === 'pending' && (
          <div className="text-center py-6">
            <StatusIcon type="warning" size="lg" className="mx-auto mb-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#A8710A] bg-[#FBF0DC] px-2.5 py-0.5 rounded border border-[#F0D9A8]">
              Vérification en cours
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#241F18] mt-2 mb-1">
              Dossier en cours d'examen
            </h3>
            <p className="text-xs text-[#8A8173] max-w-xs mx-auto leading-relaxed">
              Ton diplôme <strong className="text-[#241F18]">{certificateType}</strong> a bien été transmis à l'équipe pédagogique. Délai de validation habituel : 24 à 48 heures.
            </p>

            {/*
              Même catégorie de reliquat que le panneau de test de l'écran de
              paiement (audit §1.4) : ces boutons simulent la décision de
              l'administration. Ils sont désormais gardés par DEV_TOOLS_ENABLED
              et n'existent pas dans un build de production.
            */}
            {DEV_TOOLS_ENABLED && (
              <div className="mt-8">
                <DevNotice title="Simuler la réponse de l'administration">
                  <div className="flex gap-2 mt-1">
                    <button
                      type="button"
                      onClick={handleSimulateApproval}
                      className="flex-1 py-2 px-3 rounded-lg bg-white border border-[#B9E2CC] text-[#1F6B47] text-xs font-bold hover:bg-[#DDF0E6] transition-colors flex items-center justify-center gap-1"
                    >
                      <CheckCircle2 size={14} /> Valider le dossier
                    </button>
                    <button
                      type="button"
                      onClick={handleSimulateRejection}
                      className="flex-1 py-2 px-3 rounded-lg bg-white border border-[#F0BDB8] text-[#B3261E] text-xs font-bold hover:bg-[#FBE9E7] transition-colors flex items-center justify-center gap-1"
                    >
                      <XCircle size={14} /> Refuser le dossier
                    </button>
                  </div>
                </DevNotice>
              </div>
            )}
          </div>
        )}

        {/* 4. ÉCRAN DOSSIER REFUSÉ (Corrigé impérativement en ROUGE D'ERREUR #B3261E / #FBE9E7 selon 1.2 & 5.4) */}
        {stage === 'rejected' && (
          <div className="text-center py-6 animate-scale-in">
            <StatusIcon type="error" size="lg" className="mx-auto mb-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#B3261E] bg-[#FBE9E7] px-2.5 py-0.5 rounded border border-[#F0BDB8]">
              Dossier non validé
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#241F18] mt-2 mb-1">
              Document non conforme
            </h3>
            <div className="mt-3 p-3.5 rounded-xl bg-[#FBE9E7] border border-[#F0BDB8] text-xs text-[#B3261E] text-left max-w-sm mx-auto leading-relaxed">
              <strong>Motif du refus :</strong> Le certificat téléversé est flou ou ne comporte pas le numéro d'identification unique vérifiable sur la base Goethe / telc.
            </div>

            <p className="text-xs text-[#8A8173] mt-3 max-w-xs mx-auto">
              Tu peux renvoyer un scan net et officiel à tout moment pour relancer la vérification.
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setStage('form')}
              >
                Soumettre un nouveau document
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

        {/* 5. ÉCRAN DOSSIER VALIDÉ */}
        {stage === 'approved' && (
          <div className="text-center py-6 animate-scale-in">
            <StatusIcon type="success" size="lg" className="mx-auto mb-4" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F9E6E] bg-[#DDF0E6] px-2.5 py-0.5 rounded">
              Félicitations
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#241F18] mt-2 mb-1">
              Profil Betreuer validé !
            </h3>
            <p className="text-xs text-[#8A8173] max-w-xs mx-auto leading-relaxed">
              Ton statut de Betreuer certifié est activé. Il ne te reste plus qu'à configurer ton offre publique (tarifs, horaires et formats).
            </p>

            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => setStage('create_offer')}
                rightIcon={<ArrowRight size={16} />}
              >
                Créer mon offre de cours
              </Button>
            </div>
          </div>
        )}

        {/* 6. CRÉER MON OFFRE BETREUER (Correction incohérence sélecteur Présentiel/En ligne selon 5.3) */}
        {stage === 'create_offer' && (
          <div>
            <div className="mb-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F9E6E] bg-[#DDF0E6] px-2.5 py-0.5 rounded">
                Étape finale
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
                Créer mon offre Betreuer
              </h2>
              <p className="text-xs text-[#8A8173]">
                Règle tes tarifs et tes préférences de cours pour apparaître dans la Marketplace.
              </p>
            </div>

            <form onSubmit={handlePublishOffer} className="flex flex-col gap-3.5">
              <Input
                label="Tarif horaire (en FCFA)"
                type="number"
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                leftElement={<DollarSign size={16} />}
              />

              {/* Sélecteur de format sans ambiguïté (Section 5.3) */}
              <div className="flex flex-col gap-1.5 text-left">
                <label className="text-xs font-semibold text-[#8A8173]">
                  Format des séances proposées
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'les_deux', label: 'Les deux' },
                    { id: 'presentiel', label: 'Présentiel' },
                    { id: 'en_ligne', label: 'En ligne' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => setFormatOption(fmt.id as any)}
                      className={`py-2.5 px-2 text-xs font-bold rounded-xl border transition-all ${
                        formatOption === fmt.id
                          ? 'bg-[#C0512F] text-white border-[#C0512F]'
                          : 'bg-white border-[#E4DCCB] text-[#241F18]'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-[#8A8173]">Ville / Quartier principal</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-white border border-[#E4DCCB] text-[#241F18] text-xs font-medium px-3.5 py-3 rounded-xl outline-none focus:border-[#C0512F]"
                />
              </div>

              <div className="flex flex-col gap-1 text-left">
                <label className="text-xs font-semibold text-[#8A8173]">Présentation aux élèves (bio)</label>
                <textarea
                  rows={3}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-white border border-[#E4DCCB] text-[#241F18] text-xs font-medium p-3.5 rounded-xl outline-none focus:border-[#C0512F] resize-none"
                />
              </div>

              <div className="pt-3">
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  fullWidth
                  isLoading={isLoading}
                >
                  Publier mon offre dans la Marketplace
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
