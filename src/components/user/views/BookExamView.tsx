import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { Calendar, CheckCircle2, ShieldCheck, MapPin, ChevronRight } from 'lucide-react';

interface BookExamViewProps {
  onBack: () => void;
  onProceedToPayment: (examInfo: { name: string; date: string; fee: number }) => void;
}

export const BookExamView: React.FC<BookExamViewProps> = ({ onBack, onProceedToPayment }) => {
  const [selectedExam, setSelectedExam] = useState<'ECL' | 'telc' | 'Goethe' | 'ÖSD'>('Goethe');
  const [selectedCity, setSelectedCity] = useState<'Yaoundé' | 'Douala'>('Yaoundé');
  const [selectedDate, setSelectedDate] = useState('28 Octobre 2026');

  const examFees = {
    Goethe: 120000,
    telc: 110000,
    ECL: 95000,
    ÖSD: 105000,
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        {/* Hero Sombre */}
        <div className="p-5 rounded-2xl bg-[#241F18] text-white mb-5 border border-[#3A3226]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#C0512F]/15 px-2 py-0.5 rounded">
            CENTRES OFFICIELS CAMEROUN
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#FAF7F2] mt-2 mb-1">
            Se réserver pour un examen
          </h2>
          <p className="text-xs text-[#E4DCCB]/85 leading-relaxed">
            Évite la rupture des places. Mbeng réserve et sécurise ta place d'examen officielle B1/B2.
          </p>

          <div className="mt-4 p-3 rounded-xl bg-white/10 text-xs text-[#FAF7F2] flex items-center gap-2">
            <span className="font-serif font-bold text-[#2F9E6E] text-base">+70%</span>
            <span>de chances d'obtenir sa place lors de l'ouverture des créneaux</span>
          </div>
        </div>

        {/* Choix de l'examen */}
        <div className="mb-4">
          <label className="text-xs font-semibold text-[#8A8173] block mb-2">
            Choisis ton examen cible
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(['Goethe', 'telc', 'ECL', 'ÖSD'] as const).map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setSelectedExam(ex)}
                className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedExam === ex
                    ? 'bg-[#C0512F] text-white border-[#C0512F] shadow-sm'
                    : 'bg-white border-[#E4DCCB] text-[#241F18] hover:border-[#8A8173]'
                }`}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>

        {/* Ville & Date */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          <div>
            <label className="text-xs font-semibold text-[#8A8173] block mb-1">Centre d'examen</label>
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value as any)}
              className="w-full bg-white border border-[#E4DCCB] text-xs font-semibold p-2.5 rounded-xl outline-none"
            >
              <option value="Yaoundé">Yaoundé (Bastos)</option>
              <option value="Douala">Douala (Akwa)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#8A8173] block mb-1">Session souhaitée</label>
            <select
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-white border border-[#E4DCCB] text-xs font-semibold p-2.5 rounded-xl outline-none"
            >
              <option value="28 Octobre 2026">28 Oct. 2026</option>
              <option value="15 Novembre 2026">15 Nov. 2026</option>
              <option value="05 Décembre 2026">05 Déc. 2026</option>
            </select>
          </div>
        </div>

        {/* Résumé frais */}
        <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] mb-4">
          <div className="flex items-center justify-between text-xs text-[#8A8173] pb-2 border-b border-[#EFE9DC]">
            <span>Frais d'inscription officiel du centre</span>
            <span className="font-semibold text-[#241F18]">{examFees[selectedExam].toLocaleString()} FCFA</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#8A8173] py-2 border-b border-[#EFE9DC]">
            <span>Assistance réservation Mbeng & Rappels</span>
            <span className="text-[#2F9E6E] font-bold">Inclus (0 F)</span>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span className="font-bold text-xs text-[#241F18]">Total à régler</span>
            <span className="font-serif font-extrabold text-lg text-[#C0512F]">
              {examFees[selectedExam].toLocaleString()} FCFA
            </span>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => onProceedToPayment({
            name: `Examen ${selectedExam} B1 (${selectedCity})`,
            date: selectedDate,
            fee: examFees[selectedExam]
          })}
        >
          Procéder au paiement ({examFees[selectedExam].toLocaleString()} F)
        </Button>
      </div>
    </div>
  );
};
