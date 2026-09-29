/**
 * Authentification des 3 portails — strictement cloisonnée.
 *
 * Chaque portail possède son propre point d'entrée, ses propres identifiants et
 * son propre jeton. Réussir une connexion Utilisateur ne crée AUCUNE session
 * Commercial ou Administration : il n'existe aucun chemin de code qui élève un
 * rôle (audit §1, Manuel §3.1).
 */
import { AppError, type ActionResult, fail, ok } from '../errors';
import {
  clearSession,
  createSession,
  readSession,
  writeSession,
  type Session,
} from '../auth/session';
import { db, writeAudit } from '../data/store';
import type { GlobalRole, PortalScope, Profile } from '../data/types';
import { requestOtp, verifyOtp, type OtpTicket } from './otp';
import { delay, write } from './client';
import { DEV_TOOLS_ENABLED } from '../env';
import {
  adminLoginSchema,
  agentLoginSchema,
  otpCodeSchema,
  parseOrThrow,
  phoneSchema,
  studentLoginSchema,
  studentRegisterSchema,
  toE164,
} from '../validation';

/* ---------------------------------------------------------- identifiants */

/**
 * Comptes de démonstration — base de DÉVELOPPEMENT uniquement.
 *
 * Ce ne sont pas des sessions câblées en dur : ce sont des comptes qu'il faut
 * saisir et valider comme n'importe quel autre. Surtout, la table entière est
 * gardée par `DEV_TOOLS_ENABLED` : dans un build de production, la condition
 * est évaluée à la compilation, le bloc devient du code mort et Rollup
 * l'élimine — aucun mot de passe n'est livré au navigateur. En production,
 * l'authentification passe par Supabase Auth (voir README, « Bascule backend »).
 */
const CREDENTIALS: Record<string, { password: string; role: GlobalRole; userId: string }> =
  DEV_TOOLS_ENABLED
    ? {
        '+237699456128': { password: 'mbeng2026', role: 'eleve', userId: 'usr_awa' },
        '+237690127734': { password: 'agent2026', role: 'commercial', userId: 'usr_jean' },
        'admin@monprojetmbeng.com': { password: 'admin2026', role: 'super_admin', userId: 'usr_admin' },
      }
    : {};

/** Rappel affiché sur l'écran de connexion, en développement uniquement. */
export const DEMO_ACCOUNTS = DEV_TOOLS_ENABLED
  ? {
      user: { identifier: '+237 699 45 61 28', password: 'mbeng2026' },
      commercial: { identifier: '+237 690 12 77 34', password: 'agent2026' },
      admin: { identifier: 'admin@monprojetmbeng.com', password: 'admin2026' },
    }
  : { user: { identifier: '', password: '' }, commercial: { identifier: '', password: '' }, admin: { identifier: '', password: '' } };

function findProfile(userId: string): Profile | undefined {
  return db.profiles.find((p) => p.id === userId);
}

function logSecurity(action: string, portal: PortalScope, actorId: string, actorName: string, metadata: Record<string, unknown> = {}) {
  writeAudit({ actorId, actorName, portal, action, targetTable: 'user_roles', targetId: actorId, metadata });
}

/* ------------------------------------------------- Portail Utilisateur */

export interface StudentLoginInput {
  countryCode: string;
  localNumber: string;
  password: string;
}

export async function loginStudent(input: StudentLoginInput): Promise<ActionResult<Session>> {
  try {
    const data = parseOrThrow(studentLoginSchema, input);
    parseOrThrow(phoneSchema, { countryCode: data.countryCode, localNumber: data.localNumber });
    const e164 = toE164(data.countryCode, data.localNumber);

    return await write(() => {
      const cred = CREDENTIALS[e164];
      if (!cred || cred.password !== data.password) {
        logSecurity('auth.login_failed', 'user', 'anonyme', e164);
        throw new AppError('INVALID_CREDENTIALS', 'Numéro ou mot de passe incorrect.', 401);
      }
      if (cred.role !== 'eleve' && cred.role !== 'betreuer') {
        throw new AppError('FORBIDDEN', "Ce compte n'est pas un compte élève.", 403);
      }
      const profile = findProfile(cred.userId);
      if (!profile) throw new AppError('PROFILE_NOT_FOUND', 'Compte introuvable.', 404);

      const session = createSession({
        scope: 'user',
        userId: profile.id,
        fullName: profile.fullName,
        role: cred.role,
        twoFactorVerified: true,
      });
      writeSession(session);
      logSecurity('auth.login_success', 'user', profile.id, profile.fullName);
      return ok(session);
    });
  } catch (e) {
    return fail(e);
  }
}

