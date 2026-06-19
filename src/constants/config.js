/**
 * App Configuration Constants
 */

export const APP_CONFIG = {
  APP_NAME: 'Employee Attendance Tracker',
  APP_VERSION: '1.0.0',

  // Local session config (simulated JWT)
  SESSION_EXPIRY_HOURS: 24,
  TOKEN_PREFIX: 'EAT',

  // Selfie storage
  SELFIE_MAX_WIDTH: 800,
  SELFIE_MAX_HEIGHT: 800,
  SELFIE_QUALITY: 70,
  SELFIE_FOLDER: 'selfies',

  // GPS config
  GPS_TIMEOUT: 15000,
  GPS_MAX_AGE: 10000,
  GPS_HIGH_ACCURACY: true,

  // Geofence default radius (meters)
  DEFAULT_GEOFENCE_RADIUS: 200,

  // Check-in/out rules
  MAX_CHECK_IN_PER_DAY: 1,
  AUTO_CHECKOUT_HOUR: 23, // Auto checkout at 11 PM if forgotten

  // Notification schedule
  CHECKIN_REMINDER_HOUR: 9,
  CHECKIN_REMINDER_MINUTE: 0,
  CHECKOUT_REMINDER_HOUR: 18,
  CHECKOUT_REMINDER_MINUTE: 0,

  // Data export
  EXPORT_FILE_PREFIX: 'attendance_export',

  // Pagination
  HISTORY_PAGE_SIZE: 20,
};

export default APP_CONFIG;
