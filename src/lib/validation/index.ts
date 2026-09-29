/**
 * Schémas de validation Zod — Manuel backend §2.2.
 * Aucune donnée venant du client n'est utilisée sans passer par un de ces
 * schémas. Ils sont réutilisés côté formulaire (erreur immédiate) ET côté
 * « serveur » (rejet si le formulaire est contourné).
 */
import { z } from 'zod';
import { AppError } from '../errors';
import { CONTENT_SECTIONS, CONTENT_TYPES, type ContentSection, type ContentType } from '../data/types';
import { CONTENT_TYPE_DEFS, MOBILE_SECTIONS } from '../data/mobile-sections';

const CONTENT_SECTION_VALUES = CONTENT_SECTIONS as unknown as [ContentSection, ...ContentSection[]];
const CONTENT_TYPE_VALUES = CONTENT_TYPES as unknown as [ContentType, ...ContentType[]];
const CONTENT_TYPE_RULES = CONTENT_TYPE_DEFS;
const SECTION_TYPES: Record<string, ContentType[]> = Object.fromEntries(
  MOBILE_SECTIONS.map((s) => [s.id, s.allowedTypes]),
);

/** Indicatifs couverts par la plateforme (sélecteur de pays partagé). */
export const COUNTRIES = [
  { code: 'CM', name: 'Cameroun', dial: '+237', flag: '🇨🇲', pattern: /^[2368]\d{7,8}$/, example: '6XX XX XX XX' },
  { code: 'GA', name: 'Gabon', dial: '+241', flag: '🇬🇦', pattern: /^\d{7,8}$/, example: '0X XX XX XX' },
  { code: 'CI', name: "Côte d'Ivoire", dial: '+225', flag: '🇨🇮', pattern: /^\d{8,10}$/, example: '07 XX XX XX XX' },
  { code: 'SN', name: 'Sénégal', dial: '+221', flag: '🇸🇳', pattern: /^\d{9}$/, example: '7X XXX XX XX' },
  { code: 'CD', name: 'RD Congo', dial: '+243', flag: '🇨🇩', pattern: /^\d{9}$/, example: '8XX XXX XXX' },
  { code: 'TG', name: 'Togo', dial: '+228', flag: '🇹🇬', pattern: /^\d{8}$/, example: 'XX XX XX XX' },
  { code: 'BJ', name: 'Bénin', dial: '+229', flag: '🇧🇯', pattern: /^\d{8,10}$/, example: 'XX XX XX XX' },
  { code: 'DE', name: 'Allemagne', dial: '+49', flag: '🇩🇪', pattern: /^\d{9,12}$/, example: '1XX XXXXXXX' },
] as const;

export type CountryCode = (typeof COUNTRIES)[number]['code'];

export const DEFAULT_COUNTRY: CountryCode = 'CM';

export function findCountry(code: string) {
  return COUNTRIES.find((c) => c.code === code) ?? COUNTRIES[0];
}

/**
 * Nettoie un numéro local saisi à la main.
 *
 * Beaucoup de gens collent le numéro complet (« +237 699 45 61 28 » ou
 * « 237699456128 ») dans le champ local, alors que l'indicatif est déjà choisi
 * à côté. On retire donc l'indicatif en doublon, mais UNIQUEMENT quand cela
 * rend le numéro valide : un vrai numéro fixe camerounais commençant par 2
 * n'est jamais tronqué.
 */
export function normalizeLocalNumber(countryCode: string, raw: string): string {
  const country = findCountry(countryCode);
  const dialDigits = country.dial.replace('+', '');
  const startedWithPlus = raw.trim().startsWith('+');
  const digits = raw.replace(/[^\d]/g, '');

  if (!digits.startsWith(dialDigits)) return digits;

  const withoutDial = digits.slice(dialDigits.length);
  // Saisi avec un « + » : l'indicatif est explicite, on le retire toujours.
  if (startedWithPlus) return withoutDial;
  // Sinon, on ne retire que si cela transforme un numéro invalide en valide.
  if (!country.pattern.test(digits) && country.pattern.test(withoutDial)) return withoutDial;
  return digits;
}

