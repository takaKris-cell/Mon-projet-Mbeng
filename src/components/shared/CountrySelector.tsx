/**
 * Sélecteur de pays PARTAGÉ et RESPONSIVE.
 *
 * Il était présent sur la maquette web et absent du mobile. C'est désormais un
 * seul composant, utilisé partout où un pays ou un numéro est saisi :
 * écran Bienvenue, connexion, inscription, changement de numéro de téléphone et
 * changement de numéro de paiement de l'agent commercial.
 *
 * Mise en page : liste déroulante ancrée sur écran large, feuille modale
 * remontante (bottom sheet) sous 640 px — même composant, même état.
 */
import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, ChevronDown, Search, X } from 'lucide-react';
import { COUNTRIES, findCountry, type CountryCode } from '../../lib/validation';

interface CountrySelectorProps {
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  label?: string;
  disabled?: boolean;
  /** `compact` : bouton drapeau + indicatif, pour l'accoler à un champ téléphone. */
  variant?: 'full' | 'compact';
  id?: string;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  value,
  onChange,
  label,
  disabled,
  variant = 'full',
  id,
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const autoId = useId();
  const buttonId = id ?? `country-${autoId}`;
  const current = findCountry(value);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onEscape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onEscape);
    };
  }, [open]);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.trim().toLowerCase()) ||
      c.dial.includes(query.trim()),
  );

  const select = (code: CountryCode) => {
    onChange(code);
    setOpen(false);
    setQuery('');
  };

  return (
    <div
      /*
        En variante `compact`, ce bloc est un élément flex posé À CÔTÉ du champ
        numéro : il ne doit surtout pas réclamer `w-full`, sinon il écrase la
        saisie voisine (qui est en `flex-1 min-w-0`) jusqu'à la rendre
        inutilisable. Il garde donc sa largeur intrinsèque et ne rétrécit pas.
      */
      className={
        variant === 'compact'
          ? 'shrink-0 flex flex-col gap-1.5 text-left'
          : 'w-full flex flex-col gap-1.5 text-left'
      }
      ref={containerRef}
    >
      {label && (
        <label htmlFor={buttonId} className="text-xs font-semibold text-[#8A8173]">
          {label}
        </label>
      )}

      <div className="relative">
        <button
          id={buttonId}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
          className={`
            flex items-center gap-2 rounded-xl border transition-all font-semibold outline-none
            ${variant === 'compact' ? 'px-3 py-3 text-[13.5px] shrink-0' : 'w-full px-3.5 py-3 text-[13.5px] justify-between'}
            ${disabled
              ? 'bg-[#F5F1EA] text-[#8A8173] border-[#E4DCCB] cursor-not-allowed'
              : 'bg-white text-[#241F18] border-[#E4DCCB] hover:border-[#C7BDA8] active:bg-[#F5F1EA] focus-visible:border-[#C0512F] focus-visible:shadow-focus-accent cursor-pointer'}
            ${open && !disabled ? 'border-[#C0512F] shadow-focus-accent' : ''}
          `}
        >
          <span className="flex items-center gap-2 truncate">
            <span aria-hidden="true" className="text-base leading-none">{current.flag}</span>
            {variant === 'full' && <span className="truncate">{current.name}</span>}
            <span className={variant === 'full' ? 'text-[#8A8173]' : ''}>{current.dial}</span>
          </span>
          <ChevronDown
            size={15}
            className={`text-[#8A8173] shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <>
            {/* Mobile : feuille remontante plein écran. */}
            <div
              className="sm:hidden fixed inset-0 z-50 bg-[#241F18]/40 animate-fade-in"
              onClick={() => setOpen(false)}
            />
            <div
              role="listbox"
              aria-label="Choisir un pays"
              className="
                sm:hidden fixed z-50 inset-x-0 bottom-0 bg-white rounded-t-3xl border-t border-[#E4DCCB]
                shadow-elevation max-h-[72vh] flex flex-col animate-slide-up
              "
            >
              <div className="flex items-center justify-between px-5 pt-4 pb-2">
                <h3 className="font-serif font-bold text-base text-[#241F18]">Choisis ton pays</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Fermer"
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#8A8173] hover:bg-[#F5F1EA] active:bg-[#EFE4D5] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
              <SearchBox query={query} setQuery={setQuery} />
              <ul className="overflow-y-auto px-2 pb-6">
                {filtered.map((c) => (
                  <CountryRow key={c.code} country={c} selected={c.code === value} onSelect={select} />
                ))}
              </ul>
            </div>

            {/* Écran large : liste ancrée sous le bouton. */}
            <div
              role="listbox"
              aria-label="Choisir un pays"
              className="
                hidden sm:flex absolute z-40 mt-2 left-0 min-w-[268px] max-h-[300px] flex-col
                bg-white rounded-2xl border border-[#E4DCCB] shadow-elevation overflow-hidden animate-scale-in
              "
            >
              <SearchBox query={query} setQuery={setQuery} />
              <ul className="overflow-y-auto p-1.5">
                {filtered.map((c) => (
                  <CountryRow key={c.code} country={c} selected={c.code === value} onSelect={select} />
                ))}
                {filtered.length === 0 && (
                  <li className="px-3 py-4 text-xs text-[#8A8173] text-center">Aucun pays trouvé.</li>
                )}
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

const SearchBox: React.FC<{ query: string; setQuery: (v: string) => void }> = ({ query, setQuery }) => (
  <div className="p-2.5 border-b border-[#EFE9DC] shrink-0">
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8A8173] pointer-events-none" />
      <input
        type="text"
        value={query}
        autoFocus
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher un pays ou un indicatif…"
        className="w-full bg-[#FAF7F2] border border-[#E4DCCB] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#241F18] outline-none focus:border-[#C0512F] focus:shadow-focus-accent transition-all"
      />
    </div>
  </div>
);

const CountryRow: React.FC<{
  country: (typeof COUNTRIES)[number];
  selected: boolean;
  onSelect: (code: CountryCode) => void;
}> = ({ country, selected, onSelect }) => (
  <li>
    <button
      type="button"
      role="option"
      aria-selected={selected}
      onClick={() => onSelect(country.code)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors ${
        selected ? 'bg-[#FBEDE6] text-[#C0512F]' : 'text-[#241F18] hover:bg-[#F5F1EA] active:bg-[#EFE4D5]'
      }`}
    >
      <span aria-hidden="true" className="text-lg leading-none">{country.flag}</span>
      <span className="flex-1 text-[13px] font-semibold truncate">{country.name}</span>
      <span className="text-xs font-mono text-[#8A8173]">{country.dial}</span>
      {selected && <Check size={15} className="text-[#C0512F] shrink-0" />}
    </button>
  </li>
);

