import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Modal: React.FC<ModalProps> = ({
  open, onClose, title, description, children, footer, size = 'md',
}) => {
  useEffect(() => {
    if (!open) return;
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEscape);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-3xl' };

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="absolute inset-0 bg-[#241F18]/45 animate-fade-in" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative w-full ${widths[size]} bg-white rounded-t-3xl sm:rounded-3xl border border-[#E4DCCB] shadow-elevation max-h-[92vh] flex flex-col animate-slide-up text-left`}
      >
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-5 pb-3 border-b border-[#EFE9DC] shrink-0">
          <div>
            <h3 className="font-serif font-bold text-lg text-[#241F18] leading-tight">{title}</h3>
            {description && <p className="text-xs text-[#8A8173] mt-1 leading-relaxed">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[#8A8173] hover:bg-[#F5F1EA] hover:text-[#241F18] active:bg-[#EFE4D5] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C0512F]/40"
          >
            <X size={17} />
          </button>
        </div>

        <div className="px-5 sm:px-6 py-5 overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-[#EFE9DC] bg-[#FAF7F2] rounded-b-3xl shrink-0 flex flex-wrap gap-2 justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
