/**
 * Camera Service
 * Handles selfie capture and local image storage.
 */

import RNFS from 'react-native-fs';
import { Platform, PermissionsAndroid } from 'react-native';
import { APP_CONFIG } from '../constants/config';

/**
 * Get the selfie storage directory
 */
const getSelfieDir = async (userId) => {
  const dir = `${RNFS.DocumentDirectoryPath}/${APP_CONFIG.SELFIE_FOLDER}/${userId}`;
  const exists = await RNFS.exists(dir);
  if (!exists) {
    await RNFS.mkdir(dir);
  }
  return dir;
};

/**
 * Request camera permission (Android)
 */
export const requestCameraPermission = async () => {
  if (Platform.OS === 'ios') return true;

  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
      {
        title: 'Camera Permission',
        message: 'This app needs camera access to capture attendance selfie.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('[Camera] Permission request failed:', error);
    return false;
  }
};

/**
 * Process a photo captured by the custom in-app camera
 * Moves the file from the temp directory to the app's permanent selfie directory
 * @param {string} tempPath - The path returned by react-native-vision-camera (must start with file://)
 * @param {string} userId - User ID for organizing
 * @returns {Promise<{ path: string, uri: string }>}
 */
export const processCapturedPhoto = async (tempPath, userId) => {
  try {
    const selfieDir = await getSelfieDir(userId);
    const fileName = `selfie_${Date.now()}.jpg`;
    const destPath = `${selfieDir}/${fileName}`;

    const sourcePath = Platform.OS === 'android'
      ? tempPath.replace('file://', '')
      : tempPath;

    await RNFS.copyFile(sourcePath, destPath);

    return {
      path: destPath,
      uri: `file://${destPath}`,
    };
  } catch (error) {
    console.error('[Camera] Failed to process selfie:', error);
    // Fall back to the temp path
    return {
      path: tempPath,
      uri: tempPath,
    };
  }
};

/**
 * Delete a selfie from local storage
 */
export const deleteSelfie = async (selfiePath) => {
  try {
    if (selfiePath && await RNFS.exists(selfiePath)) {
      await RNFS.unlink(selfiePath);
    }
  } catch (error) {
    console.error('[Camera] Failed to delete selfie:', error);
  }
};

/**
 * Get selfie file URI for display
 */
export const getSelfieUri = (selfiePath) => {
  if (!selfiePath) return null;
  if (selfiePath.startsWith('file://')) return selfiePath;
  return `file://${selfiePath}`;
};

/**
 * Calculate total storage used by selfies
 */
export const getSelfieStorageSize = async (userId) => {
  try {
    const dir = `${RNFS.DocumentDirectoryPath}/${APP_CONFIG.SELFIE_FOLDER}/${userId}`;
    const exists = await RNFS.exists(dir);
    if (!exists) return 0;

    const files = await RNFS.readDir(dir);
    let totalSize = 0;
    for (const file of files) {
      totalSize += parseInt(file.size, 10) || 0;
    }
    return totalSize;
  } catch (error) {
    return 0;
  }
};

export default {
  requestCameraPermission,
  processCapturedPhoto,
  deleteSelfie,
  getSelfieUri,
  getSelfieStorageSize,
};
