/**
 * Secure Storage Service
 * Wrapper around react-native-keychain for storing sensitive data.
 */

import * as Keychain from 'react-native-keychain';

const SERVICE_PREFIX = 'com.employeeattendancetracker';

/**
 * Store credentials securely in the device keychain
 */
export const storeCredentials = async (email, password) => {
  try {
    await Keychain.setGenericPassword(email, password, {
      service: `${SERVICE_PREFIX}.credentials`,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch (error) {
    console.error('[SecureStorage] Failed to store credentials:', error);
    return false;
  }
};

/**
 * Retrieve stored credentials from keychain
 */
export const getCredentials = async () => {
  try {
    const credentials = await Keychain.getGenericPassword({
      service: `${SERVICE_PREFIX}.credentials`,
    });
    if (credentials) {
      return { email: credentials.username, password: credentials.password };
    }
    return null;
  } catch (error) {
    console.error('[SecureStorage] Failed to get credentials:', error);
    return null;
  }
};

/**
 * Store session token securely
 */
export const storeToken = async (token) => {
  try {
    if (!token) {
      await Keychain.resetGenericPassword({ service: `${SERVICE_PREFIX}.session` });
      return true;
    }
    await Keychain.setGenericPassword('session', token, {
      service: `${SERVICE_PREFIX}.session`,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
    return true;
  } catch (error) {
    console.error('[SecureStorage] Failed to store token:', error);
    return false;
  }
};

/**
 * Retrieve session token
 */
export const getToken = async () => {
  try {
    const result = await Keychain.getGenericPassword({
      service: `${SERVICE_PREFIX}.session`,
    });
    if (result) {
      return result.password; // token stored as password
    }
    return null;
  } catch (error) {
    console.error('[SecureStorage] Failed to get token:', error);
    return null;
  }
};

/**
 * Clear all stored credentials and tokens
 */
export const clearAll = async () => {
  try {
    await Keychain.resetGenericPassword({ service: `${SERVICE_PREFIX}.credentials` });
    await Keychain.resetGenericPassword({ service: `${SERVICE_PREFIX}.session` });
    return true;
  } catch (error) {
    console.error('[SecureStorage] Failed to clear:', error);
    return false;
  }
};

/**
 * Check if biometric authentication is supported on this device
 */
export const getBiometryType = async () => {
  try {
    const biometryType = await Keychain.getSupportedBiometryType();
    return biometryType; // 'TouchID', 'FaceID', 'Fingerprint', or null
  } catch (error) {
    return null;
  }
};

export default {
  storeCredentials,
  getCredentials,
  storeToken,
  getToken,
  clearAll,
  getBiometryType,
};
