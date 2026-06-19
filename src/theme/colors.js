/**
 * App Color Palette
 * Premium dark theme with vibrant accent colors
 */

export const Colors = {
  // Primary palette
  primary: '#6C63FF',
  primaryLight: '#8B85FF',
  primaryDark: '#4A42DB',
  primaryGlow: 'rgba(108, 99, 255, 0.3)',

  // Accent / Success / Warning / Error
  accent: '#00D9FF',
  accentGlow: 'rgba(0, 217, 255, 0.2)',
  success: '#00E676',
  successDark: '#00C853',
  successGlow: 'rgba(0, 230, 118, 0.2)',
  warning: '#FFB300',
  warningDark: '#FF8F00',
  warningGlow: 'rgba(255, 179, 0, 0.2)',
  error: '#FF5252',
  errorDark: '#D32F2F',
  errorGlow: 'rgba(255, 82, 82, 0.2)',

  // Background layers (dark theme)
  background: '#0A0E1A',
  surface: '#121828',
  surfaceLight: '#1A2236',
  surfaceElevated: '#212B42',
  card: '#161E30',
  cardBorder: 'rgba(108, 99, 255, 0.15)',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0AEC0',
  textMuted: '#5A6B8A',
  textInverse: '#0A0E1A',

  // Borders & Dividers
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.05)',

  // Overlays
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',

  // Gradient pairs
  gradientPrimary: ['#6C63FF', '#8B85FF'],
  gradientAccent: ['#00D9FF', '#6C63FF'],
  gradientSuccess: ['#00E676', '#00D9FF'],
  gradientDanger: ['#FF5252', '#FF8A80'],
  gradientDark: ['#121828', '#0A0E1A'],
  gradientCard: ['rgba(108, 99, 255, 0.08)', 'rgba(0, 217, 255, 0.04)'],

  // Status-specific
  checkedIn: '#00E676',
  checkedOut: '#FF8A80',
  absent: '#5A6B8A',
  pending: '#FFB300',

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

export default Colors;
