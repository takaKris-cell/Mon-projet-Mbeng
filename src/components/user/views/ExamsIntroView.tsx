import React from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { CheckCircle2, ShieldCheck, Timer, Award, ChevronRight, AlertCircle } from 'lucide-react';

interface ExamsIntroViewProps {
  onBack: () => void;
  onStartSimulation: () => void;
  onGoPremium: () => void;
  isPremium: boolean;
}

export const ExamsIntroView: React.FC<ExamsIntroViewProps> = ({
  onBack,
  onStartSimulation,
  onGoPremium,
  isPremium,
}) => {
  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        {/* Hero Card Sombre #241F18 conforme aux maquettes */}
        <div className="p-5 rounded-2xl bg-[#241F18] text-[#FAF7F2] mb-5 border border-[#3A3226]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#C0512F]/15 px-2 py-0.5 rounded">
            SIMULATEUR OFFICIEL
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#FAF7F2] mt-2 mb-1">
            Sais-tu vraiment où tu en es ?
          </h2>
          <p className="text-xs text-[#E4DCCB]/85 leading-relaxed">
            Passe un examen blanc calibré exactement sur les critères d'évaluation officiels du Goethe-Institut et de telc.
          </p>

          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
            <div>
              <div className="font-serif font-extrabold text-2xl text-[#2F9E6E]">92%</div>
              <p className="text-[10px] text-[#8A8173]">Taux de réussite de nos élèves formés</p>
            </div>
            <div className="text-right">
              <div className="font-serif font-extrabold text-2xl text-[#FAF7F2]">4 Modules</div>
              <p className="text-[10px] text-[#8A8173]">Lesen, Hören, Schreiben, Sprechen</p>
            </div>
          </div>
        </div>

        {/* 4 Piliers d'examen */}
        <div className="flex flex-col gap-2.5">
          <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#DDF0E6] text-[#2F9E6E] flex items-center justify-center shrink-0">
              <Timer size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241F18]">Conditions réelles de chronométrage</h4>
              <p className="text-[11px] text-[#8A8173]">65 min pour Lesen, 40 min pour Hören</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FBEDE6] text-[#C0512F] flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241F18]">Correction détaillée expliquée</h4>
              <p className="text-[11px] text-[#8A8173]">Comprends chaque piège et chaque point de grammaire</p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FBF0DC] text-[#A8710A] flex items-center justify-center shrink-0">
              <Award size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#241F18]">Suivi de ta note globale / 100</h4>
              <p className="text-[11px] text-[#8A8173]">Sache si tu obtiendrais ton certificat dès maintenant</p>
            </div>
          </div>
        </div>

        {!isPremium && (
          <div className="mt-4 p-3.5 rounded-xl bg-[#F0F9F4] border border-[#B9E2CC] flex items-center justify-between text-left">
            <div>
              <span className="text-[10px] font-bold text-[#1F6B47] uppercase tracking-wider block">
                Offre Découverte
              </span>
              <p className="text-xs font-medium text-[#1F6B47]">
                Le premier test blanc Modelltest 1 est offert pour ton niveau B1.
              </p>
            </div>
            <button
              onClick={onGoPremium}
              className="text-xs font-bold text-[#C0512F] hover:underline whitespace-nowrap pl-2"
            >
              Débloquer tout
            </button>
          </div>
        )}
      </div>

      <div className="pt-6">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onStartSimulation}
        >
          Commencer mon examen blanc
        </Button>
      </div>
    </div>
  );
};
