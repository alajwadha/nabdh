// Nabdh design system — the "expressive" v3 language: warm cream light theme
// with a deep-green accent, soft playful tiles, generous space, soft motion.
// Light and dark palettes mirror the v3 prototype. Components read the active
// palette via useTheme(); `colors`/`tiles` below are the LIGHT defaults kept as
// a static fallback for any non-themed call sites.

export type Palette = {
  bg: string;
  card: string;
  border: string;
  ink: string;
  textSecondary: string;
  textMuted: string;
  accent: string; // brand green (buttons, fills)
  accentDeep: string; // darker green (gradients)
  accentText: string; // green that stays legible as TEXT on the bg
  accentInk: string; // ink on top of accent fills
  warning: string;
  danger: string;
  navBg: string;
  navOn: string; // active tab pill
  navOnText: string;
  heroInk: string; // text on colored hero cards
  yellow: string;
  // backward-compat aliases for pre-v3 screens (sign-in, onboarding, consent)
  textPrimary: string;
  surface: string;
  surfaceAlt: string;
  accentDim: string;
};

export const lightColors: Palette = {
  bg: '#F7F1E8',
  card: '#FFFBF4',
  border: '#EDE5D3',
  ink: '#1F1C17',
  textSecondary: '#6B6457',
  textMuted: '#80796C',
  accent: '#2E7D5B',
  accentDeep: '#256A4C',
  accentText: '#2E7D5B',
  accentInk: '#FFFFFF',
  warning: '#C2562C',
  danger: '#D9534F',
  navBg: '#EFE8DA',
  navOn: '#211E1A',
  navOnText: '#FFF8EC',
  heroInk: '#FFFFFF',
  yellow: '#F2C94C',
  textPrimary: '#1F1C17',
  surface: '#FFFBF4',
  surfaceAlt: '#F2EADB',
  accentDim: '#256A4C',
};

export const darkColors: Palette = {
  bg: '#16130E',
  card: '#211D16',
  border: '#2E2920',
  ink: '#F4EDDF',
  textSecondary: '#B6AC97',
  textMuted: '#9C937F',
  accent: '#2E7D5B',
  accentDeep: '#1D4934',
  accentText: '#7FD6AC',
  accentInk: '#FFFFFF',
  warning: '#E08A50',
  danger: '#E0726E',
  navBg: '#262218',
  navOn: '#F4EDDF',
  navOnText: '#1A160F',
  heroInk: '#FFFFFF',
  yellow: '#F2C94C',
  textPrimary: '#F4EDDF',
  surface: '#211D16',
  surfaceAlt: '#2A251C',
  accentDim: '#1D4934',
};

export type TilePalette = Record<
  'peach' | 'lav' | 'mint' | 'pink' | 'gold' | 'blue',
  { bg: string; ink: string }
>;

export const lightTiles: TilePalette = {
  peach: { bg: '#F7E3C2', ink: '#6B5328' },
  lav: { bg: '#DDD6F6', ink: '#4A4080' },
  mint: { bg: '#D8EFE2', ink: '#1E5A40' },
  pink: { bg: '#F8DCE4', ink: '#7A3A52' },
  gold: { bg: '#FBE5BE', ink: '#8A6312' },
  blue: { bg: '#D6EBF6', ink: '#2C5C77' },
};

export const darkTiles: TilePalette = {
  peach: { bg: '#2E2517', ink: '#F2D5A4' },
  lav: { bg: '#262238', ink: '#CDC3F2' },
  mint: { bg: '#1C2A21', ink: '#A9DEC2' },
  pink: { bg: '#2C2024', ink: '#EFC3D0' },
  gold: { bg: '#2C2410', ink: '#F2CE7C' },
  blue: { bg: '#142530', ink: '#A9D4EC' },
};

// Static light defaults (fallback for non-themed imports).
export const colors = lightColors;
export const tiles = lightTiles;
export type TileColor = keyof TilePalette;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 32, lineHeight: 36, fontWeight: '800' },
  h1: { fontSize: 28, lineHeight: 32, fontWeight: '800' },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '700' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 17, fontWeight: '700' },
} as const;

export type TextVariant = keyof typeof typography;

export const motion = {
  duration: { fast: 150, base: 250, slow: 400 },
  spring: { damping: 18, stiffness: 180, mass: 1 },
} as const;

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;
