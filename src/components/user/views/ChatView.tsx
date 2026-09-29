import React, { useState } from 'react';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { Send, CheckCheck, Clock, User, Sparkles } from 'lucide-react';
import { sampleBetreuers } from '../../../data/content';

interface ChatViewProps {
  onBack: () => void;
  onViewProfile: () => void;
  onGoPremium: () => void;
  isPremium: boolean;
}

export const ChatView: React.FC<ChatViewProps> = ({
  onBack,
  onViewProfile,
  onGoPremium,
  isPremium,
}) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'betreuer', text: 'Hallo Awa ! Bienvenue sur ton suivi de préparation B1. Comment s\'est passée ton épreuve de Lesen hier ?', time: '09:41' },
    { id: 2, sender: 'user', text: 'Bonjour Herr Yannick ! J\'ai eu 85% au Teil 1 mais j\'ai encore du mal sur les annonces d\'emploi du Teil 2.', time: '09:44' },
    { id: 3, sender: 'betreuer', text: 'C\'est un grand classique. On peut faire une session de 45 minutes ce jeudi à 16h pour décortiquer les pièges de vocabulaire. Dis-moi si le créneau te convient.', time: '09:48' },
  ]);
  const [inputVal, setInputVal] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'user',
      text: inputVal,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setInputVal('');

    // Réponse automatique tuteur
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: 'betreuer',
          text: 'Super ! C\'est noté dans mon agenda. Prépare tes questions sur le Modelltest 3.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }, 1000);
  };

  return (
    <div className="min-h-full flex flex-col justify-between bg-[#FAF7F2] animate-fade-in text-left">
      {/* En-tête conversation */}
      <div className="p-4 bg-white border-b border-[#E4DCCB] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <BackButton onClick={onBack} />
          <div 
            onClick={onViewProfile}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="relative">
              <img
                src={sampleBetreuers[0].avatarUrl}
                alt="Yannick K."
                className="w-10 h-10 rounded-xl object-cover border border-[#E4DCCB]"
              />
              <span className="w-2.5 h-2.5 rounded-full bg-[#2F9E6E] absolute -bottom-0.5 -right-0.5 ring-2 ring-white" />
            </div>
            <div>
              <h4 className="font-serif font-bold text-sm text-[#241F18] group-hover:text-[#C0512F] transition-colors">
                Yannick K.
              </h4>
              <p className="text-[10px] text-[#2F9E6E] font-medium">En ligne • Betreuer certifié</p>
            </div>
          </div>
        </div>

        <button
          onClick={onViewProfile}
          className="text-xs font-bold text-[#C0512F] bg-[#FBEDE6] px-2.5 py-1 rounded-lg hover:bg-[#C0512F] hover:text-white transition-all"
        >
          Profil
        </button>
      </div>

      {/* Fil de discussion */}
      <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
        {messages.map((m) => {
          const isMe = m.sender === 'user';
          return (
            <div
              key={m.id}
              className={`flex flex-col max-w-[80%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                  isMe
                    ? 'bg-[#C0512F] text-white rounded-br-xs'
                    : 'bg-white text-[#241F18] border border-[#E4DCCB] rounded-bl-xs'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-[#8A8173] mt-1 px-1 flex items-center gap-1">
                {m.time} {isMe && <CheckCheck size={12} className="text-[#C0512F]" />}
              </span>
            </div>
          );
        })}
      </div>

      {/* Saisie message */}
      <div className="p-3 bg-white border-t border-[#E4DCCB]">
        <form onSubmit={handleSend} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Écris ton message en allemand ou français..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="flex-1 bg-[#FAF7F2] border border-[#E4DCCB] text-xs font-medium px-4 py-2.5 rounded-xl outline-none focus:border-[#C0512F]"
          />
          <button
            type="submit"
            disabled={!inputVal.trim()}
            className="w-10 h-10 rounded-xl bg-[#C0512F] disabled:bg-[#E4DCCB] text-white flex items-center justify-center transition-all shrink-0 active:scale-95"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
