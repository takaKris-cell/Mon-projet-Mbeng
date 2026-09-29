import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Volume2, CheckCircle2 } from 'lucide-react';

interface NursingVocabViewProps {
  onBack: () => void;
}

export const NursingVocabView: React.FC<NursingVocabViewProps> = ({ onBack }) => {
  const [speakingWord, setSpeakingWord] = useState<string | null>(null);

  const vocab = [
    { de: 'der Blutdruck', type: 'Nom masc.', fr: 'la tension artérielle', ex: 'Den Blutdruck regelmäßig messen.' },
    { de: 'die Wunde', type: 'Nom fém.', fr: 'la plaie, la blessure', ex: 'Die Wunde muss täglich desinfiziert werden.' },
    { de: 'die Übergabe', type: 'Nom fém.', fr: 'la transmission / relève de garde', ex: 'Die Übergabe beginnt um 14:00 Uhr.' },
    { de: 'lagern', type: 'Verbe', fr: 'positionner le patient (au lit)', ex: 'Wir müssen den Patienten seitlich lagern.' },
    { de: 'der Verband', type: 'Nom masc.', fr: 'le pansement', ex: 'Bitte wechseln Sie den Verband.' },
    { de: 'die Vitalzeichen', type: 'Nom pluriel', fr: 'les signes vitaux (pouls, tension)', ex: 'Die Vitalzeichen sind stabil.' },
    { de: 'die Spritze', type: 'Nom fém.', fr: 'la piqûre / seringue', ex: 'Eine subkutane Spritze verabreichen.' },
  ];

  const handleSpeak = (word: string) => {
    setSpeakingWord(word);
    if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(word);
      u.lang = 'de-DE';
      window.speechSynthesis.speak(u);
    }
    setTimeout(() => setSpeakingWord(null), 1000);
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Formation Pflege" />
        </div>

        <div className="mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1F6B47] bg-[#DDF0E6] px-2.5 py-0.5 rounded">
            LEXIQUE MÉDICAL ALLEMAND
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
            Vocabulaire du soin
          </h2>
          <p className="text-xs text-[#8A8173]">
            Écoute la prononciation exacte et apprends les tournures utilisées dans les hôpitaux allemands.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {vocab.map((item, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-base text-[#241F18]">{item.de}</span>
                    <span className="text-[10px] bg-[#FAF7F2] text-[#8A8173] font-semibold px-1.5 py-0.2 rounded border border-[#E4DCCB]">
                      {item.type}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-[#C0512F] mt-0.5">{item.fr}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleSpeak(item.de)}
                  className={`p-2 rounded-lg transition-colors ${
                    speakingWord === item.de ? 'bg-[#C0512F] text-white' : 'bg-[#FAF7F2] text-[#8A8173] hover:text-[#241F18]'
                  }`}
                  title="Écouter la prononciation"
                >
                  <Volume2 size={16} />
                </button>
              </div>

              <p className="text-[11.5px] text-[#3A3226] italic mt-2 pt-2 border-t border-[#EFE9DC]">
                « {item.ex} »
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
