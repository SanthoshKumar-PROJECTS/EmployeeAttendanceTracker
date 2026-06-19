/**
 * Spacing & Layout System
 */
import { moderateScale, scale } from '../utils/responsive';

export const Spacing = {
  // Base spacing scale (scaled appropriately for device size)
  xxs: moderateScale(2),
  xs: moderateScale(4),
  sm: moderateScale(8),
  md: moderateScale(12),
  base: moderateScale(16),
  lg: moderateScale(20),
  xl: moderateScale(24),
  xxl: moderateScale(32),
  xxxl: moderateScale(40),
  huge: moderateScale(48),
  massive: moderateScale(64),

  // Border radius
  radius: {
    xs: moderateScale(4),
    sm: moderateScale(8),
    md: moderateScale(12),
    lg: moderateScale(16),
    xl: moderateScale(20),
    xxl: moderateScale(24),
    round: 9999,
  },

  // Shadows (for elevated components)
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.25,
      shadowRadius: 16,
      elevation: 8,
    },
    glow: {
      shadowColor: '#6C63FF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    glowSuccess: {
      shadowColor: '#00E676',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
    glowDanger: {
      shadowColor: '#FF5252',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  // Screen padding
  screenPadding: {
    horizontal: scale(20), // Scale fully horizontally for margins
    vertical: moderateScale(16),
  },

  // Hit slop for touch targets
  hitSlop: {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
  },
};

export default Spacing;
