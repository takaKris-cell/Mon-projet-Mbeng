/**
 * Modèle de données applicatif. Les noms de champs suivent le Schéma de base de
 * données et le Manuel backend §2.3 : tout ce qui deviendra une colonne
 * PostgreSQL est nommé ici en camelCase côté TypeScript, et son équivalent
 * snake_case est rappelé en commentaire quand il diffère.
 */

export type GlobalRole = 'eleve' | 'betreuer' | 'commercial' | 'admin' | 'super_admin';

export type PortalScope = 'user' | 'commercial' | 'admin';

/** user_roles */
export interface UserRole {
  userId: string;
  role: GlobalRole;
  /** requires_2fa — contrainte imposée par le backend, pas une option (Manuel §3.3). */
  requires2fa: boolean;
}

/** profiles */
export interface Profile {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  city: string;
  level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1';
  role: GlobalRole;
  /** Code de parrainage par lequel ce compte est arrivé (traçabilité des litiges). */
  registeredVia: string | null;
  createdAt: string;
  lastActiveAt: string;
  subscription: 'gratuit' | 'mensuel' | 'semestriel' | 'annuel';
  status: 'actif' | 'en_attente' | 'suspendu' | 'anonymise';
  isPremium: boolean;
  premiumSince: string | null;
  referralCode: string;
  referralCredits: number;
  referralCount: number;
  countryCode: string;
}

/** agent_profiles */
export interface AgentProfile {
  id: string;
  userId: string;
  fullName: string;
  /** Code d'affiliation officiel. */
  affiliateCode: string;
  zone: string;
  phone: string;
  payoutMethod: 'orange_money' | 'mtn_momo';
  payoutNumber: string;
  backupPayoutNumber: string | null;
  status: 'actif' | 'suspendu';
  /** Statut de validation des commissions par l'administration. */
  commissionStatus: 'pending' | 'approved' | 'paid' | 'rejected';
  avatarInitials: string;
  createdAt: string;
}

/** agent_clients */
export interface AgentClient {
  id: string;
  agentId: string;
  fullName: string;
  phone: string;
  email: string;
  city: string;
  createdAt: string;
  convertedAt: string | null;
  lastActivityAt: string;
  /** agent_clients.conversion_status */
  conversionStatus: 'inscrit' | 'premium' | 'en_cours_de_relance';
  active: boolean;
  /** Montant de l'abonnement souscrit, informatif : la commission reste fixe. */
  subscriptionAmount: number | null;
}

/** payout_requests — Manuel §5.3 */
export interface PayoutRequest {
  id: string;
  requesterType: 'commercial' | 'parrainage';
  requesterId: string;
  requesterName: string;
  amount: number;
  paymentMethod: 'orange_money' | 'mtn_momo';
  paymentNumber: string;
  status: 'pending' | 'paid' | 'rejected';
  requestedAt: string;
  paidAt: string | null;
  paidBy: string | null;
  transactionReference: string | null;
  rejectionReason: string | null;
  /** Manuel §4.3 — aucune opération d'argent sans clé d'idempotence. */
  idempotencyKey: string;
}

/** payment_transactions — encaissements élèves (flux entrant) */
export interface PaymentTransaction {
  id: string;
  transactionRef: string;
  userId: string;
  userName: string;
  amount: number;
  currency: string;
  provider: 'orange' | 'mtn' | 'paypal' | 'card';
  createdAt: string;
  status: 'recu' | 'en_attente' | 'echoue' | 'rembourse';
  product: string;
  idempotencyKey: string;
}

/** referral_credits utilisés pour un Premium — jamais comptés dans le CA (§5.2) */
export interface ReferralRedemption {
  id: string;
  userId: string;
  userName: string;
  date: string;
  creditsUsed: number;
  cashTopUp: number;
  plan: string;
}

/* ------------------------------------------------- contenu pédagogique */

/**
 * Fichier téléversé (audio, PDF, vidéo, image de couverture).
 *
 * Une « ressource » sans support n'en est pas une : l'ancien formulaire
 * demandait un titre, un niveau et un type, sans jamais permettre de joindre
 * le contenu réel. Le fichier fait désormais partie du modèle, et la
 * validation l'exige pour les types qui en dépendent.
 *
 * `dataUrl` est le stockage local de démonstration ; côté Supabase ce champ
 * devient une clé dans le bucket Storage, sans changer le reste du code.
 */
export interface UploadedFile {
  name: string;
  /** Octets. */
  size: number;
  mimeType: string;
  dataUrl: string;
  uploadedAt: string;
}

