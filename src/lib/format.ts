import { CURRENCY } from './business/constants';
import { toEur } from './business/accounting';

/** Format monétaire unique de l'application. */
export function fcfa(amount: number, options: { compact?: boolean; sign?: boolean } = {}): string {
  const rounded = Math.round(amount);
  const prefix = options.sign && rounded > 0 ? '+' : '';
  if (options.compact && Math.abs(rounded) >= 1000) {
    return `${prefix}${(rounded / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k F`;
  }
  return `${prefix}${rounded.toLocaleString('fr-FR')} ${CURRENCY.label}`;
}

/** Équivalent euro affiché à côté des montants du fondateur. */
export function eur(amountXaf: number): string {
  return `${toEur(amountXaf).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €`;
}

export function pct(value: number, digits = 1): string {
  return `${value.toLocaleString('fr-FR', { minimumFractionDigits: digits, maximumFractionDigits: digits })} %`;
}

export function shortDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' });
}

export function dateTime(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

/** « Aujourd'hui », « Hier », « il y a 4 jours »… */
export function relativeDay(iso: string): string {
  if (!iso) return '—';
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "Aujourd'hui";
  if (days === 1) return 'Hier';
  if (days < 7) return `Il y a ${days} jours`;
  if (days < 31) return `Il y a ${Math.floor(days / 7)} sem.`;
  return shortDate(iso);
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
}

const HUMAN_LABELS: Record<string, string> = {
  inscrit: 'Inscrit',
  premium: 'Premium',
  en_cours_de_relance: 'En cours de relance',
  actif: 'Actif',
  suspendu: 'Suspendu',
  anonymise: 'Anonymisé',
  en_attente: 'En attente',
  gratuit: 'Gratuit',
  mensuel: 'Mensuel',
  semestriel: '6 mois',
  annuel: 'Annuel',
  pending: 'En attente',
  paid: 'Payé',
  rejected: 'Rejeté',
  approved: 'Validé',
  recu: 'Reçu',
  echoue: 'Échoué',
  rembourse: 'Remboursé',
  invited: 'Invitation envoyée',
  active: 'Actif',
  revoked: 'Révoqué',
  publie: 'Publié',
  brouillon: 'Brouillon',
  en_cours: 'En cours',
  terminee: 'Terminée',
  arretee: 'Arrêtée',
  aucun: 'Aucun',
  lecture: 'Lecture',
  ecriture: 'Écriture',
  infrastructure: 'Infrastructure',
  marketing: 'Marketing',
  physique: 'Matériel',
  rh: 'Ressources humaines',
  autre: 'Autre',
  eleve: 'Élève',
  betreuer: 'Betreuer',
  commercial: 'Commercial',
  admin: 'Administrateur',
  super_admin: 'Super-Admin',
  orange_money: 'Orange Money',
  mtn_momo: 'MTN MoMo',
  orange: 'Orange Money',
  mtn: 'MTN MoMo',
  paypal: 'PayPal',
  card: 'Carte bancaire',
  podcast: 'Podcast',
  modelltest: 'Examen blanc',
  fiche: 'Fiche',
  video: 'Vidéo',
  livre: 'Livre',
  bibliotheque: 'Bibliothèque',
  examens: 'Examens blancs',
  ambassade: 'Ambassade',
  pflege: 'Formation Pflege',
  par_ou_commencer: 'Par où commencer',
};

/** Manuel §2.3 — une valeur d'énumération n'est jamais affichée telle quelle. */
export function human(value: string | null | undefined): string {
  if (!value) return '—';
  return HUMAN_LABELS[value] ?? value;
}