export interface StudentRegisterInput {
  fullName: string;
  email: string;
  countryCode: string;
  localNumber: string;
  password: string;
  referralCode?: string;
}

/** Étape 1 de l'inscription : validation + envoi du code OTP. Aucune session créée. */
export async function startStudentRegistration(
  input: StudentRegisterInput,
): Promise<ActionResult<{ phone: string; ticket: OtpTicket }>> {
  try {
    const data = parseOrThrow(studentRegisterSchema, input);
    parseOrThrow(phoneSchema, { countryCode: data.countryCode, localNumber: data.localNumber });
    const phone = toE164(data.countryCode, data.localNumber);
    await delay();
    const ticket = requestOtp(phone, 'inscription');
    pendingRegistrations.set(phone, data);
    return ok({ phone, ticket });
  } catch (e) {
    return fail(e);
  }
}

const pendingRegistrations = new Map<string, StudentRegisterInput>();

/** Étape 2 : vérification du code, création du compte, puis session élève. */
export async function completeStudentRegistration(
  phone: string,
  code: string,
): Promise<ActionResult<Session>> {
  try {
    parseOrThrow(otpCodeSchema, code, 'OTP_FORMAT');
    return await write(() => {
      verifyOtp(phone, 'inscription', code);
      const pending = pendingRegistrations.get(phone);
      if (!pending) throw new AppError('REGISTRATION_EXPIRED', 'Inscription expirée. Recommence depuis le début.', 400);

      const profile: Profile = {
        id: `usr_${Date.now().toString(36)}`,
        fullName: pending.fullName,
        email: pending.email,
        phone,
        city: '',
        level: 'A1',
        role: 'eleve',
        registeredVia: pending.referralCode?.trim() || null,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        subscription: 'gratuit',
        status: 'actif',
        isPremium: false,
        premiumSince: null,
        referralCode: `${pending.fullName.split(' ')[0].toUpperCase().slice(0, 4)}${new Date().getFullYear()}`,
        referralCredits: 0,
        referralCount: 0,
        countryCode: pending.countryCode,
      };
      db.profiles.push(profile);
      CREDENTIALS[phone] = { password: pending.password, role: 'eleve', userId: profile.id };
      pendingRegistrations.delete(phone);

      const session = createSession({
        scope: 'user',
        userId: profile.id,
        fullName: profile.fullName,
        role: 'eleve',
        twoFactorVerified: true,
      });
      writeSession(session);
      logSecurity('auth.account_created', 'user', profile.id, profile.fullName, { registeredVia: profile.registeredVia });
      return ok(session);
    });
  } catch (e) {
    return fail(e);
  }
}

export async function resendStudentOtp(phone: string): Promise<ActionResult<OtpTicket>> {
  try {
    await delay();
    return ok(requestOtp(phone, 'inscription'));
  } catch (e) {
    return fail(e);
  }
}

/* -------------------------------------------------- Espace Commercial */

