/**
 * Contenu éditorial de l'application (tuteurs Betreuer, podcasts, mots du jour).
 * Ce sont des CONTENUS, pas des indicateurs : ils sont servis par `lib/api/user`
 * comme n'importe quelle autre donnée, jamais écrits en dur dans un écran.
 */

export type TimeSlot = 'matin' | 'apres_midi' | 'soir' | 'weekend';
export type DiplomaType = 'goethe' | 'telc' | 'osd' | 'ecl' | 'universitaire';

export interface BetreuerRecord {
  id: string;
  name: string;
  title: string;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  availableThisWeek: boolean;
  city: string;
  format: 'presentiel' | 'en_ligne' | 'les_deux';
  levelTaught: string[];
  diploma: string;
  diplomaType: DiplomaType;
  timeSlots: TimeSlot[];
  bio: string;
  verified: boolean;
  languages: string[];
  avatarUrl: string;
}

export const TIME_SLOT_LABELS: Record<TimeSlot, string> = {
  matin: 'Matin (6 h – 12 h)',
  apres_midi: 'Après-midi (12 h – 18 h)',
  soir: 'Soir (18 h – 22 h)',
  weekend: 'Week-end',
};

export const DIPLOMA_LABELS: Record<DiplomaType, string> = {
  goethe: 'Goethe-Zertifikat',
  telc: 'telc',
  osd: 'ÖSD',
  ecl: 'ECL',
  universitaire: 'Diplôme universitaire',
};

export const sampleBetreuers: BetreuerRecord[] = [
  {
    id: 'bet_1',
    name: 'Yannick K.',
    title: 'B2 Goethe • 4 ans à Stuttgart',
    rating: 4.9,
    reviewCount: 42,
    hourlyRate: 10000,
    availableThisWeek: true,
    city: 'Douala (Akwa & En ligne)',
    format: 'les_deux',
    levelTaught: ['A1', 'A2', 'B1', 'B2'],
    diploma: 'Goethe-Zertifikat B2 & Ingénieur TH Köln',
    diplomaType: 'goethe',
    timeSlots: ['matin', 'soir'],
    bio: "Arrivé en Allemagne en 2019, je prépare les candidats au Goethe B1/B2 et aux entretiens d'embauche d'Ausbildung. Méthode concrète basée sur les annales réelles.",
    verified: true,
    languages: ['Allemand', 'Français', 'Anglais'],
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'bet_2',
    name: 'Sandra T.',
    title: 'B2 telc • Infirmière à Munich',
    rating: 4.8,
    reviewCount: 34,
    hourlyRate: 9000,
    availableThisWeek: true,
    city: 'En ligne (Yaoundé origine)',
    format: 'en_ligne',
    levelTaught: ['A2', 'B1', 'B2'],
    diploma: "Infirmière diplômée d'État & telc B2",
    diplomaType: 'telc',
    timeSlots: ['soir', 'weekend'],
    bio: "Spécialiste de la préparation au vocabulaire médical hospitalier et à l'intégration des soignants camerounais en Allemagne.",
    verified: true,
    languages: ['Allemand', 'Français'],
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'bet_3',
    name: 'Brice N.',
    title: 'C1 TestDaF • Enseignant Goethe',
    rating: 5.0,
    reviewCount: 68,
    hourlyRate: 12000,
    availableThisWeek: false,
    city: 'Yaoundé (Bastos)',
    format: 'presentiel',
    levelTaught: ['B1', 'B2', 'C1'],
    diploma: 'Master Germanistik Uni Yaoundé I & TestDaF 19/20',
    diplomaType: 'universitaire',
    timeSlots: ['matin', 'apres_midi'],
    bio: 'Excellence grammaticale et aisance orale pour valider les 4 modules du Goethe dès la première tentative.',
    verified: true,
    languages: ['Allemand', 'Français', 'Ewondo'],
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'bet_4',
    name: 'Carine M.',
    title: 'B1 ECL • Douala Bonapriso',
    rating: 4.7,
    reviewCount: 22,
    hourlyRate: 11000,
    availableThisWeek: true,
    city: 'Douala (Bonapriso)',
    format: 'les_deux',
    levelTaught: ['A1', 'A2', 'B1'],
    diploma: 'ECL B1 & Étudiante Master Douala',
    diplomaType: 'ecl',
    timeSlots: ['apres_midi', 'weekend'],
    bio: "Pédagogie bienveillante axée sur la prise de parole sans blocage et l'écoute active des dialogues quotidiens.",
    verified: true,
    languages: ['Allemand', 'Français'],
    avatarUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'bet_5',
    name: 'Franck E.',
    title: 'ÖSD B2 • Technicien à Linz',
    rating: 4.6,
    reviewCount: 19,
    hourlyRate: 8000,
    availableThisWeek: true,
    city: 'En ligne',
    format: 'en_ligne',
    levelTaught: ['A2', 'B1', 'B2'],
    diploma: 'ÖSD-Zertifikat B2 & BTS Maintenance',
    diplomaType: 'osd',
    timeSlots: ['soir'],
    bio: "Préparation ciblée pour les profils techniques : vocabulaire d'atelier, sécurité au travail et entretien d'Ausbildung.",
    verified: true,
    languages: ['Allemand', 'Français'],
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=300&q=80',
  },
  {
    id: 'bet_6',
    name: 'Léonie A.',
    title: 'B2 Goethe • Étudiante à Leipzig',
    rating: 4.9,
    reviewCount: 51,
    hourlyRate: 9500,
    availableThisWeek: false,
    city: 'En ligne (Bafoussam origine)',
    format: 'en_ligne',
    levelTaught: ['A1', 'A2', 'B1'],
    diploma: 'Goethe-Zertifikat B2 & Licence Économie',
    diplomaType: 'goethe',
    timeSlots: ['matin', 'weekend'],
    bio: "Débutants complets bienvenus : on construit la base grammaticale et la prononciation avant d'attaquer l'examen.",
    verified: true,
    languages: ['Allemand', 'Français', 'Anglais'],
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80',
  },
];

