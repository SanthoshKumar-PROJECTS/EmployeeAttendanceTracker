/**
 * Typography System
 */

import { moderateScale } from '../utils/responsive';

export const Typography = {
  // Font families
  fontFamily: 'Outfit-Regular',
  fontFamilyMedium: 'Outfit-Medium',
  fontFamilySemiBold: 'Outfit-SemiBold',
  fontFamilyBold: 'Outfit-Bold',

  // Font sizes scaled moderately
  sizes: {
    xs: moderateScale(10),
    sm: moderateScale(12),
    md: moderateScale(14),
    base: moderateScale(16),
    lg: moderateScale(18),
    xl: moderateScale(20),
    xxl: moderateScale(24),
    xxxl: moderateScale(30),
    display: moderateScale(36),
    hero: moderateScale(48),
  },

  // Font weights
  weights: {
    light: '300',
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },

  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.5,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 2,
  },

  // Pre-defined text styles
  styles: {
    hero: {
      fontSize: moderateScale(48),
      fontWeight: '800',
      letterSpacing: -1,
    },
    display: {
      fontSize: moderateScale(36),
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    h1: {
      fontSize: moderateScale(30),
      fontWeight: '700',
      letterSpacing: -0.5,
    },
    h2: {
      fontSize: moderateScale(24),
      fontWeight: '700',
    },
    h3: {
      fontSize: moderateScale(20),
      fontWeight: '600',
    },
    h4: {
      fontSize: moderateScale(18),
      fontWeight: '600',
    },
    body: {
      fontSize: moderateScale(16),
      fontWeight: '400',
      lineHeight: moderateScale(24),
    },
    bodySmall: {
      fontSize: moderateScale(14),
      fontWeight: '400',
      lineHeight: moderateScale(20),
    },
    caption: {
      fontSize: moderateScale(12),
      fontWeight: '400',
      lineHeight: moderateScale(16),
    },
    overline: {
      fontSize: moderateScale(10),
      fontWeight: '600',
      letterSpacing: 2,
      textTransform: 'uppercase',
    },
    button: {
      fontSize: moderateScale(16),
      fontWeight: '600',
      letterSpacing: 0.5,
    },
    buttonSmall: {
      fontSize: moderateScale(14),
      fontWeight: '600',
      letterSpacing: 0.5,
    },
  },
};

export default Typography;
