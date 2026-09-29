import React from 'react';
import type { BetreuerRecord } from '../../../data/content';
import { BackButton } from '../../ui/BackButton';
import { Button } from '../../ui/Button';
import { Star, MapPin, CheckCircle2, Video, GraduationCap, Clock, MessageSquare, ShieldCheck } from 'lucide-react';

interface BetreuerProfileViewProps {
  betreuer: BetreuerRecord;
  onBack: () => void;
  onBookSession: () => void;
  onOpenChat: () => void;
}

export const BetreuerProfileView: React.FC<BetreuerProfileViewProps> = ({
  betreuer,
  onBack,
  onBookSession,
  onOpenChat,
}) => {
  return (
    <div className="min-h-full flex flex-col justify-between p-5 bg-[#FAF7F2] animate-fade-in text-left">
      <div>
        <div className="flex items-center justify-between mb-4">
          <BackButton onClick={onBack} title="Marketplace" />
          <button
            onClick={onOpenChat}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E4DCCB] text-[#241F18] hover:text-[#C0512F] text-xs font-bold transition-colors"
          >
            <MessageSquare size={15} />
            <span>Discuter</span>
          </button>
        </div>

        {/* Profil Header */}
        <div className="p-5 rounded-2xl bg-white border border-[#E4DCCB] mb-4">
          <div className="flex items-start gap-4">
            <div className="relative">
              <img
                src={betreuer.avatarUrl}
                alt={betreuer.name}
                className="w-16 h-16 rounded-2xl object-cover border-2 border-[#FAF7F2] shadow-sm"
              />
              {betreuer.verified && (
                <span className="absolute -bottom-1.5 -right-1.5 bg-[#2F9E6E] text-white p-1 rounded-full border-2 border-white shadow-sm" title="Vérifié par Mbeng">
                  <CheckCircle2 size={13} />
                </span>
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h2 className="font-serif font-bold text-xl text-[#241F18]">
                  {betreuer.name}
                </h2>
                <span className="font-serif font-extrabold text-base text-[#C0512F]">
                  {betreuer.hourlyRate.toLocaleString()} F
                </span>
              </div>
              <p className="text-xs text-[#8A8173] font-medium mt-0.5">
                {betreuer.title}
              </p>

              <div className="flex items-center gap-3 mt-2 text-xs">
                <div className="flex items-center gap-1 text-[#A8710A] font-bold">
                  <Star size={14} className="fill-[#A8710A]" />
                  <span>{betreuer.rating}</span>
                  <span className="text-[11px] text-[#8A8173] font-normal">({betreuer.reviewCount} avis)</span>
                </div>
                <span className="text-[#8A8173]">•</span>
                <span className="text-[11px] text-[#8A8173] flex items-center gap-1">
                  <MapPin size={13} /> {betreuer.city}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-[#EFE9DC]">
            <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCCB]">
              <span className="text-[10px] text-[#8A8173] font-bold uppercase block">Formats acceptés</span>
              <span className="text-xs font-semibold text-[#241F18] flex items-center gap-1 mt-0.5">
                {betreuer.format === 'les_deux' ? 'Présentiel & En ligne' : betreuer.format === 'presentiel' ? 'Présentiel' : 'En ligne'}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#FAF7F2] border border-[#E4DCCB]">
              <span className="text-[10px] text-[#8A8173] font-bold uppercase block">Disponibilité</span>
              <span className="text-xs font-semibold text-[#2F9E6E] flex items-center gap-1 mt-0.5">
                <Clock size={13} /> Cette semaine
              </span>
            </div>
          </div>
        </div>

        {/* Bio & Parcours */}
        <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8173] mb-2">
            À propos du tuteur
          </h4>
          <p className="text-xs text-[#3A3226] leading-relaxed">
            {betreuer.bio}
          </p>

          <div className="mt-3 pt-3 border-t border-[#EFE9DC] flex items-center gap-2">
            <GraduationCap size={16} className="text-[#C0512F]" />
            <span className="text-xs font-semibold text-[#241F18]">{betreuer.diploma}</span>
          </div>
        </div>

        {/* Niveaux enseignés */}
        <div className="p-4 rounded-xl bg-white border border-[#E4DCCB] mb-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#8A8173] mb-2">
            Niveaux et spécialités
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {betreuer.levelTaught.map((lvl, i) => (
              <span key={i} className="text-xs font-bold px-2.5 py-1 rounded-lg bg-[#FBEDE6] text-[#C0512F]">
                {lvl}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* CTA de réservation */}
      <div className="pt-4 flex flex-col gap-2">
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={onBookSession}
        >
          Réserver une séance ({betreuer.hourlyRate.toLocaleString()} FCFA/h)
        </Button>
      </div>
    </div>
  );
};