/** Normalise en E.164 sans espace : +237699456128. */
export function toE164(countryCode: string, localNumber: string): string {
  const country = findCountry(countryCode);
  return `${country.dial}${normalizeLocalNumber(countryCode, localNumber)}`;
}

export function formatPhoneForDisplay(e164: string): string {
  const digits = e164.replace(/[^\d+]/g, '');
  const country = COUNTRIES.find((c) => digits.startsWith(c.dial));
  if (!country) return e164;
  const local = digits.slice(country.dial.length);
  return `${country.dial} ${local.replace(/(\d{3})(?=\d)/g, '$1 ').trim()}`;
}

export const countryCodeSchema = z.enum(
  COUNTRIES.map((c) => c.code) as [CountryCode, ...CountryCode[]],
);

export const phoneSchema = z
  .object({
    countryCode: countryCodeSchema,
    localNumber: z.string().min(1, 'Le numéro de téléphone est obligatoire.'),
  })
  .superRefine((value, ctx) => {
    const country = findCountry(value.countryCode);
    const digits = normalizeLocalNumber(value.countryCode, value.localNumber);
    if (!country.pattern.test(digits)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Numéro ${country.name} invalide (format attendu : ${country.example}).`,
        path: ['localNumber'],
      });
    }
  });

export const otpCodeSchema = z
  .string()
  .regex(/^\d{6}$/, 'Le code de vérification comporte 6 chiffres.');

export const studentRegisterSchema = z.object({
  fullName: z.string().min(3, 'Indique ton nom complet.'),
  email: z.string().email('Adresse email invalide.'),
  countryCode: countryCodeSchema,
  localNumber: z.string().min(1, 'Le numéro de téléphone est obligatoire.'),
  password: z.string().min(8, 'Le mot de passe doit comporter au moins 8 caractères.'),
  referralCode: z.string().optional(),
});

export const studentLoginSchema = z.object({
  countryCode: countryCodeSchema,
  localNumber: z.string().min(1, 'Le numéro de téléphone est obligatoire.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});

export const agentLoginSchema = z.object({
  countryCode: countryCodeSchema,
  localNumber: z.string().min(1, 'Le numéro de téléphone est obligatoire.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});

export const adminLoginSchema = z.object({
  email: z.string().email('Adresse email invalide.'),
  password: z.string().min(1, 'Le mot de passe est obligatoire.'),
});

/** Manuel §2.2 — le changement de numéro de paiement exige un code OTP. */
export const updatePayoutNumberSchema = z.object({
  provider: z.enum(['orange_money', 'mtn_momo']),
  countryCode: countryCodeSchema,
  localNumber: z.string().min(1, 'Le numéro de paiement est obligatoire.'),
  otpCode: otpCodeSchema,
});

/** Manuel §5.3.1 — « Marquer payé » exige une référence de transaction non vide. */
export const markPayoutPaidSchema = z.object({
  payoutId: z.string().min(1),
  transactionReference: z.string().trim().min(4, 'La référence de transaction est obligatoire (4 caractères minimum).'),
});

/** Manuel §5.3.2 — « Rejeter » exige un motif non vide. */
export const rejectPayoutSchema = z.object({
  payoutId: z.string().min(1),
  rejectionReason: z.string().trim().min(10, 'Le motif de rejet est obligatoire (10 caractères minimum).'),
});

export const chargeSchema = z.object({
  label: z.string().trim().min(3, 'Libellé trop court.'),
  category: z.enum(['infrastructure', 'marketing', 'physique', 'rh', 'autre']),
  amount: z.coerce.number().int().positive('Le montant doit être supérieur à 0.'),
  date: z.string().min(1, 'La date est obligatoire.'),
});

/* ------------------------------------------------- contenu pédagogique */

export const uploadedFileSchema = z.object({
  name: z.string().min(1),
  size: z.number().int().positive(),
  mimeType: z.string().min(1),
  dataUrl: z.string(),
  uploadedAt: z.string().min(1),
});

/**
 * Une ressource doit porter son SUPPORT, pas seulement un titre et un type.
 * Les exigences varient selon le type : un podcast sans fichier audio ou un
 * examen blanc sans sujet n'ont aucun sens pour l'élève, et sont refusés ici.
 */
export const contentResourceSchema = z
  .object({
    title: z.string().trim().min(3, 'Le titre doit comporter au moins 3 caractères.'),
    subtitle: z.string().trim().max(120, 'Le sous-titre est limité à 120 caractères.').optional().default(''),
    body: z.string().trim().optional().default(''),
    section: z.enum(CONTENT_SECTION_VALUES),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1']),
    type: z.enum(CONTENT_TYPE_VALUES),
    file: uploadedFileSchema.nullable().optional().default(null),
    cover: uploadedFileSchema.nullable().optional().default(null),
    durationMin: z.coerce.number().int().positive().nullable().optional().default(null),
    premiumOnly: z.boolean().optional().default(false),
  })
  .superRefine((value, ctx) => {
    const def = CONTENT_TYPE_RULES[value.type];
    if (!def) return;
    if (def.fileRequired && !value.file) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Un ${def.label.toLowerCase()} doit être accompagné de son fichier.`,
        path: ['file'],
      });
    }
    if (def.bodyRequired && value.body.trim().length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Décris le contenu en au moins 20 caractères : ce texte est lu par les élèves.',
        path: ['body'],
      });
    }
    if (def.usesDuration && !value.durationMin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Indique la durée en minutes.',
        path: ['durationMin'],
      });
    }
    if (!SECTION_TYPES[value.section]?.includes(value.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Ce type de contenu n'est pas accepté dans cette section.",
        path: ['type'],
      });
    }
  });

