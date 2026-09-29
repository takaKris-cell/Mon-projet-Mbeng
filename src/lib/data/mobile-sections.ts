/**
 * Cartographie de l'APPLICATION MOBILE, section par section.
 *
 * C'est le référentiel partagé par :
 *   • le navigateur de l'espace CMS (ce que l'admin voit et peut éditer),
 *   • l'aperçu téléphone (l'écran élève correspondant),
 *   • la validation (quels types de contenu et quel support sont acceptés).
 *
 * Ajouter une section à l'application mobile revient à ajouter une entrée ici :
 * elle apparaît immédiatement dans le CMS, dans l'aperçu et dans la validation.
 */
import type { ContentSection, ContentType } from './types';
import type { UserScreen } from '../../types';

export interface MobileSectionDef {
  id: ContentSection;
  label: string;
  /** Ce que l'élève voit — sert de sous-titre dans le CMS. */
  description: string;
  /** Écran de l'application élève où ce contenu apparaît. */
  screen: UserScreen;
  /** Chemin lisible, affiché à l'admin : « Accueil › Bibliothèque ». */
  breadcrumb: string;
  allowedTypes: ContentType[];
  /** Le niveau CECRL s'applique-t-il à ce contenu ? */
  usesLevel: boolean;
  /** Le contenu peut-il être réservé aux abonnés Premium ? */
  supportsPremium: boolean;
  /** Mise en page de la section dans l'application mobile. */
  layout: 'liste' | 'etapes' | 'cartes' | 'mots';
}

export const MOBILE_SECTIONS: MobileSectionDef[] = [
  {
    id: 'bibliotheque',
    label: 'Bibliothèque',
    description: 'Podcasts, fiches, livres et vidéos consultables depuis l’onglet Bibliothèque.',
    screen: 'library',
    breadcrumb: 'Accueil › Bibliothèque',
    allowedTypes: ['podcast', 'fiche', 'livre', 'video'],
    usesLevel: true,
    supportsPremium: true,
    layout: 'liste',
  },
  {
    id: 'examens',
    label: 'Examens blancs',
    description: 'Modelltests Goethe, telc, ÖSD et ECL, en conditions réelles.',
    screen: 'exams_intro',
    breadcrumb: 'Accueil › Examens blancs',
    allowedTypes: ['modelltest'],
    usesLevel: true,
    supportsPremium: true,
    layout: 'liste',
  },
  {
    id: 'mots_du_jour',
    label: 'Mots du jour',
    description: 'Vocabulaire quotidien poussé sur l’écran d’accueil.',
    screen: 'words_of_day',
    breadcrumb: 'Accueil › Tes mots du jour',
    allowedTypes: ['mot'],
    usesLevel: true,
    supportsPremium: false,
    layout: 'mots',
  },
  {
    id: 'par_ou_commencer',
    label: 'Par où commencer',
    description: 'Les étapes de la procédure, dans l’ordre, du diplôme au visa.',
    screen: 'guide_orientation',
    breadcrumb: 'Accueil › Je ne sais pas par où commencer',
    allowedTypes: ['etape', 'fiche'],
    usesLevel: false,
    supportsPremium: true,
    layout: 'etapes',
  },
  {
    id: 'pflege',
    label: 'Formation Pflege',
    description: 'Programme soignant : modules, vocabulaire médical, stages.',
    screen: 'nursing_training',
    breadcrumb: 'Après ton B2 › Programme de formation Pflege',
    allowedTypes: ['fiche', 'video', 'podcast'],
    usesLevel: true,
    supportsPremium: true,
    layout: 'liste',
  },
  {
    id: 'integration',
    label: 'S’intégrer en Allemagne',
    description: 'Logement, Anmeldung, banque, assurance, transports.',
    screen: 'germany_integration',
    breadcrumb: 'Après ton B2 › S’intégrer en Allemagne',
    allowedTypes: ['fiche', 'video'],
    usesLevel: false,
    supportsPremium: true,
    layout: 'cartes',
  },
  {
    id: 'apres_b2',
    label: 'Après ton B2',
    description: 'Ausbildung, Studium, Duales Studium : les voies possibles.',
    screen: 'post_b2',
    breadcrumb: 'Accueil › Ausbildung, Studium & autres voies',
    allowedTypes: ['fiche', 'video'],
    usesLevel: false,
    supportsPremium: true,
    layout: 'cartes',
  },
  {
    id: 'ambassade',
    label: 'Ambassade & VFS Global',
    description: 'Dossier de visa, rendez-vous, actualités de l’ambassade.',
    screen: 'embassy_guide',
    breadcrumb: 'Après ton B2 › Tout savoir sur mon passage à l’ambassade',
    allowedTypes: ['fiche', 'actualite'],
    usesLevel: false,
    supportsPremium: true,
    layout: 'liste',
  },
  {
    id: 'emploi',
    label: 'Trouver un contrat de travail',
    description: 'Candidature, lettre de motivation, entretien d’embauche.',
    screen: 'jobs_nursing',
    breadcrumb: 'Après ton B2 › Trouver un contrat de travail',
    allowedTypes: ['fiche', 'video'],
    usesLevel: false,
    supportsPremium: true,
    layout: 'cartes',
  },
];

