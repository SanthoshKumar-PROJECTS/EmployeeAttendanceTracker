/**
 * Location Service
 * Handles GPS location capture and permission management.
 */

import Geolocation from 'react-native-geolocation-service';
import { Platform, PermissionsAndroid } from 'react-native';
import { APP_CONFIG } from '../constants/config';

/**
 * Request location permission (Android)
 */
export const requestLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    const status = await Geolocation.requestAuthorization('whenInUse');
    return status === 'granted';
  }

// Android
  try {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
    ]);

    const fineGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;
    const coarseGranted = granted[PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION] === PermissionsAndroid.RESULTS.GRANTED;

    // We consider it successful if they granted at least coarse location
    return fineGranted || coarseGranted;
  } catch (error) {
    console.error('[Location] Permission request failed:', error);
    return false;
  }
};

/**
 * Check if location permission is granted
 */
export const hasLocationPermission = async () => {
  if (Platform.OS === 'ios') {
    return true; // handled by requestAuthorization
  }

  const fineGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  const coarseGranted = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION
  );
  
  return fineGranted || coarseGranted;
};

/**
 * Get current GPS position
 * @returns {Promise<{latitude: number, longitude: number, accuracy: number, timestamp: number}>}
 */
export const getCurrentPosition = () => {
  return new Promise(async (resolve, reject) => {
    const hasPermission = await hasLocationPermission();
    if (!hasPermission) {
      const granted = await requestLocationPermission();
      if (!granted) {
        reject(new Error('Location permission denied'));
        return;
      }
    }

    Geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        console.error('[Location] getCurrentPosition error:', error);
        switch (error.code) {
          case 1:
            reject(new Error('Location permission denied'));
            break;
          case 2:
            reject(new Error('Location unavailable. Please enable GPS.'));
            break;
          case 3:
            reject(new Error('Location request timed out. Please try again.'));
            break;
          default:
            reject(new Error('Failed to get location'));
        }
      },
      {
        enableHighAccuracy: APP_CONFIG.GPS_HIGH_ACCURACY,
        timeout: APP_CONFIG.GPS_TIMEOUT,
        maximumAge: APP_CONFIG.GPS_MAX_AGE,
      }
    );
  });
};

/**
 * Watch position for real-time updates
 * @returns {number} watchId — use to clear with clearWatch
 */
export const watchPosition = (onSuccess, onError) => {
  return Geolocation.watchPosition(
    (position) => {
      onSuccess({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: position.timestamp,
      });
    },
    (error) => {
      if (onError) onError(error);
    },
    {
      enableHighAccuracy: APP_CONFIG.GPS_HIGH_ACCURACY,
      distanceFilter: 10, // Update every 10 meters
      interval: 5000,
      fastestInterval: 2000,
    }
  );
};

/**
 * Stop watching position
 */
export const clearWatch = (watchId) => {
  if (watchId !== null && watchId !== undefined) {
    Geolocation.clearWatch(watchId);
  }
};

/**
 * Format coordinates for display
 */
export const formatCoordinates = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return 'Unknown';
  }
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

/**
 * Get place name from coordinates (Reverse Geocoding)
 */
export const getPlaceName = async (lat, lng) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        headers: {
          'User-Agent': 'EmployeeAttendanceTracker/1.0',
        },
      }
    );
    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }
    const data = await response.json();
    return data.display_name || 'Unknown Location';
  } catch (error) {
    console.error('[Location] Reverse geocoding failed:', error);
    return 'Unknown Location';
  }
};

export default {
  requestLocationPermission,
  hasLocationPermission,
  getCurrentPosition,
  watchPosition,
  clearWatch,
  formatCoordinates,
  getPlaceName,
};
