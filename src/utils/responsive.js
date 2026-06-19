import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on standard ~5" screen mobile device (iPhone X / Standard Pixel)
const guidelineBaseWidth = 375;
const guidelineBaseHeight = 812;

/**
 * scale
 * Scales the size linearly based on screen width. Good for margins, paddings, and width.
 */
export const scale = (size) => (width / guidelineBaseWidth) * size;

/**
 * verticalScale
 * Scales the size linearly based on screen height. Good for heights and vertical margins.
 */
export const verticalScale = (size) => (height / guidelineBaseHeight) * size;

/**
 * moderateScale
 * Scales the size based on screen width, but applies a factor to prevent extreme scaling 
 * on very large screens (like iPads). Ideal for font sizes and border radii.
 * @param {number} size - The original size to scale
 * @param {number} factor - The aggressiveness of the scale. 0 is original size, 1 is fully scaled. Default is 0.5.
 */
export const moderateScale = (size, factor = 0.5) => size + (scale(size) - size) * factor;

/**
 * moderateVerticalScale
 * Same as moderateScale but using height instead of width for the baseline.
 */
export const moderateVerticalScale = (size, factor = 0.5) => size + (verticalScale(size) - size) * factor;

export default {
  scale,
  verticalScale,
  moderateScale,
  moderateVerticalScale,
};