export async function loginAgent(input: StudentLoginInput): Promise<ActionResult<Session>> {
  try {
    const data = parseOrThrow(agentLoginSchema, input);
    parseOrThrow(phoneSchema, { countryCode: data.countryCode, localNumber: data.localNumber });
    const e164 = toE164(data.countryCode, data.localNumber);

    return await write(() => {
      const cred = CREDENTIALS[e164];
      if (!cred || cred.password !== data.password || cred.role !== 'commercial') {
        logSecurity('auth.login_failed', 'commercial', 'anonyme', e164);
        throw new AppError('INVALID_CREDENTIALS', 'Identifiant commercial ou mot de passe incorrect.', 401);
      }
      const agent = db.agentProfiles.find((a) => a.userId === cred.userId);
      if (!agent) throw new AppError('AGENT_NOT_FOUND', 'Compte agent introuvable.', 404);
      if (agent.status !== 'actif') {
        throw new AppError('AGENT_SUSPENDED', 'Ce compte agent est suspendu. Contacte l’administration.', 403);
      }

      const session = createSession({
        scope: 'commercial',
        userId: cred.userId,
        fullName: agent.fullName,
        role: 'commercial',
        twoFactorVerified: true,
      });
      writeSession(session);
      logSecurity('auth.login_success', 'commercial', cred.userId, agent.fullName);
      return ok(session);
    });
  } catch (e) {
    return fail(e);
  }
}

/* --------------------------------------------------- Administration */

export interface AdminChallenge {
  email: string;
  phoneMasked: string;
  ticket: OtpTicket;
}

/**
 * Étape 1 : email + mot de passe. Manuel §3.3 — un rôle `requires_2fa` ne peut
 * PAS obtenir de session complète à cette étape : aucun jeton n'est émis ici.
 */
export async function startAdminLogin(input: { email: string; password: string }): Promise<ActionResult<AdminChallenge>> {
  try {
    const data = parseOrThrow(adminLoginSchema, input);
    return await write(() => {
      const cred = CREDENTIALS[data.email.toLowerCase().trim()];
      if (!cred || cred.password !== data.password) {
        logSecurity('auth.login_failed', 'admin', 'anonyme', data.email);
        throw new AppError('INVALID_CREDENTIALS', 'Email administrateur ou mot de passe incorrect.', 401);
      }
      if (cred.role !== 'admin' && cred.role !== 'super_admin') {
        throw new AppError('FORBIDDEN', "Ce compte n'a pas accès à l'administration.", 403);
      }
      const phone = db.settings.whatsappBusinessNumber;
      const ticket = requestOtp(phone, 'connexion_admin');
      adminChallenges.set(data.email.toLowerCase().trim(), { userId: cred.userId, role: cred.role, phone });
      return ok({
        email: data.email.toLowerCase().trim(),
        phoneMasked: phone.replace(/\d(?=\d{2})/g, '•'),
        ticket,
      });
    });
  } catch (e) {
    return fail(e);
  }
}

const adminChallenges = new Map<string, { userId: string; role: GlobalRole; phone: string }>();

/** Étape 2 : second facteur. C'est seulement ici qu'une session admin est émise. */
export async function completeAdminLogin(email: string, code: string): Promise<ActionResult<Session>> {
  try {
    parseOrThrow(otpCodeSchema, code, 'OTP_FORMAT');
    return await write(() => {
      const challenge = adminChallenges.get(email.toLowerCase().trim());
      if (!challenge) {
        throw new AppError('CHALLENGE_EXPIRED', 'Demande de connexion expirée. Recommence.', 400);
      }
      verifyOtp(challenge.phone, 'connexion_admin', code);
      const access = db.adminAccesses.find((a) => a.userId === challenge.userId);
      const session = createSession({
        scope: 'admin',
        userId: challenge.userId,
        fullName: access?.fullName ?? 'Super Administrateur',
        role: challenge.role,
        twoFactorVerified: true,
      });
      writeSession(session);
      adminChallenges.delete(email.toLowerCase().trim());
      logSecurity('auth.2fa_verified', 'admin', session.userId, session.fullName);
      return ok(session);
    });
  } catch (e) {
    return fail(e);
  }
}

/* ------------------------------------------------------------ commun */

export function currentSession(scope: PortalScope): Session | null {
  return readSession(scope);
}

export async function logout(scope: PortalScope): Promise<void> {
  const session = readSession(scope);
  if (session) logSecurity('auth.logout', scope, session.userId, session.fullName);
  await delay(120);
  clearSession(scope);
}
