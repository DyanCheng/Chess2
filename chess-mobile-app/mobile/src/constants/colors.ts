// Arcane Chess Color Palette
export const COLORS = {
  // Primary backgrounds
  background: '#0D0D14',
  backgroundDark: '#08080E',
  backgroundCard: '#1A1A2E',
  backgroundCardLight: '#242440',
  backgroundCardHover: '#2A2A4A',

  // Surface colors
  surface: '#16162A',
  surfaceLight: '#1E1E36',
  surfaceElevated: '#252542',

  // Accent / Brand
  primary: '#FFB347',       // Gold/Orange primary
  primaryDark: '#E59A30',
  primaryLight: '#FFD080',
  secondary: '#8B5CF6',     // Purple
  secondaryLight: '#A78BFA',
  accent: '#22D3EE',        // Cyan accent
  accentGreen: '#10B981',   // Green for success
  accentRed: '#EF4444',     // Red for losses/danger
  accentBlue: '#3B82F6',    // Blue for info

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#B8B8D0',
  textMuted: '#6B6B8A',
  textGold: '#FFB347',
  textGreen: '#10B981',
  textRed: '#EF4444',

  // Borders
  border: '#2A2A4A',
  borderLight: '#3A3A5A',
  borderGold: '#FFB34733',

  // Gradients
  gradientGoldStart: '#FFB347',
  gradientGoldEnd: '#FF8C00',
  gradientPurpleStart: '#8B5CF6',
  gradientPurpleEnd: '#6D28D9',
  gradientDarkStart: '#1A1A2E',
  gradientDarkEnd: '#0D0D14',

  // Rank colors
  rankMaster: '#FFB347',
  rankDiamond: '#22D3EE',
  rankPlatinum: '#94A3B8',
  rankGold: '#FFD700',
  rankSilver: '#C0C0C0',
  rankBronze: '#CD7F32',

  // Status
  online: '#10B981',
  offline: '#6B6B8A',
  inGame: '#FFB347',

  // Tab bar
  tabBarBg: '#12121F',
  tabBarActive: '#FFB347',
  tabBarInactive: '#6B6B8A',

  // Light theme variants (for some cards)
  lightCardBg: '#FFFFFF',
  lightCardBorder: '#E5E7EB',
  lightText: '#1F2937',
  lightTextSecondary: '#6B7280',

  // Shadows
  shadowDark: 'rgba(0, 0, 0, 0.5)',
  shadowGold: 'rgba(255, 179, 71, 0.3)',
  shadowPurple: 'rgba(139, 92, 246, 0.3)',

  // Transparent overlays
  overlayDark: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(255, 255, 255, 0.05)',
};

// Light theme palette (same shape as COLORS)
export const LIGHT_COLORS: typeof COLORS = {
  ...COLORS,
  background: '#F4F6FB',
  backgroundDark: '#FFFFFF',
  backgroundCard: '#FFFFFF',
  backgroundCardLight: '#F8FAFC',
  backgroundCardHover: '#F1F5F9',
  surface: '#F3F4F8',
  surfaceLight: '#F8FAFC',
  surfaceElevated: '#FFFFFF',
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryLight: '#FBBF24',
  textPrimary: '#1F2937',
  textSecondary: '#4B5563',
  textMuted: '#8B93A7',
  textGold: '#D97706',
  border: '#E8EAF2',
  borderLight: '#EEF0F6',
  tabBarBg: '#FFFFFF',
  tabBarActive: '#F59E0B',
  tabBarInactive: '#9CA3AF',
  shadowDark: 'rgba(30, 41, 59, 0.12)',
};

export const GRADIENTS = {
  gold: ['#FFB347', '#FF8C00'],
  purple: ['#8B5CF6', '#6D28D9'],
  dark: ['#1A1A2E', '#0D0D14'],
  darkCard: ['#1E1E36', '#16162A'],
  greenSuccess: ['#10B981', '#059669'],
  redDanger: ['#EF4444', '#DC2626'],
  blueInfo: ['#3B82F6', '#2563EB'],
  seasonBanner: ['#1A0A3E', '#0D0D14'],
};

export default COLORS;
