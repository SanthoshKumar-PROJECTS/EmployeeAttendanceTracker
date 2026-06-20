/**
 * Attendance Service
 * Business logic for check-in / check-out operations.
 * Supports multiple sessions per day.
 */

import uuid from 'react-native-uuid';
import AttendanceRepository from '../database/repositories/AttendanceRepository';
import LocationService from './LocationService';
import GeofenceService from './GeofenceService';
import { today, now } from '../utils/dateUtils';

/**
 * Calculate total hours from a list of completed sessions (JS-based, not SQLite).
 */
const calculateTotalHoursFromSessions = (sessions) => {
  let totalMs = 0;
  for (const s of sessions) {
    if (s.checkInTime && s.checkOutTime) {
      const diff = new Date(s.checkOutTime) - new Date(s.checkInTime);
      if (!isNaN(diff) && diff >= 0) {
        totalMs += diff;
      }
    }
  }
  return (totalMs / (1000 * 60 * 60)).toFixed(1);
};

/**
 * Perform Check-In
 * 1. Auto-close any stale sessions from previous days
 * 2. Check if there's already an active (open) session
 * 3. Get GPS location
 * 4. Check geofence
 * 5. Save attendance record
 */
export const checkIn = async (userId, { selfiePath, skipGeofence, zoneName = '' } = {}) => {
  // 1. Auto-checkout stale sessions from previous days
  await AttendanceRepository.autoCheckOutStaleRecords(userId);

  // 2. Check if there's already an active session (can't double check-in)
  const activeSession = await AttendanceRepository.getActiveSession(userId);
  if (activeSession) {
    throw new Error('You already have an active session. Please check out first.');
  }

  // 3. Get current location
  let location;
  try {
    location = await LocationService.getCurrentPosition();
  } catch (error) {
    throw new Error(`Location error: ${error.message}`);
  }

  // 4. Check geofence
  let geofenceResult = { isInsideAny: !skipGeofence, matchedZone: null };
  if (!skipGeofence) {
    geofenceResult = await GeofenceService.checkPosition(location);
    if (!geofenceResult.isInsideAny) {
      const nearest = geofenceResult.nearestZone;
      throw new Error(
        `Outside Allowed Area! You are ${nearest.distance}m away from "${nearest.zone.name}". ` +
        `Please move within ${nearest.zone.radiusMeters}m of an office location to check in.`
      );
    }
  }

  // 5. Create attendance record
  const recordId = uuid.v4();
  const record = await AttendanceRepository.createRecord({
    id: recordId,
    userId,
    date: today(),
    checkInTime: now(),
    checkInLat: location.latitude,
    checkInLng: location.longitude,
    selfiePath: selfiePath || '',
    isWithinGeofence: geofenceResult.isInsideAny,
    geofenceZone: zoneName || (geofenceResult.matchedZone ? geofenceResult.matchedZone.name : 'Unknown Zone'),
  });

  return record;
};

/**
 * Perform Check-Out
 * Finds the currently active session and closes it.
 */
export const checkOut = async (userId, checkOutZoneName = '', isInsideGeofence = true) => {
  // 1. Find the active (open) session
  const activeSession = await AttendanceRepository.getActiveSession(userId);
  if (!activeSession) {
    throw new Error('No active session found. Please check in first.');
  }

  // 2. Get current location
  let location;
  try {
    location = await LocationService.getCurrentPosition();
  } catch (error) {
    // Allow check-out even without location
    location = { latitude: 0, longitude: 0 };
  }

  // 3. Update record
  const updatedRecord = await AttendanceRepository.checkOut(activeSession.id, {
    checkOutLat: location.latitude,
    checkOutLng: location.longitude,
    checkOutGeofenceZone: checkOutZoneName,
    isCheckOutWithinGeofence: isInsideGeofence,
  });

  return updatedRecord;
};

/**
 * Get today's attendance status (multi-session aware)
 * Returns:
 *   status: 'checked_in' | 'available' | 'not_checked_in'
 *   activeSession: current open session or null
 *   todaySessions: array of all sessions today
 *   totalHoursToday: summed hours from completed sessions
 */
export const getTodayStatus = async (userId) => {
  const todaySessions = await AttendanceRepository.getTodayRecords(userId);
  const activeSession = todaySessions.find(s => s.status === 'checked_in') || null;

  const completedSessions = todaySessions.filter(
    s => s.status === 'checked_out' || s.status === 'auto_checked_out'
  );
  const totalHoursToday = calculateTotalHoursFromSessions(completedSessions);

  let status;
  if (activeSession) {
    status = 'checked_in';
  } else if (todaySessions.length > 0) {
    status = 'available'; // Has sessions but none active — can check in again
  } else {
    status = 'not_checked_in';
  }

  return {
    status,
    activeSession,
    todaySessions,
    totalHoursToday,
    // Keep backward compat: "record" points to active session or most recent
    record: activeSession || (todaySessions.length > 0 ? todaySessions[todaySessions.length - 1] : null),
  };
};

/**
 * Get attendance history
 */
export const getHistory = async (userId, limit = 20, offset = 0) => {
  return AttendanceRepository.getHistory(userId, limit, offset);
};

/**
 * Get attendance for a specific month
 */
export const getMonthlyAttendance = async (userId, year, month) => {
  return AttendanceRepository.getByMonth(userId, year, month);
};

/**
 * Get this week's attendance
 */
export const getWeeklyAttendance = async (userId) => {
  return AttendanceRepository.getWeekAttendance(userId);
};

/**
 * Get attendance stats for dashboard (multi-session aware)
 */
export const getDashboardStats = async (userId) => {
  // Auto-close any stale sessions first
  await AttendanceRepository.autoCheckOutStaleRecords(userId);

  const todayStatusData = await getTodayStatus(userId);
  const weekRecords = await AttendanceRepository.getWeekAttendance(userId);
  const totalCount = await AttendanceRepository.getTotalCount(userId);
  const avgHours = await AttendanceRepository.getAverageHours(userId);
  const streak = await AttendanceRepository.getStreak(userId);

  // Current month stats
  const nowDate = new Date();
  const monthRecords = await AttendanceRepository.getByMonth(
    userId,
    nowDate.getFullYear(),
    nowDate.getMonth() + 1
  );

  // Count unique days with attendance this week
  const uniqueWeekDays = new Set(weekRecords.map(r => r.date)).size;

  return {
    today: todayStatusData,
    week: {
      records: weekRecords,
      count: uniqueWeekDays,
    },
    month: {
      records: monthRecords,
      count: new Set(monthRecords.map(r => r.date)).size,
    },
    overall: {
      totalDays: totalCount,
      averageHours: avgHours,
      streak,
    },
  };
};

export default {
  checkIn,
  checkOut,
  getTodayStatus,
  getHistory,
  getMonthlyAttendance,
  getWeeklyAttendance,
  getDashboardStats,
};