export type ContentResourceInput = z.infer<typeof contentResourceSchema>;

/**
 * Publication : l'admin doit avoir vu l'aperçu et coché les confirmations.
 * Le backend refuse la mise en ligne si ce n'est pas le cas — ce n'est pas
 * seulement une contrainte d'interface.
 */
export const publishContentSchema = z.object({
  resourceId: z.string().min(1),
  previewChecked: z.literal(true, {
    message: "Confirme d'abord avoir vérifié l'aperçu dans l'application mobile.",
  }),
  contentChecked: z.literal(true, {
    message: 'Confirme que le contenu et son support sont corrects.',
  }),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(3, 'Nom de campagne trop court.'),
  platform: z.enum(['Facebook', 'Instagram', 'Google Ads', 'TikTok']),
  budget: z.coerce.number().int().positive('Le budget doit être supérieur à 0.'),
  startDate: z.string().min(1, 'Date de début obligatoire.'),
  endDate: z.string().min(1, 'Date de fin obligatoire.'),
});

export const inviteAccessSchema = z.object({
  fullName: z.string().trim().min(3, 'Nom complet obligatoire.'),
  email: z.string().email('Adresse email invalide.'),
  roleLabel: z.string().trim().min(3, 'Intitulé du rôle obligatoire.'),
});

/** Convertit une erreur Zod en AppError à code stable, sans fuite technique. */
export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  value: unknown,
  code = 'VALIDATION_ERROR',
): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new AppError(code, first?.message ?? 'Données invalides.', 400);
  }
  return result.data;
}

/** Erreurs par champ, pour l'affichage immédiat dans un formulaire. */
export function fieldErrors<T extends z.ZodTypeAny>(schema: T, value: unknown): Record<string, string> {
  const result = schema.safeParse(value);
  if (result.success) return {};
  const out: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? '_');
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
