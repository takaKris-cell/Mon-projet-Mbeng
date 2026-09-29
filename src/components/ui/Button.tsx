import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  isLoading?: boolean;
  loadingLabel?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

/**
 * Bouton du design system.
 * Chaque variante déclare explicitement ses états : repos, survol, actif
 * (enfoncé), focus clavier et désactivé — aucun bouton « mort » visuellement.
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  isLoading = false,
  loadingLabel,
  disabled = false,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  const isDisabled = disabled || isLoading;

  const base =
    'relative inline-flex items-center justify-center font-bold transition-all duration-150 select-none ' +
    'outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#FAF7F2] ' +
    'active:translate-y-[1px] disabled:active:translate-y-0 disabled:cursor-not-allowed';

  const sizes = {
    sm: 'text-xs py-2 px-3.5 rounded-lg gap-1.5',
    md: 'text-sm py-3 px-4 rounded-xl gap-2',
    lg: 'text-[15px] py-3.5 px-6 rounded-xl gap-2.5',
  };

  const variants = {
    primary: isDisabled
      ? 'bg-[#E4DCCB] text-[#B8AF9E] shadow-none'
      : 'bg-[#C0512F] text-white hover:bg-[#A8452A] active:bg-[#8F3B24] shadow-sm focus-visible:ring-[#C0512F]',
    secondary: isDisabled
      ? 'bg-transparent border-[1.5px] border-[#EFE9DC] text-[#B8AF9E]'
      : 'bg-transparent border-[1.5px] border-[#E4DCCB] text-[#241F18] hover:bg-[#F5F1EA] hover:border-[#C7BDA8] active:bg-[#EFE4D5] focus-visible:ring-[#C0512F]',
    ghost: isDisabled
      ? 'text-[#B8AF9E]'
      : 'text-[#241F18] hover:bg-[#F5F1EA] active:bg-[#EFE4D5] focus-visible:ring-[#C0512F]',
    danger: isDisabled
      ? 'bg-[#E4DCCB] text-[#B8AF9E]'
      : 'bg-[#B3261E] text-white hover:bg-[#961F18] active:bg-[#7D1913] focus-visible:ring-[#B3261E]',
    success: isDisabled
      ? 'bg-[#E4DCCB] text-[#B8AF9E]'
      : 'bg-[#2F9E6E] text-white hover:bg-[#268159] active:bg-[#1F6B47] focus-visible:ring-[#2F9E6E]',
  };

  return (
    <button
      disabled={isDisabled}
      aria-busy={isLoading || undefined}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mbeng-spinner-sm inline-block" aria-hidden="true" />
          <span>{loadingLabel ?? 'Un instant…'}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span className="truncate">{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

/** Bouton d'action compact dans un tableau (icône seule, avec libellé accessible). */
export const IconButton: React.FC<
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    tone?: 'neutral' | 'accent' | 'danger' | 'success';
  }
> = ({ label, tone = 'neutral', className = '', children, disabled, ...props }) => {
  const tones = {
    neutral: 'text-[#8A8173] hover:text-[#241F18] hover:bg-[#F5F1EA] focus-visible:ring-[#8A8173]',
    accent: 'text-[#C0512F] hover:bg-[#FBEDE6] focus-visible:ring-[#C0512F]',
    danger: 'text-[#B3261E] hover:bg-[#FBE9E7] focus-visible:ring-[#B3261E]',
    success: 'text-[#2F9E6E] hover:bg-[#DDF0E6] focus-visible:ring-[#2F9E6E]',
  };
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      disabled={disabled}
      className={`w-8 h-8 rounded-lg inline-flex items-center justify-center transition-colors outline-none focus-visible:ring-2 active:scale-95 disabled:text-[#C7BDA8] disabled:hover:bg-transparent disabled:cursor-not-allowed disabled:active:scale-100 ${tones[tone]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
