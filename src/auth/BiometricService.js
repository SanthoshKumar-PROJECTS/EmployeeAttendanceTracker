/**
 * Biometric Service
 * Handles fingerprint and face ID authentication.
 */

import ReactNativeBiometrics, { BiometryTypes } from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: true });

/**
 * Check if biometric authentication is available on the device
 * @returns {{ available: boolean, biometryType: string|null }}
 */
export const checkBiometricAvailability = async () => {
  try {
    const { available, biometryType } = await rnBiometrics.isSensorAvailable();
    return {
      available,
      biometryType, // 'TouchID', 'FaceID', 'Biometrics' (Android)
      label: getBiometricLabel(biometryType),
      icon: getBiometricIcon(biometryType),
    };
  } catch (error) {
    console.error('[Biometric] Availability check failed:', error);
    return { available: false, biometryType: null, label: null, icon: 'fingerprint' };
  }
};

/**
 * Prompt user for biometric authentication
 * @returns {{ success: boolean, error?: string }}
 */
export const authenticate = async (promptMessage = 'Verify your identity') => {
  try {
    const { available } = await rnBiometrics.isSensorAvailable();
    if (!available) {
      return { success: false, error: 'Biometric authentication not available on this device' };
    }

    const { success } = await rnBiometrics.simplePrompt({
      promptMessage,
      cancelButtonText: 'Cancel',
    });

    return { success };
  } catch (error) {
    console.error('[Biometric] Authentication failed:', error);
    // User cancelled or other error
    if (error.message && error.message.includes('cancel')) {
      return { success: false, error: 'Authentication cancelled' };
    }
    return { success: false, error: 'Biometric authentication failed' };
  }
};

/**
 * Get a user-friendly label for the biometric type
 */
const getBiometricLabel = (biometryType) => {
  switch (biometryType) {
    case BiometryTypes.TouchID:
      return 'Touch ID';
    case BiometryTypes.FaceID:
      return 'Face ID';
    case BiometryTypes.Biometrics:
      return 'Biometrics';
    default:
      return null;
  }
};

/**
 * Get the icon name for the biometric type
 */
export const getBiometricIcon = (biometryType) => {
  switch (biometryType) {
    case BiometryTypes.FaceID:
      return 'face-recognition';
    case BiometryTypes.TouchID:
    case BiometryTypes.Biometrics:
    default:
      return 'fingerprint';
  }
};

export default {
  checkBiometricAvailability,
  authenticate,
  getBiometricIcon,
};
