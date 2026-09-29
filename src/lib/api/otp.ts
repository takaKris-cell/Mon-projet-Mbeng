/**
 * Service OTP — Manuel backend §3.2.
 *
 * WhatsApp Business est le canal PRINCIPAL ; en cas d'échec de livraison on
 * bascule sur un fournisseur SMS adapté au marché africain (jamais Twilio, pour
 * des raisons de coût déjà actées). Le code n'est jamais stocké en clair, il
 * expire en 5 minutes, et le nombre de demandes par numéro est plafonné.
 *
 * ⚠️ Le hachage ci-dessous est un substitut local. En production, cette logique
 * vit dans une Edge Function Supabase et utilise un vrai KDF (bcrypt/argon2) :
 * ce module est écrit pour être remplacé tel quel, à interface identique.
 */
import { AppError } from '../errors';
import { DEV_TOOLS_ENABLED } from '../env';

export type OtpPurpose =
  | 'inscription'
  | 'connexion_admin'
  | 'changement_telephone'
  | 'changement_numero_paiement';

export type OtpChannel = 'whatsapp' | 'sms';

interface OtpAttempt {
  phoneNumber: string;
  purpose: OtpPurpose;
  channel: OtpChannel;
  codeHash: string;
  expiresAt: number;
  verifyAttempts: number;
}

const MAX_REQUESTS_PER_HOUR = 5;
const MAX_VERIFY_ATTEMPTS = 5;
const TTL_MS = 5 * 60 * 1000;

const attempts = new Map<string, OtpAttempt>();
const requestHistory = new Map<string, number[]>();

function key(phone: string, purpose: OtpPurpose) {
  return `${purpose}:${phone}`;
}

/** Substitut local de hachage — jamais de code en clair en mémoire. */
function hash(code: string): string {
  let h = 5381;
  for (let i = 0; i < code.length; i++) h = ((h << 5) + h + code.charCodeAt(i)) >>> 0;
  return `h${h.toString(36)}`;
}

function generateSixDigitCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

/** Simule l'envoi WhatsApp ; renvoie false pour déclencher la bascule SMS. */
function sendViaWhatsApp(phone: string): boolean {
  // Numéros allemands : souvent pas de WhatsApp Business actif → bascule SMS.
  return !phone.startsWith('+49');
}

export interface OtpTicket {
  channel: OtpChannel;
  expiresAt: number;
  /** Fallback effectué : utile pour surveiller le coût SMS (Manuel §9.3). */
  usedFallback: boolean;
  /**
   * Code affiché UNIQUEMENT en développement, pour pouvoir tester le parcours.
   * `DEV_TOOLS_ENABLED` est statiquement `false` dans un build de production :
   * cette propriété n'existe jamais dans le bundle livré.
   */
  devCode?: string;
}

export function requestOtp(phoneNumber: string, purpose: OtpPurpose): OtpTicket {
  const now = Date.now();
  const history = (requestHistory.get(phoneNumber) ?? []).filter((t) => now - t < 3600_000);
  if (history.length >= MAX_REQUESTS_PER_HOUR) {
    throw new AppError(
      'OTP_RATE_LIMITED',
      'Trop de codes demandés pour ce numéro. Réessaie dans une heure.',
      429,
    );
  }
  history.push(now);
  requestHistory.set(phoneNumber, history);

  const code = generateSixDigitCode();
  const delivered = sendViaWhatsApp(phoneNumber);
  const channel: OtpChannel = delivered ? 'whatsapp' : 'sms';

  attempts.set(key(phoneNumber, purpose), {
    phoneNumber,
    purpose,
    channel,
    codeHash: hash(code),
    expiresAt: now + TTL_MS,
    verifyAttempts: 0,
  });

  const ticket: OtpTicket = { channel, expiresAt: now + TTL_MS, usedFallback: !delivered };
  if (DEV_TOOLS_ENABLED) ticket.devCode = code;
  return ticket;
}

export function verifyOtp(phoneNumber: string, purpose: OtpPurpose, code: string): void {
  const record = attempts.get(key(phoneNumber, purpose));
  if (!record) {
    throw new AppError('OTP_NOT_FOUND', 'Aucun code en attente pour ce numéro. Demande un nouveau code.', 400);
  }
  if (Date.now() > record.expiresAt) {
    attempts.delete(key(phoneNumber, purpose));
    throw new AppError('OTP_EXPIRED', 'Ce code a expiré. Demande un nouveau code.', 400);
  }
  record.verifyAttempts += 1;
  if (record.verifyAttempts > MAX_VERIFY_ATTEMPTS) {
    attempts.delete(key(phoneNumber, purpose));
    throw new AppError('OTP_TOO_MANY_ATTEMPTS', 'Trop de tentatives. Demande un nouveau code.', 429);
  }
  if (hash(code) !== record.codeHash) {
    throw new AppError('OTP_INVALID', 'Code incorrect. Vérifie le message reçu ou demande un nouveau code.', 400);
  }
  attempts.delete(key(phoneNumber, purpose));
}

/** Pour l'écran OTP : sur quel canal le dernier code est-il parti ? */
export function pendingChannel(phoneNumber: string, purpose: OtpPurpose): OtpChannel | null {
  return attempts.get(key(phoneNumber, purpose))?.channel ?? null;
}
