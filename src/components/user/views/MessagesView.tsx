import React from 'react';
import { BackButton } from '../../ui/BackButton';
import { MessageSquare, ChevronRight, CheckCheck, Clock } from 'lucide-react';
import { sampleBetreuers } from '../../../data/content';

interface MessagesViewProps {
  onBack: () => void;
  onOpenChatWithBetreuer: () => void;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ onBack, onOpenChatWithBetreuer }) => {
  const conversations = [
    {
      id: 1,
      betreuer: sampleBetreuers[0],
      lastMessage: 'Super ! C\'est noté dans mon agenda. Prépare tes questions...',
      time: '09:48',
      unread: 1,
    },
    {
      id: 2,
      betreuer: sampleBetreuers[1],
      lastMessage: 'N\'hésite pas si tu as besoin de la fiche de vocabulaire des urgences.',
      time: 'Hier',
      unread: 0,
    }
  ];

  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="mb-4">
          <BackButton onClick={onBack} title="Accueil" />
        </div>

        <div className="mb-5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#C0512F] bg-[#FBEDE6] px-2.5 py-0.5 rounded">
            TUTEURS & COACHS
          </span>
          <h2 className="font-serif font-bold text-2xl text-[#241F18] mt-1.5">
            Messagerie
          </h2>
          <p className="text-xs text-[#8A8173]">
            Échange directement avec tes tuteurs particuliers pour organiser tes cours.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={onOpenChatWithBetreuer}
              className="p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] cursor-pointer transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={conv.betreuer.avatarUrl}
                    alt={conv.betreuer.name}
                    className="w-12 h-12 rounded-xl object-cover border border-[#E4DCCB]"
                  />
                  {conv.unread > 0 && (
                    <span className="w-3 h-3 rounded-full bg-[#C0512F] absolute -top-0.5 -right-0.5 ring-2 ring-white" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-serif font-bold text-sm text-[#241F18] group-hover:text-[#C0512F] transition-colors">
                      {conv.betreuer.name}
                    </h4>
                    <span className="text-[10px] text-[#8A8173] font-normal">{conv.time}</span>
                  </div>
                  <p className="text-xs text-[#8A8173] line-clamp-1 mt-0.5">
                    {conv.lastMessage}
                  </p>
                </div>
              </div>

              <ChevronRight size={16} className="text-[#8A8173] group-hover:text-[#C0512F] group-hover:translate-x-0.5 transition-all" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
