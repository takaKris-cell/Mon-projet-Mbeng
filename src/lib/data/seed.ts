/**
 * Jeu de données de démonstration.
 *
 * Deux principes :
 *  1. Tout est généré RELATIVEMENT à l'instant courant — l'application ne doit
 *     jamais donner l'impression d'une maquette figée sur une date morte.
 *  2. Les volumes annoncés correspondent au nombre de lignes réellement
 *     présentes : un total affiché renvoie toujours à des données accessibles
 *     (audit §3.4, Manuel §9.3). 4 812 utilisateurs = 4 812 lignes paginables.
 *
 * C'est le SEUL endroit où vivent des données fictives. Aucun écran ne contient
 * de contenu codé en dur : tout passe par lib/api.
 */
import {
  AGENT_CONVERSION_BONUS,
  AGENT_SIGNUP_BONUS,
  REFERRAL_CONVERSION_BONUS,
} from '../business/constants';
import type { MonthlyLedgerRow } from '../business/accounting';
import type {
  AdminAccess,
  AgentClient,
  AgentProfile,
  ApiKeyRecord,
  AuditLogEntry,
  Charge,
  ContentResource,
  MarketingCampaign,
  PaymentTransaction,
  PayoutRequest,
  Profile,
  ReferralRedemption,
  SystemSettings,
  UploadedFile,
} from './types';

/* ------------------------------------------------------------------ outils */

/** PRNG déterministe : le jeu de données est identique d'un rechargement à l'autre. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260927);

const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];
const between = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));

export const NOW = new Date();

const DAY = 24 * 3600 * 1000;
const daysAgo = (d: number, hourJitter = true) => {
  const date = new Date(NOW.getTime() - d * DAY);
  if (hourJitter) date.setHours(between(7, 21), between(0, 59), 0, 0);
  return date.toISOString();
};

/** Début de la semaine comptable en cours (dernier samedi 16 h révolu). */
function startOfCurrentAccountingWeek(): Date {
  const end = new Date(NOW);
  end.setHours(16, 0, 0, 0);
  while (end.getDay() !== 6 || end.getTime() <= NOW.getTime()) {
    end.setDate(end.getDate() + 1);
    end.setHours(16, 0, 0, 0);
  }
  const start = new Date(end);
  start.setDate(start.getDate() - 7);
  return start;
}

const WEEK_START = startOfCurrentAccountingWeek();

/** Une date au hasard DANS la semaine comptable courante. */
function inCurrentWeek(): string {
  const span = Math.max(1, NOW.getTime() - WEEK_START.getTime() - 3600_000);
  return new Date(WEEK_START.getTime() + Math.floor(rand() * span)).toISOString();
}

/** Une date au hasard AVANT la semaine comptable courante. */
function beforeCurrentWeek(minWeeks = 1, maxWeeks = 10): string {
  const weeks = between(minWeeks, maxWeeks);
  return new Date(WEEK_START.getTime() - weeks * 7 * DAY - Math.floor(rand() * 5 * DAY)).toISOString();
}

/* ------------------------------------------------------------- vocabulaire */

const FIRST_NAMES = [
  'Awa', 'Brice', 'Nadège', 'Junior', 'Solange', 'Carine', 'Patrick', 'Estelle', 'Yannick',
  'Rodrigue', 'Priscille', 'Aïcha', 'Bertrand', 'Delphine', 'Marceline', 'Serge', 'Chantal',
  'Hervé', 'Odile', 'Vanessa', 'Stanislas', 'Dimitri', 'Léonie', 'Armand', 'Berthe', 'Cédric',
  'Jeanne', 'Roland', 'Sandrine', 'Thierry', 'Mireille', 'Ghislain', 'Laure', 'Boris', 'Clarisse',
  'Franck', 'Nadia', 'Olivier', 'Sylvie', 'Ulrich',
] as const;

const LAST_NAMES = [
  'Nkeng', 'Tchoun', 'Kamche', 'Essomba', 'Fotso', 'Mbida', 'Njoya', 'Biya', 'Mveng', 'Talla',
  'Ngoma', 'Souley', 'Ngassa', 'Onana', 'Ateba', 'Fomekong', 'Buo', 'Tolla', 'Mbeng', 'Nguini',
  'Edzoa', 'Manga', 'Ekwalla', 'Nkodo', 'Bekolo', 'Etoundi', 'Abena', 'Ndongo', 'Ewane', 'Tabi',
] as const;

const CITIES = [
  'Douala — Akwa', 'Douala — Bonamoussadi', 'Douala — Bonapriso', 'Douala — Deïdo',
  'Yaoundé — Bastos', 'Yaoundé — Mvan', 'Yaoundé — Nsam', 'Bafoussam', 'Garoua', 'Buea',
  'Kribi', 'Limbé', 'Dschang', 'Ngaoundéré',
] as const;

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1'] as const;

