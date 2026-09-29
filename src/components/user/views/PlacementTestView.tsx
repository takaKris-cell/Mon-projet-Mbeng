import React, { useState } from 'react';
import { Button } from '../../ui/Button';
import { BackButton } from '../../ui/BackButton';
import { Award, CheckCircle2, ChevronRight, HelpCircle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PlacementTestViewProps {
  onLevelSelected: (level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1') => void;
  onBack: () => void;
}

export const PlacementTestView: React.FC<PlacementTestViewProps> = ({ onLevelSelected, onBack }) => {
  const [currentStep, setCurrentStep] = useState<'choose_mode' | 'quiz' | 'result'>('choose_mode');
  const [selectedLevelDirect, setSelectedLevelDirect] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1'>('B1');
  const [quizScore, setQuizScore] = useState(0);
  const [quizQuestionIndex, setQuizQuestionIndex] = useState(0);

  const questions = [
    {
      q: 'Complète la phrase : "Ich freue mich schon sehr _____ die Reise nach Deutschland."',
      options: ['auf', 'über', 'an', 'für'],
      answer: 0,
      level: 'B1'
    },
    {
      q: 'Quel verbe convient au contexte médical : "Die Krankenschwester _____ den Blutdruck des Patienten."',
      options: ['misst', 'macht', 'sieht', 'fühlt'],
      answer: 0,
      level: 'B2'
    },
    {
      q: 'Quelle est la forme correcte au passé composé : "Gestern _____ ich nach Yaoundé gefahren."',
      options: ['bin', 'habe', 'war', 'hatte'],
      answer: 0,
      level: 'A2'
    }
  ];

  const handleAnswer = (optionIdx: number) => {
    let nextScore = quizScore;
    if (optionIdx === questions[quizQuestionIndex].answer) {
      nextScore += 1;
      setQuizScore(nextScore);
    }

    if (quizQuestionIndex + 1 < questions.length) {
      setQuizQuestionIndex(quizQuestionIndex + 1);
    } else {
      // Fin du test
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
      setCurrentStep('result');
    }
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-6 bg-[#FAF7F2] animate-fade-in">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} />
        </div>

        {currentStep === 'choose_mode' && (
          <div>
            <div className="text-left mb-6">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-1 rounded-md">
                Positionnement linguistique
              </span>
              <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-2">
                Quel est ton niveau ?
              </h2>
              <p className="text-xs text-[#8A8173] mt-1 leading-relaxed">
                Choisis directement ton niveau actuel ou fais un mini-test de 3 minutes pour évaluer ton niveau de départ.
              </p>
            </div>

            {/* Option 1 : Test rapide */}
            <div 
              onClick={() => setCurrentStep('quiz')}
              className="p-4 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all cursor-pointer mb-4 text-left group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#FBEDE6] text-[#C0512F] flex items-center justify-center">
                    <HelpCircle size={18} />
                  </div>
                  <h4 className="text-sm font-bold text-[#241F18] group-hover:text-[#C0512F] transition-colors">
                    Faire le test de positionnement
                  </h4>
                </div>
                <ChevronRight size={18} className="text-[#8A8173] group-hover:text-[#C0512F] group-hover:translate-x-1 transition-all" />
              </div>
              <p className="text-xs text-[#8A8173]">
                3 questions représentatives des épreuves Goethe / telc pour situer ton vocabulaire et ta grammaire.
              </p>
            </div>

            {/* Option 2 : Sélection directe */}
            <div className="text-left mt-6">
              <h4 className="text-xs font-bold text-[#8A8173] uppercase tracking-wider mb-3">
                Ou choisis ton niveau directement
              </h4>

              <div className="grid grid-cols-2 gap-2.5">
                {(['A1', 'A2', 'B1', 'B2'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSelectedLevelDirect(lvl)}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                      selectedLevelDirect === lvl
                        ? 'bg-[#FBEDE6] border-[#C0512F] text-[#241F18]'
                        : 'bg-white border-[#E4DCCB] hover:border-[#8A8173] text-[#241F18]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-serif font-bold text-lg">{lvl}</span>
                      {selectedLevelDirect === lvl && (
                        <CheckCircle2 size={16} className="text-[#C0512F]" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#8A8173] mt-1">
                      {lvl === 'A1' && 'Débutant complet'}
                      {lvl === 'A2' && 'Bases acquises'}
                      {lvl === 'B1' && 'Autonome (Goethe)'}
                      {lvl === 'B2' && 'Avancé (Pflege & Visa)'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => onLevelSelected(selectedLevelDirect)}
              >
                Continuer avec le niveau {selectedLevelDirect}
              </Button>
            </div>
          </div>
        )}

        {currentStep === 'quiz' && (
          <div className="text-left">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-[#8A8173]">
                Question {quizQuestionIndex + 1} sur {questions.length}
              </span>
              <span className="text-[11px] bg-[#DDF0E6] text-[#2F9E6E] font-bold px-2 py-0.5 rounded-full">
                Niveau ciblé : {questions[quizQuestionIndex].level}
              </span>
            </div>

            <div className="w-full bg-[#E4DCCB] h-1.5 rounded-full mb-6 overflow-hidden">
              <div 
                className="bg-[#C0512F] h-full transition-all duration-300"
                style={{ width: `${((quizQuestionIndex + 1) / questions.length) * 100}%` }}
              />
            </div>

            <h3 className="font-serif font-bold text-lg text-[#241F18] mb-6 leading-snug">
              {questions[quizQuestionIndex].q}
            </h3>

            <div className="flex flex-col gap-2.5">
              {questions[quizQuestionIndex].options.map((opt, oIdx) => (
                <button
                  key={oIdx}
                  type="button"
                  onClick={() => handleAnswer(oIdx)}
                  className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] hover:bg-[#FBEDE6]/20 text-left font-medium text-sm text-[#241F18] transition-all flex items-center justify-between group"
                >
                  <span>{opt}</span>
                  <div className="w-5 h-5 rounded-full border border-[#E4DCCB] group-hover:border-[#C0512F] flex items-center justify-center text-[10px] text-[#8A8173]">
                    {String.fromCharCode(65 + oIdx)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {currentStep === 'result' && (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#DDF0E6] text-[#2F9E6E] flex items-center justify-center mx-auto mb-4">
              <Award size={32} />
            </div>

            <h3 className="font-serif font-bold text-2xl text-[#241F18]">
              Niveau évalué : B1
            </h3>
            <p className="text-xs text-[#8A8173] mt-2 max-w-xs mx-auto">
              Score : {quizScore}/{questions.length} bonnes réponses. Ton profil est automatiquement configuré pour le niveau B1 Goethe & la préparation au départ.
            </p>

            <div className="mt-8">
              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => onLevelSelected('B1')}
              >
                Accéder à mon espace d'apprentissage
              </Button>
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 text-center">
        <p className="text-[11px] text-[#8A8173]">
          Tu pourras modifier ton niveau à tout moment dans ton compte.
        </p>
      </div>
    </div>
  );
};
