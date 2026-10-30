// ============================================================
// Design System Theme - Dark Fantasy Chess
// ============================================================

export const COLORS = {
  // Primary palette - Deep Purple & Gold
  primary: '#7C3AED',
  primaryLight: '#A78BFA',
  primaryDark: '#5B21B6',
  primaryGlow: 'rgba(124, 58, 237, 0.4)',

  // Accent - Gold
  accent: '#F59E0B',
  accentLight: '#FCD34D',
  accentDark: '#D97706',
  accentGlow: 'rgba(245, 158, 11, 0.4)',

  // Background
  bgDark: '#0F0A1A',
  bgCard: '#1A1128',
  bgCardLight: '#241835',
  bgOverlay: 'rgba(15, 10, 26, 0.85)',
  bgGlass: 'rgba(26, 17, 40, 0.7)',

  // Surface
  surface: '#1E1533',
  surfaceLight: '#2D2146',
  surfaceBorder: 'rgba(124, 58, 237, 0.3)',

  // Text
  textPrimary: '#F5F3FF',
  textSecondary: '#C4B5FD',
  textMuted: '#8B7EAD',
  textGold: '#FCD34D',

  // Chess board
  boardLight: '#C9A96E',
  boardDark: '#8B6D3F',
  boardHighlight: 'rgba(124, 58, 237, 0.5)',
  boardValidMove: 'rgba(34, 197, 94, 0.6)',
  boardLastMove: 'rgba(245, 158, 11, 0.3)',
  boardCheck: 'rgba(239, 68, 68, 0.5)',

  // Status
  success: '#22C55E',
  successGlow: 'rgba(34, 197, 94, 0.3)',
  danger: '#EF4444',
  dangerGlow: 'rgba(239, 68, 68, 0.3)',
  warning: '#F59E0B',
  info: '#3B82F6',

  // HP Colors
  hpFull: '#22C55E',
  hpMedium: '#F59E0B',
  hpLow: '#EF4444',
  hpShield: '#3B82F6',

  // Rarity colors
  rarityCommon: '#9CA3AF',
  rarityRare: '#3B82F6',
  rarityEpic: '#A855F7',
  rarityLegendary: '#F59E0B',

  // Currency
  gold: '#FCD34D',
  gems: '#A855F7',

  // White/Black
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
} as const;

export const GRADIENTS = {
  primary: ['#7C3AED', '#5B21B6'],
  accent: ['#F59E0B', '#D97706'],
  danger: ['#EF4444', '#DC2626'],
  success: ['#22C55E', '#16A34A'],
  dark: ['#1A1128', '#0F0A1A'],
  gold: ['#FCD34D', '#F59E0B', '#D97706'],
  purple: ['#A78BFA', '#7C3AED', '#5B21B6'],
  card: ['#241835', '#1A1128'],
  legendary: ['#FCD34D', '#F59E0B', '#D97706', '#F59E0B', '#FCD34D'],
  epic: ['#C084FC', '#A855F7', '#7C3AED'],
  hp: ['#22C55E', '#16A34A'],
  hpLow: ['#EF4444', '#DC2626'],
  shield: ['#60A5FA', '#3B82F6'],
  bgMain: ['#0F0A1A', '#1A1128', '#0F0A1A'],
} as const;

export const SHADOWS = {
  small: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  medium: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  large: {
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  glow: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  danger: {
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const BORDER_RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 9999,
} as const;

export const FONT_SIZES = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 22,
  xxxl: 28,
  title: 34,
  hero: 42,
} as const;

export const FONT_WEIGHTS = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  verySlow: 800,
  spring: {
    damping: 15,
    stiffness: 150,
    mass: 1,
  },
  bounce: {
    damping: 8,
    stiffness: 200,
    mass: 0.8,
  },
} as const;