export function findMobileSection(id: string): MobileSectionDef {
  return MOBILE_SECTIONS.find((s) => s.id === id) ?? MOBILE_SECTIONS[0];
}

/* ------------------------------------------------- exigences par type */

export interface ContentTypeDef {
  id: ContentType;
  label: string;
  /** Ce qu'on attend concrètement de l'admin. */
  hint: string;
  /** Un support est-il obligatoire pour ce type ? */
  fileRequired: boolean;
  /** Extensions acceptées par le sélecteur de fichier. */
  accept: string;
  /** Libellé du champ de téléversement. */
  fileLabel: string;
  /** Le champ « durée » a-t-il un sens ? */
  usesDuration: boolean;
  /** Le corps de texte est-il obligatoire ? */
  bodyRequired: boolean;
}

export const CONTENT_TYPE_DEFS: Record<ContentType, ContentTypeDef> = {
  podcast: {
    id: 'podcast',
    label: 'Podcast audio',
    hint: 'Fichier audio écoutable hors connexion, avec sa transcription.',
    fileRequired: true,
    accept: 'audio/mpeg,audio/mp4,audio/wav,audio/ogg,.mp3,.m4a,.wav,.ogg',
    fileLabel: 'Fichier audio',
    usesDuration: true,
    bodyRequired: true,
  },
  video: {
    id: 'video',
    label: 'Vidéo',
    hint: 'Vidéo courte lisible dans l’application.',
    fileRequired: true,
    accept: 'video/mp4,video/webm,.mp4,.webm',
    fileLabel: 'Fichier vidéo',
    usesDuration: true,
    bodyRequired: false,
  },
  fiche: {
    id: 'fiche',
    label: 'Fiche',
    hint: 'Texte structuré lu directement dans l’application. PDF facultatif.',
    fileRequired: false,
    accept: 'application/pdf,.pdf',
    fileLabel: 'PDF à télécharger (facultatif)',
    usesDuration: false,
    bodyRequired: true,
  },
  livre: {
    id: 'livre',
    label: 'Livre / document',
    hint: 'Document PDF téléchargeable par l’élève.',
    fileRequired: true,
    accept: 'application/pdf,.pdf',
    fileLabel: 'Document PDF',
    usesDuration: false,
    bodyRequired: false,
  },
  modelltest: {
    id: 'modelltest',
    label: 'Examen blanc',
    hint: 'Sujet complet en conditions réelles, avec sa durée officielle.',
    fileRequired: true,
    accept: 'application/pdf,application/zip,.pdf,.zip',
    fileLabel: 'Sujet (PDF ou archive)',
    usesDuration: true,
    bodyRequired: true,
  },
  etape: {
    id: 'etape',
    label: 'Étape de procédure',
    hint: 'Une étape du parcours, affichée dans l’ordre défini par sa position.',
    fileRequired: false,
    accept: 'application/pdf,.pdf',
    fileLabel: 'Pièce jointe (facultatif)',
    usesDuration: false,
    bodyRequired: true,
  },
  actualite: {
    id: 'actualite',
    label: 'Actualité',
    hint: 'Information datée : changement de procédure, délais, alerte.',
    fileRequired: false,
    accept: 'application/pdf,image/*,.pdf',
    fileLabel: 'Pièce jointe (facultatif)',
    usesDuration: false,
    bodyRequired: true,
  },
  mot: {
    id: 'mot',
    label: 'Mot du jour',
    hint: 'Le mot allemand en titre, la traduction en sous-titre, l’exemple en corps.',
    fileRequired: false,
    accept: 'audio/mpeg,.mp3',
    fileLabel: 'Prononciation (facultatif)',
    usesDuration: false,
    bodyRequired: true,
  },
};

/** Taille maximale d'un téléversement de démonstration. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
