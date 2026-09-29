import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftElement,
  rightElement,
  disabled,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-xs font-semibold text-[#8A8173]"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        {leftElement && (
          <div className="absolute left-3.5 flex items-center pointer-events-none text-[#8A8173]">
            {leftElement}
          </div>
        )}

        <input
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          className={`
            w-full rounded-xl text-[13.5px] transition-all outline-none font-medium
            ${leftElement ? 'pl-10' : 'pl-3.5'}
            ${rightElement ? 'pr-10' : 'pr-3.5'}
            py-3
            ${disabled
              ? 'bg-[#F5F1EA] text-[#8A8173] border border-[#E4DCCB] cursor-not-allowed'
              : error
                ? 'bg-white border-[1.5px] border-[#B3261E] text-[#241F18] shadow-focus-error'
                : 'bg-white border border-[#E4DCCB] text-[#241F18] hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent'
            }
            ${className}
          `}
          {...props}
        />

        {rightElement && (
          <div className="absolute right-3.5 flex items-center text-[#8A8173]">
            {rightElement}
          </div>
        )}
      </div>

      {error ? (
        <p className="text-[11.5px] text-[#B3261E] font-medium flex items-center gap-1 mt-0.5">
          <span>•</span> {error}
        </p>
      ) : helperText ? (
        <p className="text-[11.5px] text-[#8A8173] mt-0.5">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};
