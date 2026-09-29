// Design tokens centralisés définis dans le Manuel Technique d'Ingénierie de Mon Projet Mbeng
export const colors = {
  bg: '#FAF7F2',
  body: '#EDE7DD',
  ink: '#241F18',
  inkSoft: '#3A3226',
  gray: '#8A8173',
  border: '#E4DCCB',
  borderLight: '#EFE9DC',
  placeholder: '#F1E7DA',
  card: '#FFFFFF',
  
  // Accent de marque exclusif
  accent: '#C0512F',
  accentHover: '#A8452A',
  accentActive: '#8F3B24',
  accentBg: '#FBEDE6',

  // Sémantique d'état sans collision
  success: '#2F9E6E',
  successBg: '#DDF0E6',
  successSoftText: '#1F6B47',
  successSoftBg: '#F0F9F4',
  successSoftBorder: '#B9E2CC',
  
  warning: '#A8710A',
  warningBg: '#FBF0DC',
  warningBorder: '#F0D9A8',
  
  error: '#B3261E',
  errorBg: '#FBE9E7',
  errorBorder: '#F0BDB8',

  // Marques de paiement
  payment: {
    orangeMoney: '#FF7900',
    mtnMoMo: '#FFCC00',
    mtnMoMoText: '#241F18',
    paypalDark: '#003087',
    paypalLight: '#009CDE',
    cardRed: '#EB001B',
    cardOrange: '#F79E1B',
    neutralBg: '#F5F7FA'
  }
} as const;

export const radius = {
  sm: 10,
  md: 12,
  lg: 14,
  xl: 16,
} as const;

export const spacing = [10, 12, 14, 16, 20, 24, 28] as const;
