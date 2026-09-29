import React, { useState, useEffect } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Play, Pause, RotateCcw, RotateCw, Volume2, Sparkles } from 'lucide-react';
import { sampleAudios } from '../../../data/content';

interface AudioPlayerViewProps {
  onBack: () => void;
}

export const AudioPlayerView: React.FC<AudioPlayerViewProps> = ({ onBack }) => {
  const audio = sampleAudios[0];
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<'0.8x' | '1.0x' | '1.2x'>('1.0x');
  const [progress, setProgress] = useState(audio.currentProgress);
  const [currentLineIndex, setCurrentLineIndex] = useState(1);

  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            setIsPlaying(false);
            return 0;
          }
          return p + 1;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleSpeed = () => {
    if (playbackSpeed === '0.8x') setPlaybackSpeed('1.0x');
    else if (playbackSpeed === '1.0x') setPlaybackSpeed('1.2x');
    else setPlaybackSpeed('0.8x');
  };

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={onBack} title="Accueil" />
          <span className="text-[11px] font-bold text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
            PODCAST ALLEMAND
          </span>
        </div>

        {/* Jaquette Podcast Sombre #241F18 conforme aux maquettes */}
        <div className="p-6 rounded-2xl bg-[#241F18] text-white flex flex-col items-center text-center border border-[#3A3226] mb-5 relative overflow-hidden shadow-elevation">
          {/* Onde sonore animée si en lecture */}
          {isPlaying && (
            <div className="flex items-center gap-1.5 absolute top-4 right-4">
              <span className="w-1 bg-[#C0512F] rounded-full sound-bar-1" />
              <span className="w-1 bg-[#C0512F] rounded-full sound-bar-2" />
              <span className="w-1 bg-[#C0512F] rounded-full sound-bar-3" />
              <span className="w-1 bg-[#C0512F] rounded-full sound-bar-4" />
            </div>
          )}

          <div className="w-32 h-32 rounded-2xl bg-gradient-to-tr from-[#C0512F] to-[#E2704E] flex items-center justify-center p-3 mb-4 shadow-md">
            <Volume2 size={48} className="text-white opacity-90" />
          </div>

          <h2 className="font-serif font-bold text-xl text-[#FAF7F2]">
            {audio.title}
          </h2>
          <p className="text-xs text-[#8A8173] mt-1">
            {audio.subtitle}
          </p>

          {/* Barre de progression */}
          <div className="w-full mt-6">
            <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
              <div 
                className="bg-[#C0512F] h-full rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#8A8173] mt-1.5">
              <span>{Math.floor((progress / 100) * 5)}:{String(Math.floor(((progress / 100) * 342) % 60)).padStart(2, '0')}</span>
              <span>{audio.duration}</span>
            </div>
          </div>

          {/* Boutons de contrôle audio */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <button
              onClick={toggleSpeed}
              className="text-xs font-bold font-mono text-[#8A8173] hover:text-white transition-colors"
            >
              {playbackSpeed}
            </button>

            <button
              onClick={() => setProgress(Math.max(0, progress - 10))}
              className="text-[#FAF7F2] hover:text-[#C0512F] transition-colors p-2"
              title="-10 secondes"
            >
              <RotateCcw size={20} />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-12 h-12 rounded-full bg-[#C0512F] text-white flex items-center justify-center hover:bg-[#A8452A] transition-all shadow-md active:scale-95"
            >
              {isPlaying ? <Pause size={22} /> : <Play size={22} className="ml-0.5" />}
            </button>

            <button
              onClick={() => setProgress(Math.min(100, progress + 10))}
              className="text-[#FAF7F2] hover:text-[#C0512F] transition-colors p-2"
              title="+10 secondes"
            >
              <RotateCw size={20} />
            </button>
          </div>
        </div>

        {/* Transcription synchronisée Allemand / Français */}
        <div className="p-4 rounded-xl bg-white border border-[#E4DCCB]">
          <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#EFE9DC]">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A8173]">
              Transcription synchronisée
            </span>
            <span className="text-[10px] text-[#C0512F] font-semibold flex items-center gap-1">
              <Sparkles size={12} /> Bilingue DE/FR
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {audio.germanTranscript.map((deLine, idx) => (
              <div 
                key={idx}
                onClick={() => setCurrentLineIndex(idx)}
                className={`p-2.5 rounded-lg transition-all cursor-pointer ${
                  currentLineIndex === idx 
                    ? 'bg-[#FBEDE6] border-l-4 border-[#C0512F]' 
                    : 'hover:bg-[#FAF7F2]'
                }`}
              >
                <p className="font-medium text-xs text-[#241F18]">
                  {deLine}
                </p>
                <p className="text-[11px] text-[#8A8173] mt-0.5">
                  {audio.frenchTranslation[idx]}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