export interface AudioLessonRecord {
  id: string;
  title: string;
  subtitle: string;
  duration: string;
  level: string;
  currentProgress: number;
  category: string;
  germanTranscript: string[];
  frenchTranslation: string[];
}

export const sampleAudios: AudioLessonRecord[] = [
  {
    id: 'aud_1',
    title: 'Alltag: Beim Arzt',
    subtitle: 'Niveau A2 • Consultation chez le médecin',
    duration: '5:42',
    level: 'A2',
    currentProgress: 62,
    category: 'Vie quotidienne',
    germanTranscript: [
      'Guten Tag, wie kann ich Ihnen heute helfen?',
      'Ich habe seit zwei Tagen starke Kopfschmerzen und leichtes Fieber.',
      'Haben Sie auch Halsschmerzen oder Husten?',
      'Ja, besonders morgens beim Aufstehen tut der Hals weh.',
      'Ich werde Sie jetzt gründlich untersuchen. Bitte machen Sie den Mund auf.',
    ],
    frenchTranslation: [
      'Bonjour, comment puis-je vous aider aujourd’hui ?',
      'J’ai de violents maux de tête et une légère fièvre depuis deux jours.',
      'Avez-vous également mal à la gorge ou de la toux ?',
      'Oui, la gorge me fait particulièrement mal le matin au réveil.',
      'Je vais maintenant vous examiner en détail. Veuillez ouvrir la bouche.',
    ],
  },
  {
    id: 'aud_2',
    title: 'Nachrichten — actualités lentes',
    subtitle: 'Niveau B1 • Actualités en langue simplifiée',
    duration: '4:15',
    level: 'B1',
    currentProgress: 20,
    category: 'Actualités',
    germanTranscript: [
      'Willkommen zu den Nachrichten in einfacher Sprache.',
      'Die Bundesregierung plant neue Regelungen für Fachkräfte aus dem Ausland.',
      'Besonders im Bereich der Krankenpflege werden dringend neue Mitarbeiter gesucht.',
    ],
    frenchTranslation: [
      'Bienvenue au journal d’actualités en langue simplifiée.',
      'Le gouvernement fédéral prépare de nouvelles règles pour les travailleurs qualifiés étrangers.',
      'Des collaborateurs sont particulièrement recherchés de toute urgence dans les soins infirmiers.',
    ],
  },
];

export const sampleWordsOfDay = [
  { word: 'die Erfahrung', type: 'Nom féminin', meaning: "l'expérience (vécue)", example: 'Sie hat viel Erfahrung im Verkauf.' },
  { word: 'sich bewerben', type: 'Verbe réfléchi', meaning: 'postuler, faire acte de candidature', example: 'Ich möchte mich für die Stelle bewerben.' },
  { word: 'dringend', type: 'Adjectif / Adverbe', meaning: 'urgent / urgemment', example: 'Das ist eine dringende Angelegenheit.' },
  { word: 'obwohl', type: 'Conjonction', meaning: 'bien que, quoique', example: 'Obwohl es regnet, geht er spazieren.' },
  { word: 'die Übergabe', type: 'Nom féminin', meaning: 'la relève / la transmission', example: 'Die Übergabe beginnt um 14 Uhr.' },
];
