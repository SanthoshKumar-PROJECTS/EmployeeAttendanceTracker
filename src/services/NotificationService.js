/**
 * Notification Service
 * Handles FCM push notifications and local scheduled notifications.
 * Firebase is used ONLY for push notification delivery.
 */

import messaging from '@react-native-firebase/messaging';
import notifee, { TriggerType, RepeatFrequency, AndroidImportance } from '@notifee/react-native';
import { Platform, PermissionsAndroid } from 'react-native';
import { APP_CONFIG } from '../constants/config';
import UserRepository from '../database/repositories/UserRepository';
import { formatTimeIST, getISTGreeting } from '../utils/dateUtils';

/**
 * Request notification permission
 */
export const requestPermission = async () => {
  if (Platform.OS === 'android' && Platform.Version >= 33) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // iOS
  const authStatus = await messaging().requestPermission();
  return (
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL
  );
};

/**
 * Create notification channel (Android)
 */
export const createChannels = async () => {
  await notifee.createChannel({
    id: 'attendance-reminders',
    name: 'Attendance Reminders',
    description: 'Check-in and check-out reminders',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await notifee.createChannel({
    id: 'attendance-alerts',
    name: 'Attendance Alerts',
    description: 'Important attendance notifications',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  await notifee.createChannel({
    id: 'attendance-welcome',
    name: 'Welcome',
    description: 'Welcome and onboarding notifications',
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });

  await notifee.createChannel({
    id: 'attendance-checkin',
    name: 'Check-In / Check-Out',
    description: 'Confirmation notifications for attendance actions',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });
};

/**
 * Get FCM token for push notifications
 */
export const getFCMToken = async () => {
  try {
    const token = await messaging().getToken();
    console.log('[Notification] FCM Token:', token);
    return token;
  } catch (error) {
    console.error('[Notification] Failed to get FCM token:', error);
    return null;
  }
};

/**
 * Fetch FCM token and save it to the user record in SQLite.
 * Should be called after every successful login or registration.
 *
 * @param {string} userId - The logged-in user's ID
 * @returns {string|null} - The FCM token that was saved, or null on failure
 */
export const saveFCMTokenForUser = async (userId) => {
  try {
    const token = await getFCMToken();
    if (token && userId) {
      await UserRepository.updateFCMToken(userId, token);
      console.log('[Notification] FCM token saved for user:', userId);
    }
    return token;
  } catch (error) {
    console.error('[Notification] Failed to save FCM token for user:', error);
    return null;
  }
};

/**
 * Set up a listener that auto-updates the FCM token whenever Firebase rotates it.
 * Call this once after the user is authenticated.
 *
 * @param {string} userId - The logged-in user's ID
 * @returns {Function} - Unsubscribe function; call on logout
 */
export const setupTokenRefresh = (userId) => {
  const unsubscribe = messaging().onTokenRefresh(async (newToken) => {
    console.log('[Notification] FCM token refreshed, updating for user:', userId);
    try {
      await UserRepository.updateFCMToken(userId, newToken);
    } catch (error) {
      console.error('[Notification] Failed to update refreshed FCM token:', error);
    }
  });
  return unsubscribe;
};

/**
 * Set up foreground notification handler
 */
export const setupForegroundHandler = () => {
  return messaging().onMessage(async (remoteMessage) => {
    console.log('[Notification] Foreground message:', remoteMessage);

    // Display using notifee
    await notifee.displayNotification({
      title: remoteMessage.notification?.title || 'Attendance Tracker',
      body: remoteMessage.notification?.body || '',
      android: {
        channelId: 'attendance-alerts',
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
      },
    });
  });
};

/**
 * Set up background notification handler
 */
export const setupBackgroundHandler = () => {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('[Notification] Background message:', remoteMessage);
  });
};

/**
 * Display a local notification immediately
 */
export const showLocalNotification = async (title, body, channelId = 'attendance-alerts') => {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId,
      smallIcon: 'ic_notification',
      pressAction: { id: 'default' },
    },
  });
};

/**
 * Send a welcome push notification to the user after login or registration.
 *
 * @param {Object} user - The authenticated user object (must have fullName)
 * @param {'login'|'register'} type - Whether this is a login or new registration
 */
export const sendWelcomeNotification = async (user, type = 'login') => {
  try {
    const firstName = user?.fullName?.split(' ')[0] || 'there';
    const isNewUser = type === 'register';
    const greeting = getISTGreeting().toLowerCase();

    const title = isNewUser
      ? `🎉 Welcome to Employee Tracker, ${firstName}!`
      : `👋 Good ${greeting}, ${firstName}!`;

    const body = isNewUser
      ? "Your account is all set. Let's get started with your first check-in!"
      : "Glad to have you back! Don't forget to check in today.";

    await notifee.displayNotification({
      title,
      body,
      android: {
        channelId: 'attendance-welcome',
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
        // Auto-dismiss after showing
        autoCancel: true,
      },
    });

    console.log(`[Notification] Welcome notification sent (${type}) for:`, user?.fullName);
  } catch (error) {
    console.error('[Notification] Failed to send welcome notification:', error);
  }
};

/**
 * Send a confirmation notification after a successful check-in.
 *
 * @param {Object} record - The attendance record returned from AttendanceService.checkIn()
 */
