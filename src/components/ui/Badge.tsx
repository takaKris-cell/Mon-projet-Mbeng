import React from 'react';

export type BadgeVariant = 'success' | 'warning' | 'error' | 'accent' | 'neutral' | 'info';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  className = '' 
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    // Succès : vert sur vert pâle
    success: 'bg-[#DDF0E6] text-[#2F9E6E]',
    // Avertissement : ambre sur jaune doux
    warning: 'bg-[#FBF0DC] text-[#A8710A] border border-[#F0D9A8]/60',
    // Erreur / Refus : rouge sur rouge pastel
    error: 'bg-[#FBE9E7] text-[#B3261E] border border-[#F0BDB8]/60',
    // Accent / Terracotta : mise en avant
    accent: 'bg-[#FBEDE6] text-[#C0512F]',
    // Neutre / Attente : gris sur beige
    neutral: 'bg-[#F1E7DA] text-[#8A8173]',
    // Info doux
    info: 'bg-[#F0F9F4] text-[#1F6B47] border border-[#B9E2CC]'
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-1 text-[11px] font-bold rounded-lg tracking-tight ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};