export const CONTENT_SECTIONS = [
  'bibliotheque',
  'examens',
  'mots_du_jour',
  'par_ou_commencer',
  'pflege',
  'integration',
  'apres_b2',
  'ambassade',
  'emploi',
] as const;
export type ContentSection = (typeof CONTENT_SECTIONS)[number];

export const CONTENT_TYPES = [
  'podcast',
  'video',
  'fiche',
  'livre',
  'modelltest',
  'etape',
  'actualite',
  'mot',
] as const;
export type ContentType = (typeof CONTENT_TYPES)[number];

export type ContentLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1';

/** content_modules / lessons */
export interface ContentResource {
  id: string;
  title: string;
  /** Sous-titre affiché sous le titre dans l'application. */
  subtitle: string;
  /** Texte long : corps d'une fiche, description d'un podcast, consigne d'un examen. */
  body: string;
  section: ContentSection;
  level: ContentLevel;
  type: ContentType;
  /** Support principal : audio, PDF, vidéo… selon le type. */
  file: UploadedFile | null;
  /** Vignette facultative affichée dans la liste mobile. */
  cover: UploadedFile | null;
  /** Durée affichée (podcast, vidéo, examen), en minutes. */
  durationMin: number | null;
  /** Contenu réservé aux abonnés Premium. */
  premiumOnly: boolean;
  status: 'publie' | 'brouillon';
  /** Ordre d'affichage dans la section (croissant). */
  position: number;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  author: string;
}

/** marketing_campaigns */
export interface MarketingCampaign {
  id: string;
  name: string;
  platform: 'Facebook' | 'Instagram' | 'Google Ads' | 'TikTok';
  startDate: string;
  endDate: string;
  budget: number;
  clicks: number;
  signups: number;
  costPerSignup: number;
  status: 'en_cours' | 'terminee' | 'arretee';
}

/** charges */
export interface Charge {
  id: string;
  label: string;
  category: 'infrastructure' | 'marketing' | 'physique' | 'rh' | 'autre';
  amount: number;
  date: string;
  createdBy: string;
}

/** admin_permissions — accès délégué par section (Manuel §6) */
export const ADMIN_SECTIONS = [
  'tableau_de_bord',
  'commerciaux',
  'utilisateurs',
  'comptabilite',
  'paiements',
  'cms',
  'marketing',
  'charges',
  'acces_roles',
  'parametres',
] as const;

export type AdminSection = (typeof ADMIN_SECTIONS)[number];

export const ADMIN_SECTION_LABELS: Record<AdminSection, string> = {
  tableau_de_bord: 'Tableau de bord',
  commerciaux: 'Commerciaux',
  utilisateurs: 'Utilisateurs',
  comptabilite: 'Comptabilité',
  paiements: 'Paiements',
  cms: 'Contenu (CMS)',
  marketing: 'Marketing',
  charges: 'Charges',
  acces_roles: 'Accès & rôles',
  parametres: 'Paramètres',
};

export type PermissionLevel = 'aucun' | 'lecture' | 'ecriture';

export interface AdminAccess {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  roleLabel: string;
  permissions: Partial<Record<AdminSection, PermissionLevel>>;
  /** Manuel §3.3 : obligatoire dès qu'une section financière est accessible. */
  requires2fa: boolean;
  twoFactorActive: boolean;
  status: 'invited' | 'active' | 'revoked';
  grantedBy: string;
  grantedAt: string;
}

/** audit_log — Manuel §7 */
export interface AuditLogEntry {
  id: string;
  actorId: string;
  actorName: string;
  portal: PortalScope;
  /** ex. 'payout.marked_paid', 'payment_number.updated' */
  action: string;
  targetTable: string | null;
  targetId: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ApiKeyRecord {
  id: string;
  label: string;
  provider: string;
  maskedKey: string;
  createdAt: string;
  lastRotatedAt: string;
  status: 'active' | 'revoked';
}

export interface SystemSettings {
  supportEmail: string;
  whatsappBusinessNumber: string;
  currency: string;
  secondaryCurrency: string;
  require2faForFinance: boolean;
  otpPrimaryChannel: 'whatsapp' | 'sms';
  otpFallbackChannel: 'sms' | 'aucun';
  notifyOnPayoutRequest: boolean;
  notifyOnActiveUsersDrop: boolean;
  notifyOnNewAccessRequest: boolean;
  weeklyDigestByEmail: boolean;
}

export interface Paginated<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}