export const sendCheckInNotification = async (record) => {
  try {
    const timeStr = record?.checkInTime ? formatTimeIST(record.checkInTime) : 'just now';
    const zone = record?.geofenceZone ? ` at ${record.geofenceZone}` : '';
    const withinZone = record?.isWithinGeofence === 1 || record?.isWithinGeofence === true;

    await notifee.displayNotification({
      title: '✅ Checked In Successfully!',
      body: `Attendance recorded at ${timeStr}${zone}. ${withinZone ? 'You are within the allowed area.' : 'Note: Outside the allowed geofence zone.'}`  ,
      android: {
        channelId: 'attendance-checkin',
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
        autoCancel: true,
      },
    });
    console.log('[Notification] Check-in notification sent');
  } catch (error) {
    console.error('[Notification] Failed to send check-in notification:', error);
  }
};

/**
 * Send a confirmation notification after a successful check-out.
 *
 * @param {Object} record - The attendance record returned from AttendanceService.checkOut()
 */
export const sendCheckOutNotification = async (record) => {
  try {
    const checkOutTime = record?.checkOutTime ? formatTimeIST(record.checkOutTime) : 'just now';

    // Calculate total hours worked
    let durationText = '';
    if (record?.checkInTime && record?.checkOutTime) {
      const diffMs = new Date(record.checkOutTime) - new Date(record.checkInTime);
      const totalMins = Math.floor(diffMs / 60000);
      const hrs = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      durationText = hrs > 0
        ? ` Total: ${hrs}h ${mins}m worked.`
        : ` Total: ${mins}m worked.`;
    }

    const greeting = getISTGreeting().toLowerCase();

    await notifee.displayNotification({
      title: '🏠 Checked Out — See You Tomorrow!',
      body: `You checked out at ${checkOutTime}.${durationText} Have a great ${greeting}!`,
      android: {
        channelId: 'attendance-checkin',
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
        autoCancel: true,
      },
    });
    console.log('[Notification] Check-out notification sent');
  } catch (error) {
    console.error('[Notification] Failed to send check-out notification:', error);
  }
};

/**
 * Schedule daily check-in reminder
 */
export const scheduleCheckInReminder = async () => {
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: getNextTriggerTime(
      APP_CONFIG.CHECKIN_REMINDER_HOUR,
      APP_CONFIG.CHECKIN_REMINDER_MINUTE
    ),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      title: '⏰ Time to Check In!',
      body: "Good morning! Don't forget to mark your attendance.",
      android: {
        channelId: 'attendance-reminders',
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
      },
    },
    trigger
  );
};

/**
 * Schedule daily check-out reminder
 */
export const scheduleCheckOutReminder = async () => {
  const trigger = {
    type: TriggerType.TIMESTAMP,
    timestamp: getNextTriggerTime(
      APP_CONFIG.CHECKOUT_REMINDER_HOUR,
      APP_CONFIG.CHECKOUT_REMINDER_MINUTE
    ),
    repeatFrequency: RepeatFrequency.DAILY,
  };

  await notifee.createTriggerNotification(
    {
      title: '🏠 Time to Check Out!',
      body: 'End of day! Remember to check out before leaving.',
      android: {
        channelId: 'attendance-reminders',
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
      },
    },
    trigger
  );
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllScheduled = async () => {
  await notifee.cancelAllNotifications();
};

/**
 * Send a notification when a session is automatically closed at midnight.
 *
 * @param {Object} record - The auto-closed attendance record
 */
export const sendAutoCheckOutNotification = async (record) => {
  try {
    const dateStr = record?.date || 'a previous day';
    await notifee.displayNotification({
      title: '⏰ Session Auto-Closed',
      body: `Your session from ${dateStr} was automatically closed at 11:59 PM since it wasn't checked out.`,
      android: {
        channelId: 'attendance-checkin',
        smallIcon: 'ic_notification',
        pressAction: { id: 'default' },
        autoCancel: true,
      },
    });
    console.log('[Notification] Auto-checkout notification sent');
  } catch (error) {
    console.error('[Notification] Failed to send auto-checkout notification:', error);
  }
};

/**
 * Initialize notification service
 */
export const initialize = async () => {
  await requestPermission();
  await createChannels();
  setupForegroundHandler();
  await scheduleCheckInReminder();
  await scheduleCheckOutReminder();
};

/**
 * Helper: Get the next occurrence of a specific time
 */
const getNextTriggerTime = (hour, minute) => {
  const now = new Date();
  const trigger = new Date();
  trigger.setHours(hour, minute, 0, 0);

  // If the time has already passed today, schedule for tomorrow
  if (trigger <= now) {
    trigger.setDate(trigger.getDate() + 1);
  }

  return trigger.getTime();
};

export default {
  requestPermission,
  createChannels,
  getFCMToken,
  saveFCMTokenForUser,
  setupTokenRefresh,
  setupForegroundHandler,
  setupBackgroundHandler,
  showLocalNotification,
  sendWelcomeNotification,
  sendCheckInNotification,
  sendCheckOutNotification,
  sendAutoCheckOutNotification,
  scheduleCheckInReminder,
  scheduleCheckOutReminder,
  cancelAllScheduled,
  initialize,
};
