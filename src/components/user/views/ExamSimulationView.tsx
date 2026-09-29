import React, { useState, useEffect } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { Timer, CheckCircle, XCircle, AlertCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ExamSimulationViewProps {
  onBack: () => void;
  onGoPremium: () => void;
}

export const ExamSimulationView: React.FC<ExamSimulationViewProps> = ({ onBack, onGoPremium }) => {
  const [timeLeft, setTimeLeft] = useState(3840); // 64 minutes en secondes
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!isFinished && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [timeLeft, isFinished]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const examData = [
    {
      module: 'Teil 1 — Lesen',
      text: 'Sie lesen in einer deutschen Tageszeitung einen Artikel über Fachkräfteeinwanderung. Das Gesetz zur Modernisierung der Fachkräfteeinwanderung erleichtert es ausländischen Pflegekräften, ihren Beruf in Deutschland auszuüben.',
      question: 'Was ist das Hauptziel des Gesetzes zur Fachkräfteeinwanderung?',
      options: [
        'Die Arbeitszeiten in deutschen Kliniken zu verkürzen.',
        'Den Zuzug von qualifizierten Arbeitskräften wie Pflegekräften zu erleichtern.',
        'Sprachprüfungen für ausländische Bewerber komplett abzuschaffen.'
      ],
      correct: 1,
      explanation: 'Le texte précise expressément que la loi "erleichtert es ausländischen Pflegekräften", ce qui signifie qu\'elle facilite l\'arrivée et l\'exercice des soignants qualifiés.'
    },
    {
      module: 'Teil 2 — Lesen',
      text: 'Anzeige: Seniorenresidenz Sonnenschein in Köln sucht ab sofort Auszubildende zur Pflegefachkraft (m/w/d). Voraussetzungen: B2-Niveau, Zuverlässigkeit und Freude an der Arbeit mit älteren Menschen.',
      question: 'Welches Sprachniveau wird für die Ausbildung verlangt?',
      options: [
        'A2 Goethe-Zertifikat reicht aus.',
        'Ein nachgewiesenes B2-Niveau ist zwingend erforderlich.',
        'Kein Zertifikat, wenn man fließend Englisch spricht.'
      ],
      correct: 1,
      explanation: 'L\'annonce stipule clairement "Voraussetzungen: B2-Niveau".'
    }
  ];

  const handleSelect = (optionIdx: number) => {
    setSelectedAnswers((prev) => ({ ...prev, [currentQuestion]: optionIdx }));
  };

  const handleFinish = () => {
    setIsFinished(true);
    confetti({
      particleCount: 60,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const calculateScore = () => {
    let score = 0;
    examData.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correct) score += 50;
    });
    return score;
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={onBack} title="Quitter" />
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#241F18] text-white text-xs font-mono font-bold">
            <Timer size={14} className="text-[#C0512F]" />
            <span>{formatTime(timeLeft)}</span>
          </div>
        </div>

        {!isFinished ? (
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-[#C0512F] uppercase tracking-wider">
                {examData[currentQuestion].module}
              </span>
              <span className="text-xs text-[#8A8173] font-semibold">
                Question {currentQuestion + 1} / {examData.length}
              </span>
            </div>

            {/* Texte de lecture */}
            <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] mb-4 text-xs text-[#3A3226] leading-relaxed shadow-sm font-sans">
              <p className="font-semibold text-[#8A8173] text-[10px] uppercase tracking-wider mb-1">Texte officiel</p>
              {examData[currentQuestion].text}
            </div>

            {/* Question */}
            <h3 className="font-serif font-bold text-sm text-[#241F18] mb-3">
              {examData[currentQuestion].question}
            </h3>

            {/* Options */}
            <div className="flex flex-col gap-2.5">
              {examData[currentQuestion].options.map((option, idx) => {
                const isSelected = selectedAnswers[currentQuestion] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(idx)}
                    className={`p-3 rounded-xl border text-left text-xs transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-[#FBEDE6] border-[#C0512F] text-[#241F18] font-semibold shadow-focus-accent'
                        : 'bg-white border-[#E4DCCB] hover:border-[#8A8173] text-[#241F18]'
                    }`}
                  >
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold mt-0.5 ${
                      isSelected ? 'bg-[#C0512F] text-white' : 'bg-[#FAF7F2] border border-[#E4DCCB] text-[#8A8173]'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Écran de résultat */
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-[#DDF0E6] text-[#2F9E6E] flex items-center justify-center mx-auto mb-3">
              <CheckCircle size={32} />
            </div>

            <span className="text-[11px] font-bold uppercase tracking-wider text-[#2F9E6E] bg-[#DDF0E6] px-2.5 py-0.5 rounded">
              Examen Blanc Terminé
            </span>
            <h3 className="font-serif font-bold text-2xl text-[#241F18] mt-2">
              Note : {calculateScore()} / 100 points
            </h3>
            <p className="text-xs text-[#8A8173] mt-1 max-w-xs mx-auto">
              Félicitations ! Avec ce score sur la partie compréhension écrite, tu es largement au-dessus du seuil de validation Goethe (60/100).
            </p>

            {/* Détail des corrections */}
            <div className="mt-5 flex flex-col gap-2.5 text-left">
              {examData.map((q, idx) => {
                const userChoice = selectedAnswers[idx];
                const isCorrect = userChoice === q.correct;
                return (
                  <div key={idx} className="p-3 rounded-xl bg-white border border-[#E4DCCB]">
                    <div className="flex items-center gap-1.5 mb-1">
                      {isCorrect ? (
                        <CheckCircle size={14} className="text-[#2F9E6E]" />
                      ) : (
                        <XCircle size={14} className="text-[#B3261E]" />
                      )}
                      <span className="text-xs font-bold text-[#241F18]">
                        Question {idx + 1} : {isCorrect ? 'Correcte (+50 pts)' : 'Erreur'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8A8173] leading-snug">
                      {q.explanation}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="pt-6">
        {!isFinished ? (
          currentQuestion < examData.length - 1 ? (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={selectedAnswers[currentQuestion] === undefined}
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              rightIcon={<ArrowRight size={16} />}
            >
              Question suivante
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              fullWidth
              disabled={selectedAnswers[currentQuestion] === undefined}
              onClick={handleFinish}
            >
              Valider et voir ma note
            </Button>
          )
        ) : (
          <div className="flex flex-col gap-2">
            <Button variant="primary" size="lg" fullWidth onClick={onGoPremium}>
              Accéder aux 12 autres Modelltests (Premium)
            </Button>
            <Button variant="secondary" size="md" fullWidth onClick={onBack}>
              Retour à l'accueil
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