/* ------------------------------------------------------- champ téléphone */

interface PhoneFieldProps {
  label?: string;
  countryCode: CountryCode;
  onCountryChange: (code: CountryCode) => void;
  value: string;
  onValueChange: (value: string) => void;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  id?: string;
}

/** Sélecteur de pays + numéro local : le composant unique de saisie de numéro. */
export const PhoneField: React.FC<PhoneFieldProps> = ({
  label = 'Numéro de téléphone (WhatsApp / SMS)',
  countryCode,
  onCountryChange,
  value,
  onValueChange,
  error,
  helperText,
  disabled,
  autoFocus,
  id,
}) => {
  const autoId = useId();
  const inputId = id ?? `phone-${autoId}`;
  const country = findCountry(countryCode);

  return (
    <div className="w-full flex flex-col gap-1.5 text-left">
      <label htmlFor={inputId} className="text-xs font-semibold text-[#8A8173]">
        {label}
      </label>
      <div className="flex gap-2 items-start">
        <CountrySelector
          value={countryCode}
          onChange={onCountryChange}
          variant="compact"
          disabled={disabled}
        />
        <input
          id={inputId}
          type="tel"
          inputMode="tel"
          autoFocus={autoFocus}
          disabled={disabled}
          value={value}
          placeholder={country.example}
          onChange={(e) => onValueChange(e.target.value)}
          aria-invalid={Boolean(error)}
          className={`
            flex-1 min-w-0 rounded-xl px-3.5 py-3 text-[13.5px] font-medium outline-none transition-all
            ${disabled
              ? 'bg-[#F5F1EA] text-[#8A8173] border border-[#E4DCCB] cursor-not-allowed'
              : error
                ? 'bg-white border-[1.5px] border-[#B3261E] text-[#241F18] shadow-focus-error'
                : 'bg-white border border-[#E4DCCB] text-[#241F18] hover:border-[#C7BDA8] focus:border-[#C0512F] focus:shadow-focus-accent'}
          `}
        />
      </div>
      {error ? (
        <p className="text-[11.5px] text-[#B3261E] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-[11.5px] text-[#8A8173]">{helperText}</p>
      ) : null}
    </div>
  );
};
