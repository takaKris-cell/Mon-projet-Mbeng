import React from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { GraduationCap, Briefcase, BookOpen, ChevronRight, ArrowRight, Shield } from 'lucide-react';

interface PostB2ViewProps {
  onBack: () => void;
  onOpenEmbassyGuide: () => void;
  onOpenCustomContact: () => void;
}

export const PostB2View: React.FC<PostB2ViewProps> = ({
  onBack,
  onOpenEmbassyGuide,
  onOpenCustomContact,
}) => {
  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        <div className="mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
            PERSPECTIVES POST-B2
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
            Après le B2
          </h2>
          <p className="text-xs text-[#8A8173]">
            Les 3 grands parcours possibles une fois ton certificat B2 en poche.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {/* Ausbildung */}
          <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-serif font-bold text-sm text-[#241F18]">1. Ausbildung (Apprentissage)</span>
              <span className="text-[10px] font-bold bg-[#DDF0E6] text-[#2F9E6E] px-2 py-0.5 rounded">Rémunéré</span>
            </div>
            <p className="text-xs text-[#8A8173] leading-relaxed">
              Formation en alternance en clinique ou entreprise (soins, électricité, informatique, hôtellerie). Aucun compte bloqué exigé car salaire mensuel dès le premier jour.
            </p>
          </div>

          {/* Studium */}
          <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-serif font-bold text-sm text-[#241F18]">2. Studium (Université allemande)</span>
              <span className="text-[10px] font-bold bg-[#FBF0DC] text-[#A8710A] px-2 py-0.5 rounded">Compte bloqué</span>
            </div>
            <p className="text-xs text-[#8A8173] leading-relaxed">
              Licence (Bachelor) ou Master dans les universités publiques allemandes (frais quasi-nuls). Nécessite le compte bloqué d'environ 11 208 € ou une prise en charge (Verpflichtungserklärung).
            </p>
          </div>

          {/* Duales Studium */}
          <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-serif font-bold text-sm text-[#241F18]">3. Duales Studium</span>
              <span className="text-[10px] font-bold bg-[#FBEDE6] text-[#C0512F] px-2 py-0.5 rounded">Mixte diplôme</span>
            </div>
            <p className="text-xs text-[#8A8173] leading-relaxed">
              Diplôme d'ingénieur ou de management allié à un contrat d'entreprise. Très sélectif, requiert une excellente maîtrise orale.
            </p>
          </div>

          {/* Carte Coaching d'introduction */}
          <div className="p-4 rounded-xl bg-[#241F18] text-white border border-[#3A3226]">
            <h4 className="text-xs font-bold text-[#FAF7F2]">Séance de coaching d'introduction</h4>
            <p className="text-[11px] text-[#8A8173] mt-0.5 mb-3">
              Fais valider ton projet d'orientation par nos experts camerounais basés en Allemagne.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenCustomContact}
            >
              Réserver un créneau (Gratuit)
            </Button>
          </div>

          {/* Lien Guide Ambassade */}
          <div
            onClick={onOpenEmbassyGuide}
            className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] cursor-pointer transition-all flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <Shield size={18} className="text-[#C0512F]" />
              <span className="text-xs font-bold text-[#241F18]">Tout savoir sur mon passage à l'ambassade</span>
            </div>
            <ChevronRight size={16} className="text-[#8A8173]" />
          </div>
        </div>
      </div>
    </div>
  );
};
