import { describe, expect, it } from 'vitest';
import { fieldErrors, normalizeLocalNumber, phoneSchema, toE164 } from '../index';

describe('saisie du numéro de téléphone', () => {
  it('accepte le numéro local, avec ou sans espaces', () => {
    expect(toE164('CM', '699 45 61 28')).toBe('+237699456128');
    expect(toE164('CM', '699456128')).toBe('+237699456128');
    expect(toE164('CM', '699-45-61-28')).toBe('+237699456128');
  });

  it("retire l'indicatif quand il est collé en doublon", () => {
    expect(toE164('CM', '+237 699 45 61 28')).toBe('+237699456128');
    expect(toE164('CM', '237699456128')).toBe('+237699456128');
    expect(toE164('CM', '00237699456128'.replace(/^00/, '+'))).toBe('+237699456128');
  });

  it('ne tronque pas un vrai numéro fixe commençant par 2', () => {
    // 233 43 21 98 est un fixe de Douala : il commence par 2 mais reste valide.
    expect(normalizeLocalNumber('CM', '233432198')).toBe('233432198');
    expect(toE164('CM', '233432198')).toBe('+237233432198');
  });

  it('valide les numéros corrects', () => {
    expect(fieldErrors(phoneSchema, { countryCode: 'CM', localNumber: '699 45 61 28' })).toEqual({});
    expect(fieldErrors(phoneSchema, { countryCode: 'CM', localNumber: '+237 690 12 77 34' })).toEqual({});
  });

  it('rejette les numéros trop courts avec un message lisible', () => {
    const errors = fieldErrors(phoneSchema, { countryCode: 'CM', localNumber: '12' });
    expect(errors.localNumber).toMatch(/Cameroun invalide/);
  });

  it('applique le bon format selon le pays choisi', () => {
    expect(fieldErrors(phoneSchema, { countryCode: 'SN', localNumber: '771234567' })).toEqual({});
    expect(fieldErrors(phoneSchema, { countryCode: 'SN', localNumber: '699456128' }).localNumber).toBeUndefined();
    expect(fieldErrors(phoneSchema, { countryCode: 'DE', localNumber: '15112345678' })).toEqual({});
    expect(toE164('DE', '+49 151 12345678')).toBe('+4915112345678');
  });
});
