// Nabdh design system: deep dark, one mint-pulse accent, generous space,
// elegant type, soft motion. Premium and restrained. Tweak tokens here only.

export const colors = {
  bg: '#0B0F14',
  surface: '#141A21',
  surfaceAlt: '#1C232C',
  border: '#252E38',
  textPrimary: '#F2F5F7',
  textSecondary: '#9BA8B4',
  textMuted: '#5E6B77',
  accent: '#36E2B4',
  accentInk: '#04140F',
  accentDim: '#1E7E66',
  success: '#36E2B4',
  warning: '#F2B544',
  danger: '#F26D6D',
} as const;

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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

export const typography = {
  display: { fontSize: 40, lineHeight: 46, fontWeight: '700' },
  h1: { fontSize: 28, lineHeight: 34, fontWeight: '700' },
  h2: { fontSize: 22, lineHeight: 28, fontWeight: '600' },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '400' },
  caption: { fontSize: 13, lineHeight: 18, fontWeight: '500' },
} as const;

export type TextVariant = keyof typeof typography;

export const motion = {
  duration: { fast: 150, base: 250, slow: 400 },
  // Natural, soft spring used across the app. Never harsh.
  spring: { damping: 18, stiffness: 180, mass: 1 },
} as const;

export const shadow = {
  soft: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
} as const;

export const theme = { colors, spacing, radii, typography, motion, shadow };
export type Theme = typeof theme;
