import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { sampleWordsOfDay } from '../../../data/content';
import { Volume2, CheckCircle, Sparkles, BookOpen, Flame } from 'lucide-react';
import confetti from 'canvas-confetti';

interface WordsOfDayViewProps {
  onBack: () => void;
  onFinish: () => void;
}

export const WordsOfDayView: React.FC<WordsOfDayViewProps> = ({ onBack, onFinish }) => {
  const [learnedWords, setLearnedWords] = useState<number[]>([]);
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  const toggleLearned = (idx: number) => {
    if (learnedWords.includes(idx)) {
      setLearnedWords(learnedWords.filter((i) => i !== idx));
    } else {
      setLearnedWords([...learnedWords, idx]);
    }
  };

  const handleSpeak = (word: string) => {
    setSpeakingWord(word);
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => setSpeakingWord(null), 1200);
  };

  const handleComplete = () => {
    confetti({
      particleCount: 70,
      spread: 70,
      origin: { y: 0.6 }
    });
    onFinish();
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={onBack} title="Accueil" />
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FBEDE6] border border-[#C0512F]/20 text-[#C0512F] text-xs font-bold">
            <Flame size={14} className="fill-[#C0512F]" />
            <span>Série de 5 jours</span>
          </div>
        </div>

        <div className="mb-5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
            Niveau B1 • Rituel quotidien
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
            Tes 10 mots du jour
          </h2>
          <p className="text-xs text-[#8A8173]">
            {learnedWords.length} sur {sampleWordsOfDay.length} mots mémorisés aujourd'hui.
          </p>
        </div>

        {/* Liste des cartes de mots */}
        <div className="flex flex-col gap-2.5">
          {sampleWordsOfDay.map((item, idx) => {
            const isLearned = learnedWords.includes(idx);
            return (
              <div
                key={idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  isLearned 
                    ? 'bg-[#F0F9F4] border-[#B9E2CC]' 
                    : 'bg-white border-[#E4DCCB] hover:border-[#8A8173]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-serif font-bold text-base text-[#241F18]">
                        {item.word}
                      </h4>
                      <span className="text-[10px] bg-[#F1E7DA] text-[#8A8173] font-semibold px-2 py-0.2 rounded">
                        {item.type}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-[#C0512F] mt-0.5">
                      {item.meaning}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSpeak(item.word)}
                      className={`p-2 rounded-lg transition-colors ${
                        speakingWord === item.word 
                          ? 'bg-[#C0512F] text-white' 
                          : 'bg-[#FAF7F2] text-[#8A8173] hover:text-[#241F18]'
                      }`}
                      title="Écouter la prononciation"
                    >
                      <Volume2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLearned(idx)}
                      className={`p-2 rounded-lg transition-colors ${
                        isLearned 
                          ? 'bg-[#2F9E6E] text-white' 
                          : 'bg-[#FAF7F2] text-[#8A8173] hover:text-[#2F9E6E]'
                      }`}
                      title={isLearned ? "Mot validé" : "Marquer comme appris"}
                    >
                      <CheckCircle size={16} />
                    </button>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-[#EFE9DC] text-[11.5px] text-[#3A3226] italic">
                  « {item.example} »
                </div>
              </div>
            );
          })}
        </div>

        {/* Carte Règle du jour (Fond noir d'encre #241F18 conforme à la maquette) */}
        <div className="mt-4 p-4 rounded-xl bg-[#241F18] text-[#FAF7F2] border border-[#3A3226]">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#C0512F]" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8A8173]">
              RÈGLE DU JOUR
            </span>
          </div>
          <h4 className="font-serif font-bold text-sm text-[#FAF7F2] mb-1">
            Le prétérit des verbes faibles
          </h4>
          <p className="text-xs text-[#E4DCCB]/90 leading-relaxed">
            Radical + <strong>-te</strong> (ich machte), <strong>-test</strong> (du machtest), <strong>-te</strong> (er machte), <strong>-ten</strong> (wir machten).
          </p>
        </div>
      </div>

      <div className="pt-6">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={handleComplete}
          leftIcon={<Sparkles size={18} />}
        >
          J'ai terminé pour aujourd'hui
        </Button>
      </div>
    </div>
  );
};
