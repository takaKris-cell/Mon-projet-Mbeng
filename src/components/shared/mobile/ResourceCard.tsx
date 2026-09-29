/**
 * Rendu d'une ressource pédagogique dans l'application mobile.
 *
 * UN SEUL composant, DEUX appelants :
 *   • l'application élève (Bibliothèque, Pflege, Ambassade…) ;
 *   • l'aperçu du CMS côté administration.
 *
 * C'est ce qui rend l'aperçu honnête : il ne peut pas diverger de ce que
 * l'élève voit, puisque c'est littéralement le même code de rendu.
 */
import React from 'react';
import {
  BookOpen, FileText, GraduationCap, Headphones, Lock, Newspaper, Play, Sparkles, Video,
} from 'lucide-react';
import type { ContentResource } from '../../../lib/data/types';
import type { MobileSectionDef } from '../../../lib/data/mobile-sections';

export function resourceIcon(type: ContentResource['type'], size = 18) {
  switch (type) {
    case 'podcast': return <Headphones size={size} />;
    case 'video': return <Video size={size} />;
    case 'livre': return <BookOpen size={size} />;
    case 'modelltest': return <GraduationCap size={size} />;
    case 'actualite': return <Newspaper size={size} />;
    case 'mot': return <Sparkles size={size} />;
    default: return <FileText size={size} />;
  }
}

function metaLine(resource: ContentResource): string {
  const parts: string[] = [];
  if (resource.subtitle) parts.push(resource.subtitle);
  if (resource.durationMin) parts.push(`${resource.durationMin} min`);
  return parts.join(' • ');
}

interface ResourceCardProps {
  resource: ContentResource;
  layout: MobileSectionDef['layout'];
  onOpen?: () => void;
  /** Signale visuellement l'élément en cours de relecture dans l'aperçu CMS. */
  highlighted?: boolean;
}

export const ResourceCard: React.FC<ResourceCardProps> = ({ resource, layout, onOpen, highlighted }) => {
  const ring = highlighted
    ? 'ring-2 ring-[#C0512F] ring-offset-2 ring-offset-[#FAF7F2]'
    : '';

  if (layout === 'mots') {
    return (
      <div className={`p-3 rounded-xl bg-white border border-[#E4DCCB] ${ring}`}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-serif font-bold text-sm text-[#241F18]">{resource.title}</p>
            <p className="text-[11px] text-[#8A8173] mt-0.5">{resource.subtitle}</p>
          </div>
          <span className="text-[9.5px] font-bold text-[#C0512F] bg-[#FBEDE6] px-1.5 py-0.5 rounded shrink-0">
            {resource.level}
          </span>
        </div>
        {resource.body && (
          <p className="text-[11px] text-[#3A3226] italic mt-2 leading-relaxed">« {resource.body} »</p>
        )}
      </div>
    );
  }

  if (layout === 'etapes') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`w-full p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] transition-all text-left flex items-start gap-3 ${ring}`}
      >
        <span className="w-6 h-6 rounded-full bg-[#FBEDE6] text-[#C0512F] text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
          {resource.position}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-bold text-[#241F18]">{resource.title}</span>
          <span className="block text-[11px] text-[#8A8173] mt-0.5">{resource.subtitle}</span>
        </span>
        {resource.premiumOnly && <Lock size={13} className="text-[#A8710A] shrink-0 mt-0.5" />}
      </button>
    );
  }

  if (layout === 'cartes') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className={`w-full p-3.5 rounded-xl bg-[#241F18] text-white hover:bg-[#3A3226] transition-all text-left flex flex-col justify-between gap-3 min-h-[92px] ${ring}`}
      >
        <span className="flex items-center justify-between">
          <span className="text-[#2F9E6E]">{resourceIcon(resource.type, 17)}</span>
          {resource.premiumOnly && <Lock size={12} className="text-[#C0512F]" />}
        </span>
        <span>
          <span className="block text-xs font-bold text-[#FAF7F2] leading-tight">{resource.title}</span>
          <span className="block text-[9.5px] text-[#C7BDA8] mt-0.5 line-clamp-2">{resource.subtitle}</span>
        </span>
      </button>
    );
  }

  // layout « liste » — Bibliothèque, Examens blancs, Pflege, Ambassade
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`w-full p-3.5 rounded-xl bg-white border border-[#E4DCCB] hover:border-[#C0512F] active:bg-[#FAF7F2] transition-all flex items-center justify-between gap-3 group text-left ${ring}`}
    >
      <span className="flex items-center gap-3 min-w-0">
        <span className="w-10 h-10 rounded-lg bg-[#FAF7F2] border border-[#E4DCCB] text-[#241F18] group-hover:text-[#C0512F] flex items-center justify-center shrink-0">
          {resourceIcon(resource.type)}
        </span>
        <span className="min-w-0">
          <span className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-[#241F18] group-hover:text-[#C0512F] transition-colors truncate">
              {resource.title}
            </span>
            <span className="text-[9.5px] font-bold text-[#C0512F] bg-[#FBEDE6] px-1.5 py-0.5 rounded shrink-0">
              {resource.level}
            </span>
            {resource.premiumOnly && <Lock size={11} className="text-[#A8710A] shrink-0" />}
          </span>
          <span className="block text-[11px] text-[#8A8173] mt-0.5 truncate">{metaLine(resource)}</span>
        </span>
      </span>

      <span className="w-7 h-7 rounded-full bg-[#FAF7F2] flex items-center justify-center text-[#8A8173] group-hover:bg-[#C0512F] group-hover:text-white transition-colors shrink-0">
        <Play size={12} className="fill-current ml-0.5" />
      </span>
    </button>
  );
};
