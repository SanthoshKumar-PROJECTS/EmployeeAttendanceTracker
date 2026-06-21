/**
 * Global Error Handler
 * Centralized error handling with user-friendly messages.
 */

import useAlertStore from '../store/useAlertStore';

/**
 * Error categories
 */
const ERROR_CATEGORIES = {
  AUTH: 'Authentication Error',
  LOCATION: 'Location Error',
  CAMERA: 'Camera Error',
  DATABASE: 'Storage Error',
  GEOFENCE: 'Geofence Error',
  NETWORK: 'Network Error',
  PERMISSION: 'Permission Error',
  UNKNOWN: 'Error',
};

/**
 * Classify an error into a category
 */
const classifyError = (error) => {
  const msg = (error.message || error.toString()).toLowerCase();

  if (msg.includes('password') || msg.includes('login') || msg.includes('auth') || msg.includes('credential') || msg.includes('session')) {
    return ERROR_CATEGORIES.AUTH;
  }
  if (msg.includes('location') || msg.includes('gps')) {
    return ERROR_CATEGORIES.LOCATION;
  }
  if (msg.includes('camera') || msg.includes('selfie') || msg.includes('photo')) {
    return ERROR_CATEGORIES.CAMERA;
  }
  if (msg.includes('database') || msg.includes('sqlite') || msg.includes('storage')) {
    return ERROR_CATEGORIES.DATABASE;
  }
  if (msg.includes('geofence') || msg.includes('outside')) {
    return ERROR_CATEGORIES.GEOFENCE;
  }
  if (msg.includes('permission') || msg.includes('denied')) {
    return ERROR_CATEGORIES.PERMISSION;
  }
  if (msg.includes('network') || msg.includes('internet')) {
    return ERROR_CATEGORIES.NETWORK;
  }
  return ERROR_CATEGORIES.UNKNOWN;
};

/**
 * Show an error alert dialog
 */
export const showError = (error, title = null) => {
  const category = title || classifyError(error);
  const message = error.message || error.toString();

  useAlertStore.getState().showAlert(category, message, [{ text: 'OK' }]);
};

/**
 * Show a confirmation dialog
 */
export const showConfirm = (title, message, onConfirm, onCancel) => {
  useAlertStore.getState().showAlert(title, message, [
    { text: 'Cancel', style: 'cancel', onPress: onCancel },
    { text: 'Confirm', onPress: onConfirm },
  ]);
};

/**
 * Show a success message
 */
export const showSuccess = (title, message) => {
  useAlertStore.getState().showAlert(title, message, [{ text: 'OK' }]);
};

/**
 * Safe async function wrapper — catches and displays errors
 */
export const safeAsync = async (fn, errorTitle = null) => {
  try {
    return await fn();
  } catch (error) {
    console.error('[ErrorHandler]', error);
    showError(error, errorTitle);
    return null;
  }
};

/**
 * Global error boundary helper for unhandled JS errors
 */
export const setupGlobalErrorHandler = () => {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    console.error('[GlobalError]', isFatal ? 'FATAL:' : 'ERROR:', error);

    if (isFatal) {
      useAlertStore.getState().showAlert(
        'Unexpected Error',
        'The app encountered an unexpected error. Please restart the app.',
        [{ text: 'OK' }]
      );
    }

    defaultHandler(error, isFatal);
  });
};

export default {
  showError,
  showConfirm,
  showSuccess,
  safeAsync,
  setupGlobalErrorHandler,
};
