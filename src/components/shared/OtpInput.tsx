/**
 * Saisie d'un code à 6 chiffres.
 *
 * Bug corrigé (audit §4, écran OTP) : saisir ou coller plusieurs chiffres d'un
 * coup dans une case répartit désormais automatiquement les chiffres suivants
 * dans les cases suivantes, sans clic manuel.
 */
import React, { useRef } from 'react';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (value: string) => void;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  error,
  disabled,
  autoFocus,
  onComplete,
}) => {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const commit = (next: string, focusIndex: number) => {
    const trimmed = next.slice(0, length);
    onChange(trimmed);
    const target = Math.min(focusIndex, length - 1);
    refs.current[target]?.focus();
    refs.current[target]?.select();
    if (trimmed.length === length) onComplete?.(trimmed);
  };

  /** Répartit une saisie multi-chiffres à partir de la case courante. */
  const distribute = (index: number, raw: string) => {
    const incoming = raw.replace(/\D/g, '');
    if (!incoming) return;
    const chars = value.padEnd(length, ' ').split('');
    let cursor = index;
    for (const ch of incoming) {
      if (cursor >= length) break;
      chars[cursor] = ch;
      cursor += 1;
    }
    commit(chars.join('').replace(/\s+$/g, ''), cursor);
  };

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Code de vérification à 6 chiffres">
      {Array.from({ length }).map((_, idx) => {
        const digit = digits[idx]?.trim() ?? '';
        return (
          <input
            key={idx}
            ref={(el) => { refs.current[idx] = el; }}
            type="text"
            inputMode="numeric"
            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
            aria-label={`Chiffre ${idx + 1}`}
            autoFocus={autoFocus && idx === 0}
            disabled={disabled}
            value={digit}
            onChange={(e) => distribute(idx, e.target.value)}
            onPaste={(e) => {
              e.preventDefault();
              distribute(idx, e.clipboardData.getData('text'));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                e.preventDefault();
                const chars = value.padEnd(length, ' ').split('');
                if (chars[idx]?.trim()) {
                  chars[idx] = ' ';
                  commit(chars.join('').replace(/\s+$/g, ''), idx);
                } else if (idx > 0) {
                  chars[idx - 1] = ' ';
                  commit(chars.join('').replace(/\s+$/g, ''), idx - 1);
                }
              } else if (e.key === 'ArrowLeft' && idx > 0) {
                refs.current[idx - 1]?.focus();
              } else if (e.key === 'ArrowRight' && idx < length - 1) {
                refs.current[idx + 1]?.focus();
              }
            }}
            className={`
              w-full h-14 text-center text-xl font-bold font-serif rounded-xl outline-none transition-all
              ${disabled ? 'bg-[#F5F1EA] text-[#8A8173] border border-[#E4DCCB] cursor-not-allowed'
                : error ? 'bg-[#FBE9E7]/40 border-[1.5px] border-[#B3261E] text-[#B3261E] shadow-focus-error'
                : digit ? 'bg-white border-[1.5px] border-[#C0512F] text-[#241F18] shadow-focus-accent'
                : 'bg-white border border-[#E4DCCB] text-[#241F18] hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent'}
            `}
          />
        );
      })}
    </div>
  );
};