const fullName = () => `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
const phone = () => `+2376${between(50, 99)}${String(between(100000, 999999))}`;
const emailOf = (name: string, i: number) =>
  `${name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z]+/g, '.')}${i}@example.cm`;

const initialsOf = (name: string) =>
  name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();

/* ------------------------------------------------------- comptabilité (§3.1) */

const MONTH_FIGURES = [
  { gross: 480_000, agents: 62_000, referral: 8_000, charges: 120_000 },
  { gross: 640_000, agents: 84_000, referral: 10_000, charges: 155_000 },
  { gross: 780_000, agents: 108_000, referral: 12_000, charges: 190_000 },
  { gross: 960_000, agents: 140_000, referral: 16_000, charges: 235_000 },
  { gross: 1_180_000, agents: 168_000, referral: 20_000, charges: 280_000 },
  { gross: 1_320_000, agents: 208_000, referral: 24_000, charges: 340_000 },
  { gross: 1_400_000, agents: 348_000, referral: 32_000, charges: 390_000 },
  { gross: 3_240_000, agents: 545_300, referral: 66_700, charges: 690_000 },
];

/**
 * Cumul attendu : 10 000 000 brut − 1 852 000 reversés − 2 400 000 de charges
 * = 5 748 000 de bénéfice net. L'invariant est vérifié à chaque calcul par
 * assertAccountingCoherence(), et par un test unitaire dédié.
 */
export const MONTHLY_LEDGER: MonthlyLedgerRow[] = MONTH_FIGURES.map((f, i) => {
  const d = new Date(NOW.getFullYear(), NOW.getMonth() - (MONTH_FIGURES.length - 1 - i), 1);
  return {
    month: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    label: d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }),
    grossRevenue: f.gross,
    agentCommissions: f.agents,
    referralPayouts: f.referral,
    charges: f.charges,
  };
});

/* ------------------------------------------------------------- utilisateurs */

const TOTAL_USERS = 4812;
const PREMIUM_USERS = 674;

export const profiles: Profile[] = [];

/** Compte élève de démonstration, connectable depuis le portail Utilisateur. */
export const DEMO_STUDENT: Profile = {
  id: 'usr_awa',
  fullName: 'Awa Nkeng',
  email: 'awa.nkeng@example.cm',
  phone: '+237699456128',
  city: 'Douala — Bonamoussadi',
  level: 'B1',
  role: 'eleve',
  registeredVia: 'MVG-2026',
  createdAt: daysAgo(46),
  lastActiveAt: daysAgo(0),
  subscription: 'gratuit',
  status: 'actif',
  isPremium: false,
  premiumSince: null,
  referralCode: 'AWA2026',
  referralCredits: 1800,
  referralCount: 14,
  countryCode: 'CM',
};
profiles.push(DEMO_STUDENT);

const AGENT_COUNT = 24;
export const agentProfiles: AgentProfile[] = [];

const ZONES = [
  'Douala — Akwa', 'Douala — Bonamoussadi', 'Douala — Deïdo', 'Yaoundé — Bastos',
  'Yaoundé — Mvan', 'Bafoussam', 'Garoua', 'Buea', 'Kribi', 'Limbé', 'Dschang', 'Ngaoundéré',
] as const;

/** Agent de démonstration, connectable depuis l'Espace Commercial. */
const JEAN_ID = 'agt_jean';
const JEAN_USER_ID = 'usr_jean';

profiles.push({
  id: JEAN_USER_ID,
  fullName: 'Jean Mveng',
  email: 'jean.mveng@example.cm',
  phone: '+237690127734',
  city: 'Douala — Akwa',
  level: 'B2',
  role: 'commercial',
  registeredVia: null,
  createdAt: daysAgo(104),
  lastActiveAt: daysAgo(0),
  subscription: 'gratuit',
  status: 'actif',
  isPremium: false,
  premiumSince: null,
  referralCode: 'MVG-2026',
  referralCredits: 0,
  referralCount: 0,
  countryCode: 'CM',
});

agentProfiles.push({
  id: JEAN_ID,
  userId: JEAN_USER_ID,
  fullName: 'Jean Mveng',
  affiliateCode: 'MVG-2026',
  zone: 'Douala — Akwa',
  phone: '+237690127734',
  payoutMethod: 'orange_money',
  payoutNumber: '+237690457780',
  backupPayoutNumber: '+237671229014',
  status: 'actif',
  commissionStatus: 'approved',
  avatarInitials: 'JM',
  createdAt: daysAgo(104),
});

for (let i = 1; i < AGENT_COUNT; i++) {
  const name = fullName();
  const userId = `usr_agt_${i}`;
  const code = `${name.split(' ')[1].slice(0, 3).toUpperCase()}-${between(1000, 9999)}`;
  profiles.push({
    id: userId,
    fullName: name,
    email: emailOf(name, i),
    phone: phone(),
    city: pick(ZONES),
    level: pick(['B1', 'B2', 'C1'] as const),
    role: 'commercial',
    registeredVia: null,
    createdAt: daysAgo(between(30, 180)),
    lastActiveAt: daysAgo(between(0, 6)),
    subscription: 'gratuit',
    status: 'actif',
    isPremium: false,
    premiumSince: null,
    referralCode: code,
    referralCredits: 0,
    referralCount: 0,
    countryCode: 'CM',
  });
  agentProfiles.push({
    id: `agt_${i}`,
    userId,
    fullName: name,
    affiliateCode: code,
    zone: pick(ZONES),
    phone: phone(),
    payoutMethod: rand() > 0.45 ? 'orange_money' : 'mtn_momo',
    payoutNumber: phone(),
    backupPayoutNumber: rand() > 0.5 ? phone() : null,
    status: rand() > 0.08 ? 'actif' : 'suspendu',
    commissionStatus: pick(['pending', 'approved', 'paid'] as const),
    avatarInitials: initialsOf(name),
    createdAt: daysAgo(between(30, 180)),
  });
}

/* ------------------------------------------------------ clients des agents */

export const agentClients: AgentClient[] = [];

function pushClient(agentId: string, opts: { createdAt: string; convertedAt: string | null; active: boolean }) {
  const name = fullName();
  const id = `acl_${agentClients.length + 1}`;
  agentClients.push({
    id,
    agentId,
    fullName: name,
    phone: phone(),
    email: emailOf(name, agentClients.length + 1),
    city: pick(CITIES),
    createdAt: opts.createdAt,
    convertedAt: opts.convertedAt,
    lastActivityAt: opts.active ? daysAgo(between(0, 4)) : daysAgo(between(12, 60)),
    conversionStatus: opts.convertedAt ? 'premium' : opts.active ? 'inscrit' : 'en_cours_de_relance',
    active: opts.active,
    subscriptionAmount: opts.convertedAt ? pick([1000, 5000, 10000] as const) : null,
  });
}

/**
 * Portefeuille de Jean Mveng — calibré pour démontrer les DEUX états de seuil :
 *  • 13 comptes créés cette semaine et actifs .......... 13 × 200 = 2 600 F
 *  • dont 8 passés Premium dans la même semaine ......... 8 × 300 = 2 400 F
 *    → cagnotte « gains de la semaine » = 5 000 F → seuil ATTEINT
 *  • 5 comptes créés une semaine antérieure, passés Premium cette semaine
 *    → cagnotte « conversions différées » = 1 500 F → EN COURS
 *  18 clients au total, et la page « Mes clients » en affiche bien 18.
 */
for (let i = 0; i < 13; i++) {
  pushClient(JEAN_ID, {
    createdAt: inCurrentWeek(),
    convertedAt: i < 8 ? inCurrentWeek() : null,
    active: true,
  });
}
for (let i = 0; i < 5; i++) {
  pushClient(JEAN_ID, { createdAt: beforeCurrentWeek(), convertedAt: inCurrentWeek(), active: true });
}

// Portefeuilles des 23 autres agents : volumes et seuils variés.
for (let a = 1; a < AGENT_COUNT; a++) {
  const agentId = `agt_${a}`;
  const weeklySignups = between(2, 16);
  const weeklyConversions = between(0, Math.min(weeklySignups, 9));
  const deferredConversions = between(0, 8);
  const stale = between(1, 9);

  for (let i = 0; i < weeklySignups; i++) {
    pushClient(agentId, {
      createdAt: inCurrentWeek(),
      convertedAt: i < weeklyConversions ? inCurrentWeek() : null,
      active: true,
    });
  }
  for (let i = 0; i < deferredConversions; i++) {
    pushClient(agentId, { createdAt: beforeCurrentWeek(), convertedAt: inCurrentWeek(), active: true });
  }
  for (let i = 0; i < stale; i++) {
    pushClient(agentId, { createdAt: beforeCurrentWeek(2, 14), convertedAt: null, active: false });
  }
}

/* ------------------------------------- population élèves (4 812 au total) */

const agentCodes = agentProfiles.map((a) => a.affiliateCode);

for (let i = profiles.length; i < TOTAL_USERS; i++) {
  const name = fullName();
  const createdDays = between(0, 210);
  const isPremium = profiles.filter((p) => p.isPremium).length < PREMIUM_USERS && rand() < 0.16;
  const isBetreuer = rand() < 0.035;
  const lastActive = rand() < 0.66 ? between(0, 29) : between(30, 90);
  profiles.push({
    id: `usr_${i}`,
    fullName: name,
    email: emailOf(name, i),
    phone: phone(),
    city: pick(CITIES),
    level: pick(LEVELS),
    role: isBetreuer ? 'betreuer' : 'eleve',
    registeredVia: rand() < 0.42 ? pick(agentCodes) : rand() < 0.2 ? 'AWA2026' : null,
    createdAt: daysAgo(createdDays),
    lastActiveAt: daysAgo(Math.min(lastActive, createdDays)),
    subscription: isPremium ? pick(['mensuel', 'semestriel', 'annuel'] as const) : 'gratuit',
    status: rand() < 0.965 ? 'actif' : 'en_attente',
    isPremium,
    premiumSince: isPremium ? daysAgo(between(0, Math.max(1, createdDays))) : null,
    referralCode: `${name.split(' ')[0].toUpperCase().slice(0, 4)}${between(1000, 9999)}`,
    referralCredits: rand() < 0.25 ? between(300, 4200) : 0,
    referralCount: rand() < 0.25 ? between(1, 18) : 0,
    countryCode: rand() < 0.93 ? 'CM' : pick(['GA', 'CI', 'SN', 'CD', 'TG'] as const),
  });
}

/* ------------------------------------------ demandes de virement (§5.3) */

export const payoutRequests: PayoutRequest[] = [];

const ADMIN_ID = 'usr_admin';

function pushPayout(p: Omit<PayoutRequest, 'id' | 'idempotencyKey'>) {
  const id = `pyr_${payoutRequests.length + 1}`;
  payoutRequests.push({ ...p, id, idempotencyKey: `seed-${id}` });
}

// Quelques demandes déjà en file, pour que l'écran Admin ne soit jamais vide.
for (let i = 1; i <= 6; i++) {
  const agent = agentProfiles[i];
  pushPayout({
    requesterType: 'commercial',
    requesterId: agent.id,
    requesterName: agent.fullName,
    amount: between(10, 34) * 500,
    paymentMethod: agent.payoutMethod,
    paymentNumber: agent.payoutNumber,
    status: 'pending',
    requestedAt: daysAgo(between(0, 2)),
    paidAt: null,
    paidBy: null,
    transactionReference: null,
    rejectionReason: null,
  });
}
for (let i = 7; i <= 13; i++) {
  const agent = agentProfiles[i];
  pushPayout({
    requesterType: 'commercial',
    requesterId: agent.id,
    requesterName: agent.fullName,
    amount: between(10, 30) * 500,
    paymentMethod: agent.payoutMethod,
    paymentNumber: agent.payoutNumber,
    status: 'paid',
    requestedAt: daysAgo(between(7, 20)),
    paidAt: daysAgo(between(5, 6)),
    paidBy: ADMIN_ID,
    transactionReference: `OM-${between(100000, 999999)}`,
    rejectionReason: null,
  });
}
pushPayout({
  requesterType: 'parrainage',
  requesterId: DEMO_STUDENT.id,
  requesterName: DEMO_STUDENT.fullName,
  amount: 3000,
  paymentMethod: 'orange_money',
  paymentNumber: DEMO_STUDENT.phone,
  status: 'pending',
  requestedAt: daysAgo(1),
  paidAt: null,
  paidBy: null,
  transactionReference: null,
  rejectionReason: null,
});
pushPayout({
  requesterType: 'commercial',
  requesterId: agentProfiles[14].id,
  requesterName: agentProfiles[14].fullName,
  amount: 6500,
  paymentMethod: 'mtn_momo',
  paymentNumber: agentProfiles[14].payoutNumber,
  status: 'rejected',
  requestedAt: daysAgo(9),
  paidAt: null,
  paidBy: ADMIN_ID,
  transactionReference: null,
  rejectionReason: 'Numéro MTN inactif — le titulaire doit d’abord réactiver son compte MoMo.',
});

/* --------------------------------------- encaissements élèves (entrants) */

const PRODUCTS = [
  { label: 'Abonnement Mensuel', price: 1000 },
  { label: 'Pack 6 mois', price: 5000 },
  { label: 'Pass Annuel', price: 10000 },
  { label: 'Séance Betreuer', price: 9000 },
  { label: 'Réservation examen Goethe B1', price: 5000 },
] as const;

export const paymentTransactions: PaymentTransaction[] = [];
for (let i = 1; i <= 186; i++) {
  const p = profiles[between(1, profiles.length - 1)];
  const product = pick(PRODUCTS);
  const r = rand();
  paymentTransactions.push({
    id: `tx_${i}`,
    transactionRef: `TX-${between(10000, 99999)}`,
    userId: p.id,
    userName: p.fullName,
    amount: product.price,
    currency: 'FCFA',
    provider: pick(['orange', 'mtn', 'paypal', 'card'] as const),
    createdAt: daysAgo(between(0, 45)),
    status: r < 0.87 ? 'recu' : r < 0.94 ? 'en_attente' : r < 0.98 ? 'echoue' : 'rembourse',
    product: product.label,
    idempotencyKey: `seed-tx-${i}`,
  });
}
paymentTransactions.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

/* ------------------- crédits parrainage utilisés pour Premium (§5.2) */

export const referralRedemptions: ReferralRedemption[] = [];
for (let i = 1; i <= 12; i++) {
  const p = profiles[between(1, profiles.length - 1)];
  const credits = between(2, 8) * REFERRAL_CONVERSION_BONUS;
  const plan = pick(PRODUCTS.slice(0, 3));
  referralRedemptions.push({
    id: `rrd_${i}`,
    userId: p.id,
    userName: p.fullName,
    date: daysAgo(between(1, 40)),
    creditsUsed: Math.min(credits, plan.price),
    cashTopUp: Math.max(0, plan.price - credits),
    plan: plan.label,
  });
}

/* --------------------------------------------------------------- contenus */

/**
 * Ressources pédagogiques réellement complètes : chacune porte son support,
 * son sous-titre, son corps de texte et sa position dans la section. C'est ce
 * que l'aperçu mobile du CMS restitue à l'identique.
 */
type SeedResource = Omit<ContentResource, 'id' | 'position' | 'createdAt' | 'updatedAt' | 'publishedAt' | 'author' | 'cover'>
  & { ageDays: number };

/** Support fictif : mêmes métadonnées qu'un vrai téléversement, sans octets. */
function stubFile(name: string, mimeType: string, sizeKo: number, ageDays: number): UploadedFile {
  return {
    name,
    size: sizeKo * 1024,
    mimeType,
    dataUrl: '',
    uploadedAt: daysAgo(ageDays),
  };
}

const SEED_RESOURCES: SeedResource[] = [
  {
    title: 'Alltag: Beim Arzt',
    subtitle: 'Consultation chez le médecin — dialogue lent',
    body: 'Dialogue complet entre un patient et son médecin généraliste, lu à vitesse réduite. Transcription allemande et traduction française fournies phrase par phrase.',
    section: 'bibliotheque', level: 'A2', type: 'podcast',
    file: stubFile('alltag-beim-arzt.mp3', 'audio/mpeg', 5120, 12),
    durationMin: 6, premiumOnly: false, status: 'publie', ageDays: 12,
  },
  {
    title: 'Nachrichten in einfacher Sprache',
    subtitle: 'Actualités allemandes en langue simplifiée',
    body: 'Le journal de la semaine, lu lentement, sur l’immigration qualifiée et les métiers du soin. Idéal pour travailler la compréhension orale au niveau B1.',
    section: 'bibliotheque', level: 'B1', type: 'podcast',
    file: stubFile('nachrichten-einfache-sprache.mp3', 'audio/mpeg', 3840, 4),
    durationMin: 4, premiumOnly: false, status: 'publie', ageDays: 4,
  },
  {
    title: 'Grammatik kompakt — Konjunktiv II',
    subtitle: 'Fiche de grammaire : le conditionnel allemand',
    body: 'Formation, emplois et pièges du Konjunktiv II. Chaque règle est suivie de trois exemples tirés d’annales Goethe B1 et B2.',
    section: 'bibliotheque', level: 'B2', type: 'fiche',
    file: stubFile('konjunktiv-2.pdf', 'application/pdf', 740, 22),
    durationMin: null, premiumOnly: false, status: 'publie', ageDays: 22,
  },
  {
    title: 'Wortschatz Alltag',
    subtitle: '300 mots du quotidien, classés par situation',
    body: 'Courses, transports, logement, administration : le vocabulaire minimal pour les trois premiers mois en Allemagne.',
    section: 'bibliotheque', level: 'A1', type: 'livre',
    file: stubFile('wortschatz-alltag.pdf', 'application/pdf', 2200, 30),
    durationMin: null, premiumOnly: false, status: 'publie', ageDays: 30,
  },
  {
    title: 'Sprechen: Sich vorstellen',
    subtitle: 'Se présenter à l’oral sans blocage',
    body: 'Structure type d’une présentation orale de deux minutes, avec les formules attendues par les examinateurs et les erreurs les plus pénalisées.',
    section: 'bibliotheque', level: 'B1', type: 'video',
    file: stubFile('sich-vorstellen.mp4', 'video/mp4', 7800, 18),
    durationMin: 9, premiumOnly: true, status: 'publie', ageDays: 18,
  },
  {
    title: 'Schreiben — Bewerbungsbrief',
    subtitle: 'Modèle de lettre de motivation commentée',
    body: 'Lettre complète pour une candidature en Ausbildung, annotée paragraphe par paragraphe, avec les variantes acceptées.',
    section: 'bibliotheque', level: 'B2', type: 'fiche',
    file: stubFile('bewerbungsbrief.pdf', 'application/pdf', 560, 36),
    durationMin: null, premiumOnly: true, status: 'brouillon', ageDays: 36,
  },

  {
    title: 'Modelltest 3 — Lesen',
    subtitle: 'Goethe-Zertifikat B1 · module Lesen',
    body: 'Épreuve de compréhension écrite en conditions réelles : 5 parties, 30 questions. Corrigé détaillé disponible à la fin du test.',
    section: 'examens', level: 'B1', type: 'modelltest',
    file: stubFile('modelltest-3-lesen.pdf', 'application/pdf', 1800, 3),
    durationMin: 65, premiumOnly: true, status: 'publie', ageDays: 3,
  },
  {
    title: 'Modelltest 5 — Schreiben',
    subtitle: 'telc Deutsch A2 · module Schreiben',
    body: 'Deux tâches de production écrite avec grille d’évaluation officielle et exemples de copies notées.',
    section: 'examens', level: 'A2', type: 'modelltest',
    file: stubFile('modelltest-5-schreiben.pdf', 'application/pdf', 1450, 15),
    durationMin: 30, premiumOnly: true, status: 'brouillon', ageDays: 15,
  },
  {
    title: 'Hören Übung 12 — Am Bahnhof',
    subtitle: 'ÖSD B1 · compréhension orale',
    body: 'Annonces de gare, dialogues au guichet et conversations courtes. Fichier audio intégré au sujet.',
    section: 'examens', level: 'B1', type: 'modelltest',
    file: stubFile('hoeren-uebung-12.zip', 'application/zip', 6400, 8),
    durationMin: 25, premiumOnly: true, status: 'publie', ageDays: 8,
  },

  {
    title: 'die Erfahrung',
    subtitle: "l'expérience (vécue) — nom féminin",
    body: 'Sie hat viel Erfahrung im Verkauf. — Elle a beaucoup d’expérience dans la vente.',
    section: 'mots_du_jour', level: 'B1', type: 'mot',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 0,
  },
  {
    title: 'sich bewerben',
    subtitle: 'postuler, faire acte de candidature — verbe réfléchi',
    body: 'Ich möchte mich für die Stelle bewerben. — Je souhaite postuler pour ce poste.',
    section: 'mots_du_jour', level: 'B1', type: 'mot',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 0,
  },
  {
    title: 'dringend',
    subtitle: 'urgent, urgemment — adjectif et adverbe',
    body: 'Das ist eine dringende Angelegenheit. — C’est une affaire urgente.',
    section: 'mots_du_jour', level: 'A2', type: 'mot',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 0,
  },

  {
    title: 'Traduire ses diplômes et documents',
    subtitle: 'Étape 1 — traducteur assermenté',
    body: 'La plupart des administrations et employeurs allemands exigent une traduction assermentée. Cette étape explique où trouver un traducteur reconnu et quels documents préparer en priorité.',
    section: 'par_ou_commencer', level: 'A1', type: 'etape',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 40,
  },
  {
    title: 'Trouver un vrai stage pratique',
    subtitle: 'Étape 2 — attestation de stage',
    body: 'Comment identifier un établissement qui délivre une attestation reconnue, et comment éviter les intermédiaires payants qui ne garantissent rien.',
    section: 'par_ou_commencer', level: 'A1', type: 'etape',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 40,
  },
  {
    title: 'Réussir son Vorstellungsgespräch',
    subtitle: 'Étape 4 — entretien d’embauche',
    body: 'Les douze questions posées dans presque tous les entretiens allemands, et la manière d’y répondre sans réciter.',
    section: 'par_ou_commencer', level: 'B1', type: 'etape',
    file: stubFile('vorstellungsgespraech.pdf', 'application/pdf', 820, 28),
    durationMin: null, premiumOnly: true, status: 'publie', ageDays: 28,
  },

  {
    title: 'Pflege: Übergabe am Bett',
    subtitle: 'La transmission au lit du patient',
    body: 'Vocabulaire et formulations de la transmission entre équipes, avec l’ordre attendu des informations en service de gériatrie.',
    section: 'pflege', level: 'B2', type: 'fiche',
    file: stubFile('uebergabe-am-bett.pdf', 'application/pdf', 940, 20),
    durationMin: null, premiumOnly: true, status: 'publie', ageDays: 20,
  },
  {
    title: 'Vorstellungsgespräch Klinik',
    subtitle: 'Entretien en clinique — simulation filmée',
    body: 'Simulation complète d’un entretien pour un poste de Pflegefachkraft, avec les réponses attendues sur les horaires, les gestes et l’équipe.',
    section: 'pflege', level: 'B2', type: 'video',
    file: stubFile('vorstellungsgespraech-klinik.mp4', 'video/mp4', 7900, 14),
    durationMin: 12, premiumOnly: true, status: 'publie', ageDays: 14,
  },

  {
    title: 'Anmeldung Schritt für Schritt',
    subtitle: 'Déclarer son domicile en Allemagne',
    body: 'Où prendre rendez-vous, quels papiers apporter, et le délai légal à ne pas dépasser après l’arrivée.',
    section: 'integration', level: 'A2', type: 'fiche',
    file: stubFile('anmeldung.pdf', 'application/pdf', 680, 26),
    durationMin: null, premiumOnly: false, status: 'publie', ageDays: 26,
  },
  {
    title: 'Wohnungssuche ohne Betrug',
    subtitle: 'Chercher un logement sans se faire arnaquer',
    body: 'Les cinq signaux d’une annonce frauduleuse, les plateformes fiables, et ce qu’il ne faut jamais payer avant d’avoir visité.',
    section: 'integration', level: 'A2', type: 'fiche',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 33,
  },
  {
    title: 'Deutschlandticket erklärt',
    subtitle: 'Se déplacer pour 49 € par mois',
    body: 'Ce que couvre l’abonnement, comment le souscrire sans compte bancaire allemand, et les tarifs réduits pour apprentis et étudiants.',
    section: 'integration', level: 'A1', type: 'fiche',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 2,
  },

  {
    title: 'Ausbildung vs Studium',
    subtitle: 'Choisir sa voie après le B2',
    body: 'Comparatif honnête : durée, rémunération, conditions d’admission et débouchés réels de chaque voie.',
    section: 'apres_b2', level: 'B2', type: 'fiche',
    file: stubFile('ausbildung-vs-studium.pdf', 'application/pdf', 1100, 7),
    durationMin: null, premiumOnly: false, status: 'publie', ageDays: 7,
  },

  {
    title: 'VFS Global — check-list du dossier',
    subtitle: 'Tous les documents à réunir avant le rendez-vous',
    body: 'Formulaire, passeport, photos, justificatifs, contrat, preuve de financement, assurance : la liste exacte, dans l’ordre demandé au guichet.',
    section: 'ambassade', level: 'B1', type: 'fiche',
    file: stubFile('vfs-checklist.pdf', 'application/pdf', 480, 11),
    durationMin: null, premiumOnly: true, status: 'publie', ageDays: 11,
  },
  {
    title: 'Délais de rendez-vous allongés',
    subtitle: 'Mise à jour du 12 du mois',
    body: 'Le délai moyen d’obtention d’un créneau à Yaoundé passe de 3 à 7 semaines. Anticipez la prise de rendez-vous avant la signature du contrat.',
    section: 'ambassade', level: 'A1', type: 'actualite',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 5,
  },

  {
    title: 'Trouver un contrat de travail',
    subtitle: 'Où chercher, et comment être rappelé',
    body: 'Les portails d’emploi allemands qui recrutent réellement à l’international, et la façon de formuler une candidature spontanée.',
    section: 'emploi', level: 'B1', type: 'fiche',
    file: null, durationMin: null, premiumOnly: false, status: 'publie', ageDays: 9,
  },
];

const positionBySection = new Map<string, number>();

export const contentResources: ContentResource[] = SEED_RESOURCES.map((r, i) => {
  const position = (positionBySection.get(r.section) ?? 0) + 1;
  positionBySection.set(r.section, position);
  const { ageDays, ...rest } = r;
  return {
    id: `cnt_${i + 1}`,
    ...rest,
    cover: null,
    position,
    createdAt: daysAgo(ageDays + between(1, 10)),
    updatedAt: daysAgo(ageDays),
    publishedAt: rest.status === 'publie' ? daysAgo(ageDays) : null,
    author: 'Responsable pédagogique',
  };
});

/* ------------------------------------------------------------- campagnes */

const CAMPAIGN_NAMES = [
  'Lancement B1/B2', 'Vidéo témoignages', 'Ausbildung & Studium', 'Formation Pflege',
  'Relance parrainage', 'Rentrée Goethe', 'Retargeting Douala',
] as const;

export const marketingCampaigns: MarketingCampaign[] = CAMPAIGN_NAMES.map((name, i) => {
  const budget = between(30, 130) * 1000;
  const clicks = between(80, 620);
  const signups = between(20, Math.max(21, Math.floor(clicks * 0.45)));
  return {
    id: `cmp_${i + 1}`,
    name,
    platform: pick(['Facebook', 'Instagram', 'Google Ads', 'TikTok'] as const),
    startDate: daysAgo(between(20, 60)),
    endDate: daysAgo(between(0, 15)),
    budget,
    clicks,
    signups,
    costPerSignup: Math.round(budget / signups),
    status: pick(['en_cours', 'terminee', 'arretee'] as const),
  };
});

/* --------------------------------------------------------------- charges */

const CHARGE_TEMPLATES = [
  { label: 'Hébergement cloud (serveurs)', category: 'infrastructure' as const, amount: 28000 },
  { label: 'Nom de domaine + renouvellement annuel', category: 'infrastructure' as const, amount: 17000 },
  { label: 'Campagnes Facebook & Instagram', category: 'marketing' as const, amount: 380000 },
  { label: 'Roll-up + kakémonos salon étudiant', category: 'physique' as const, amount: 86000 },
  { label: '2 ordinateurs portables (équipe support)', category: 'physique' as const, amount: 140000 },
  { label: 'Séminaire formation commerciaux Douala', category: 'rh' as const, amount: 39000 },
];

export const charges: Charge[] = [];
let chargeIndex = 0;
for (const m of MONTHLY_LEDGER) {
  // Les charges individuelles d'un mois somment exactement le total du mois.
  let remaining = m.charges;
  const count = between(3, CHARGE_TEMPLATES.length);
  for (let i = 0; i < count; i++) {
    const t = CHARGE_TEMPLATES[i % CHARGE_TEMPLATES.length];
    const isLast = i === count - 1;
    const amount = isLast ? remaining : Math.min(remaining - (count - i - 1) * 1000, Math.round(remaining / (count - i)));
    remaining -= amount;
    chargeIndex += 1;
    charges.push({
      id: `chg_${chargeIndex}`,
      label: t.label,
      category: t.category,
      amount,
      date: `${m.month}-${String(between(2, 27)).padStart(2, '0')}T10:00:00.000Z`,
      createdBy: 'Super Admin',
    });
  }
}

/* ------------------------------------------------------- accès délégués */

export const adminAccesses: AdminAccess[] = [
  {
    id: 'acc_1',
    userId: ADMIN_ID,
    fullName: 'Super Administrateur',
    email: 'admin@monprojetmbeng.com',
    roleLabel: 'Root / Owner',
    permissions: {
      tableau_de_bord: 'ecriture', commerciaux: 'ecriture', utilisateurs: 'ecriture',
      comptabilite: 'ecriture', paiements: 'ecriture', cms: 'ecriture', marketing: 'ecriture',
      charges: 'ecriture', acces_roles: 'ecriture', parametres: 'ecriture',
    },
    requires2fa: true,
    twoFactorActive: true,
    status: 'active',
    grantedBy: 'Système',
    grantedAt: daysAgo(210),
  },
  {
    id: 'acc_2',
    userId: 'usr_peda',
    fullName: 'Responsable pédagogique',
    email: 'pedagogie@monprojetmbeng.com',
    roleLabel: 'Gestionnaire CMS',
    permissions: { tableau_de_bord: 'lecture', cms: 'ecriture', utilisateurs: 'lecture' },
    requires2fa: false,
    twoFactorActive: true,
    status: 'active',
    grantedBy: 'Super Administrateur',
    grantedAt: daysAgo(120),
  },
  {
    id: 'acc_3',
    userId: 'usr_assoc',
    fullName: 'Associé — investisseur',
    email: 'associe@monprojetmbeng.com',
    roleLabel: 'Partenaire',
    permissions: { comptabilite: 'lecture', marketing: 'lecture', tableau_de_bord: 'lecture' },
    requires2fa: true,
    twoFactorActive: true,
    status: 'active',
    grantedBy: 'Super Administrateur',
    grantedAt: daysAgo(64),
  },
  {
    id: 'acc_4',
    userId: 'usr_compta',
    fullName: 'Comptable externe',
    email: 'cabinet@exemple-compta.cm',
    roleLabel: 'Comptabilité',
    permissions: { comptabilite: 'lecture', charges: 'ecriture', paiements: 'lecture' },
    requires2fa: true,
    twoFactorActive: false,
    status: 'invited',
    grantedBy: 'Super Administrateur',
    grantedAt: daysAgo(3),
  },
];

/* ------------------------------------------------------------ clés d'API */

export const apiKeys: ApiKeyRecord[] = [
  { id: 'key_1', label: 'WhatsApp Business API', provider: 'Meta', maskedKey: 'EAAG••••••••••4f2a', createdAt: daysAgo(180), lastRotatedAt: daysAgo(35), status: 'active' },
  { id: 'key_2', label: 'Orange Money — Collecte', provider: 'Orange CM', maskedKey: 'om_live_••••••7b31', createdAt: daysAgo(150), lastRotatedAt: daysAgo(150), status: 'active' },
  { id: 'key_3', label: 'MTN MoMo — Collecte', provider: 'MTN CM', maskedKey: 'mtn_live_••••••9c02', createdAt: daysAgo(150), lastRotatedAt: daysAgo(88), status: 'active' },
  { id: 'key_4', label: 'Fournisseur SMS de secours', provider: 'Africa SMS', maskedKey: 'sms_••••••1d55', createdAt: daysAgo(96), lastRotatedAt: daysAgo(96), status: 'revoked' },
];

export const systemSettings: SystemSettings = {
  supportEmail: 'support@monprojetmbeng.com',
  whatsappBusinessNumber: '+237699456128',
  currency: 'FCFA (XAF)',
  secondaryCurrency: 'Euro (€)',
  require2faForFinance: true,
  otpPrimaryChannel: 'whatsapp',
  otpFallbackChannel: 'sms',
  notifyOnPayoutRequest: true,
  notifyOnActiveUsersDrop: true,
  notifyOnNewAccessRequest: true,
  weeklyDigestByEmail: false,
};

/* ------------------------------------------------------------- audit_log */

export const auditLog: AuditLogEntry[] = payoutRequests
  .filter((p) => p.status !== 'pending')
  .map((p, i) => ({
    id: `aud_${i + 1}`,
    actorId: ADMIN_ID,
    actorName: 'Super Administrateur',
    portal: 'admin' as const,
    action: p.status === 'paid' ? 'payout.marked_paid' : 'payout.rejected',
    targetTable: 'payout_requests',
    targetId: p.id,
    metadata: { from: 'pending', to: p.status, reference: p.transactionReference },
    createdAt: p.paidAt ?? p.requestedAt,
  }));

/* --------------------------------------------------- indicateurs produit */

export const productMetrics = {
  totalUsers: TOTAL_USERS,
  premiumUsers: PREMIUM_USERS,
  /** Abonnements arrivés à échéance sur la période + non renouvelés → churn (audit §3.5). */
  expiredSubscriptions: 659,
  notRenewed: 27,
  /** Réservations d'examens : métrique conservée, mais à sa place, pas à celle du churn. */
  examBookings: 27,
  activeUsers: 3150,
  weeklyRevenue: 842_000,
  weeklyNewClients: 312,
} as const;

export const BONUS_REFERENCE = { AGENT_SIGNUP_BONUS, AGENT_CONVERSION_BONUS } as const;
