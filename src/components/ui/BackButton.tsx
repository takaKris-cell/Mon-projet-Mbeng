import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface BackButtonProps {
  onClick: () => void;
  title?: string;
  className?: string;
}

export const BackButton: React.FC<BackButtonProps> = ({ onClick, title, className = '' }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 text-[#241F18] hover:text-[#C0512F] transition-colors py-2 px-1 rounded-lg group ${className}`}
      aria-label="Retour"
    >
      <div className="w-8 h-8 rounded-full bg-white/80 border border-[#E4DCCB] flex items-center justify-center group-hover:border-[#C0512F] transition-colors">
        <ArrowLeft size={18} strokeWidth={2.4} />
      </div>
      {title && <span className="text-sm font-semibold text-[#3A3226] group-hover:text-[#C0512F]">{title}</span>}
    </button>
  );
};
