/**
 * Employee Attendance & Field Tracking Mobile Application
 *
 * Root application component.
 * Initializes database, notification service, geofence zones,
 * and renders the navigation tree.
 * Handles auto-checkout of stale sessions at midnight / app foreground.
 */

import React, { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LogBox, AppState } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { getDatabase } from './src/database/SQLiteDB';
import GeofenceService from './src/services/GeofenceService';
import NotificationService from './src/services/NotificationService';
import AttendanceRepository from './src/database/repositories/AttendanceRepository';
import useAuthStore from './src/store/useAuthStore';
import useAttendanceStore from './src/store/useAttendanceStore';
import { setupGlobalErrorHandler } from './src/utils/errorHandler';

// Suppress known harmless warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
  'new NativeEventEmitter',
]);

/**
 * Auto-close any stale checked_in sessions from previous days.
 * Sends a notification for each auto-closed session.
 */
const handleAutoCheckOut = async () => {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return;

    const closedRecords = await AttendanceRepository.autoCheckOutStaleRecords(user.id);
    if (closedRecords.length > 0) {
      console.log(`[App] Auto-closed ${closedRecords.length} stale session(s)`);
      // Notify user for each auto-closed session
      for (const record of closedRecords) {
        await NotificationService.sendAutoCheckOutNotification(record);
      }
      // Refresh attendance data
      useAttendanceStore.getState().loadTodayStatus(user.id);
      useAttendanceStore.getState().loadDashboardStats(user.id);
    }
  } catch (error) {
    console.error('[App] Auto-checkout error:', error);
  }
};

/**
 * Schedule a timer that fires at midnight IST to auto-close stale sessions.
 */
const scheduleMidnightTimer = () => {
  const now = new Date();
  // Calculate IST midnight: next day 00:00:00 IST = previous day 18:30:00 UTC
  const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
  const nowIST = new Date(now.getTime() + istOffset + (now.getTimezoneOffset() * 60000));
  const tomorrowIST = new Date(nowIST);
  tomorrowIST.setDate(tomorrowIST.getDate() + 1);
  tomorrowIST.setHours(0, 0, 5, 0); // 12:00:05 AM IST (5 sec buffer)

  // Convert back to local time for setTimeout
  const tomorrowLocal = new Date(tomorrowIST.getTime() - istOffset - (now.getTimezoneOffset() * 60000));
  const msUntilMidnight = tomorrowLocal.getTime() - now.getTime();

  console.log(`[App] Midnight auto-checkout scheduled in ${Math.round(msUntilMidnight / 60000)} minutes`);

  return setTimeout(() => {
    handleAutoCheckOut();
    // Reschedule for next midnight
    scheduleMidnightTimer();
  }, msUntilMidnight);
};

function App() {
  const midnightTimerRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  useEffect(() => {
    initializeApp();

    // AppState listener: auto-checkout when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[App] App returned to foreground — checking for stale sessions');
        handleAutoCheckOut();
      }
      appStateRef.current = nextAppState;
    });

    // Schedule midnight timer
    midnightTimerRef.current = scheduleMidnightTimer();

    return () => {
      subscription.remove();
      if (midnightTimerRef.current) {
        clearTimeout(midnightTimerRef.current);
      }
    };
  }, []);

  const initializeApp = async () => {
    try {
      // 1. Setup global error handler
      setupGlobalErrorHandler();

      // 2. Initialize SQLite database (creates tables if needed)
      await getDatabase();
      console.log('[App] Database initialized');

      // 3. Seed default geofence zones
      await GeofenceService.initialize();
      console.log('[App] Geofence zones initialized');

      // 4. Initialize notification service (FCM + local reminders)
      await NotificationService.initialize();
      console.log('[App] Notifications initialized');

      // 5. Auto-close any stale sessions from previous days
      await handleAutoCheckOut();

    } catch (error) {
      console.error('[App] Initialization error:', error);
    }
  };

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

export default App;
