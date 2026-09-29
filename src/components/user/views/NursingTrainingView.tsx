import React from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { HeartHandshake, BookOpen, Clock, Activity, ArrowRight, ShieldCheck } from 'lucide-react';

interface NursingTrainingViewProps {
  onBack: () => void;
  onOpenVocab: () => void;
  onGoPremium: () => void;
}

export const NursingTrainingView: React.FC<NursingTrainingViewProps> = ({
  onBack,
  onOpenVocab,
  onGoPremium,
}) => {
  const years = [
    { year: 'Année 1', focus: 'Fondamentaux des soins et de la santé', hours: '2 100 h pratique • 1 400 h cours', allowance: '1 190 € / mois' },
    { year: 'Année 2', focus: 'Soins aigus hospitaliers & pédiatrie', hours: 'Services de chirurgie et urgences', allowance: '1 250 € / mois' },
    { year: 'Année 3', focus: 'Soins palliatifs, psychiatrie & examen d\'État', hours: 'Préparation du Staatsexamen', allowance: '1 350 € / mois' },
  ];

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        {/* Hero Card */}
        <div className="p-5 rounded-2xl bg-[#241F18] text-white mb-5 border border-[#3A3226]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#2F9E6E] bg-[#2F9E6E]/15 px-2 py-0.5 rounded">
            FORMATION PROFESSIONNELLE D'ÉTAT
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#FAF7F2] mt-2 mb-1">
            Devenir soignant-e en Allemagne
          </h2>
          <p className="text-xs text-[#E4DCCB]/85 leading-relaxed">
            La Pflegeausbildung dure 3 ans en alternance : rémunérée dès le 1er jour, débouchant sur un emploi garanti à 100% avec salaire de 2 800 à 3 600 € brut.
          </p>
        </div>

        {/* Bouton Vocabulaire du soin hospitalier */}
        <div
          onClick={onOpenVocab}
          className="p-4 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] cursor-pointer transition-all flex items-center justify-between mb-4 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#FBEDE6] text-[#C0512F] flex items-center justify-center shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241F18] group-hover:text-[#C0512F] transition-colors">
                Vocabulaire médical du soin (Fachwörter)
              </h4>
              <p className="text-[11px] text-[#8A8173]">
                Les termes indispensables en service hospitalier
              </p>
            </div>
          </div>
          <ArrowRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F] group-hover:translate-x-0.5 transition-all" />
        </div>

        {/* Détail des 3 ans de formation */}
        <div className="mb-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8A8173] mb-2.5">
            Structure des 3 années d'études
          </h3>

          <div className="flex flex-col gap-2.5">
            {years.map((y, i) => (
              <div key={i} className="p-3.5 rounded-xl bg-white border border-[#E4DCCB]">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-sm text-[#241F18]">{y.year}</span>
                  <span className="text-xs font-bold text-[#1F6B47] bg-[#DDF0E6] px-2 py-0.5 rounded">
                    {y.allowance}
                  </span>
                </div>
                <p className="text-xs font-medium text-[#C0512F] mt-1">{y.focus}</p>
                <p className="text-[11px] text-[#8A8173] mt-0.5">{y.hours}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onGoPremium}
        >
          Télécharger le programme détaillé des cours
        </Button>
      </div>
    </div>
  );
};
