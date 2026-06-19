/**
 * Attendance Repository
 * CRUD operations for the attendance table in local SQLite database.
 */

import { executeSql, queryRows, queryOne } from '../SQLiteDB';
import { now, today, formatDateKey } from '../../utils/dateUtils';

const TABLE = 'attendance';

/**
 * Create a new attendance record (check-in)
 */
export const createRecord = async ({
  id,
  userId,
  date,
  checkInTime,
  checkInLat,
  checkInLng,
  selfiePath = '',
  isWithinGeofence = true,
  geofenceZone = '',
  notes = '',
}) => {
  const timestamp = now();
  await executeSql(
    `INSERT INTO ${TABLE} 
     (id, userId, date, checkInTime, checkOutTime, checkInLat, checkInLng, 
      checkOutLat, checkOutLng, selfiePath, isWithinGeofence, geofenceZone, 
      status, notes, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, NULL, ?, ?, NULL, NULL, ?, ?, ?, 'checked_in', ?, ?, ?)`,
    [id, userId, date, checkInTime, checkInLat, checkInLng,
     selfiePath, isWithinGeofence ? 1 : 0, geofenceZone, notes, timestamp, timestamp]
  );
  return findById(id);
};

/**
 * Update record for check-out
 */
export const checkOut = async (id, { checkOutLat, checkOutLng }) => {
  const timestamp = now();
  await executeSql(
    `UPDATE ${TABLE} SET 
     checkOutTime = ?, checkOutLat = ?, checkOutLng = ?, 
     status = 'checked_out', updatedAt = ?
     WHERE id = ?`,
    [timestamp, checkOutLat, checkOutLng, timestamp, id]
  );
  return findById(id);
};

/**
 * Find record by ID
 */
export const findById = async (id) => {
  return queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
};

/**
 * Get today's most recent record for a user (backward compat)
 */
export const getTodayRecord = async (userId) => {
  const todayDate = today();
  return queryOne(
    `SELECT * FROM ${TABLE} WHERE userId = ? AND date = ? ORDER BY createdAt DESC LIMIT 1`,
    [userId, todayDate]
  );
};

/**
 * Get ALL attendance records for today (multi-session support)
 */
export const getTodayRecords = async (userId) => {
  const todayDate = today();
  return queryRows(
    `SELECT * FROM ${TABLE} WHERE userId = ? AND date = ? ORDER BY checkInTime ASC`,
    [userId, todayDate]
  );
};

/**
 * Get the currently active (open) session — checked_in but not yet checked_out
 */
export const getActiveSession = async (userId) => {
  return queryOne(
    `SELECT * FROM ${TABLE} WHERE userId = ? AND status = 'checked_in' ORDER BY checkInTime DESC LIMIT 1`,
    [userId]
  );
};

/**
 * Auto-close stale checked_in records from previous days.
 * Sets checkOutTime to 11:59:59 PM IST of the record's date.
 */
export const autoCheckOutStaleRecords = async (userId) => {
  const todayDate = today();
  const staleRecords = await queryRows(
    `SELECT * FROM ${TABLE} WHERE userId = ? AND status = 'checked_in' AND date < ?`,
    [userId, todayDate]
  );

  const closedRecords = [];
  for (const record of staleRecords) {
    // Build 11:59:59 PM IST for the record's date
    // Record date is YYYY-MM-DD. We want that date at 23:59:59 IST = 18:29:59 UTC
    const checkOutTime = `${record.date}T18:29:59.000Z`;
    const timestamp = now();
    await executeSql(
      `UPDATE ${TABLE} SET 
       checkOutTime = ?, status = 'auto_checked_out', updatedAt = ?
       WHERE id = ?`,
      [checkOutTime, timestamp, record.id]
    );
    const updated = await findById(record.id);
    closedRecords.push(updated);
  }
  return closedRecords;
};

/**
 * Get attendance history for a user (paginated)
 */
export const getHistory = async (userId, limit = 20, offset = 0) => {
  return queryRows(
    `SELECT * FROM ${TABLE} WHERE userId = ? ORDER BY date DESC, checkInTime DESC LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
};

/**
 * Get attendance records for a date range
 */
export const getByDateRange = async (userId, startDate, endDate) => {
  return queryRows(
    `SELECT * FROM ${TABLE} WHERE userId = ? AND date BETWEEN ? AND ? ORDER BY date ASC`,
    [userId, startDate, endDate]
  );
};

/**
 * Get attendance for a specific month
 */
export const getByMonth = async (userId, year, month) => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return getByDateRange(userId, startDate, endDate);
};

/**
 * Get attendance count for current week
 */
export const getWeekAttendance = async (userId) => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const weekStart = new Date(d.setDate(diff));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  return queryRows(
    `SELECT * FROM ${TABLE} WHERE userId = ? AND date BETWEEN ? AND ? ORDER BY date ASC`,
    [userId, formatDateKey(weekStart), formatDateKey(weekEnd)]
  );
};

/**
 * Get total attendance count for a user
 */
export const getTotalCount = async (userId) => {
  const result = await queryOne(
    `SELECT COUNT(*) as count FROM ${TABLE} WHERE userId = ?`,
    [userId]
  );
  return result ? result.count : 0;
};

export const getAverageHours = async (userId) => {
  const records = await queryRows(
    `SELECT checkInTime, checkOutTime FROM ${TABLE} 
     WHERE userId = ? AND checkOutTime IS NOT NULL AND status IN ('checked_out', 'auto_checked_out')`,
    [userId]
  );
  
  if (!records || records.length === 0) return '0.0';

  let totalMs = 0;
  let validRecords = 0;

  for (const r of records) {
    if (r.checkInTime && r.checkOutTime) {
      const diff = new Date(r.checkOutTime) - new Date(r.checkInTime);
      if (!isNaN(diff) && diff >= 0) {
        totalMs += diff;
        validRecords++;
      }
    }
  }

  if (validRecords === 0) return '0.0';

  const avgMs = totalMs / validRecords;
  const avgHrs = avgMs / (1000 * 60 * 60);
  return avgHrs.toFixed(1);
};

/**
 * Get attendance streak (consecutive days)
 */
export const getStreak = async (userId) => {
  const records = await queryRows(
    `SELECT DISTINCT date FROM ${TABLE} WHERE userId = ? ORDER BY date DESC`,
    [userId]
  );

  if (records.length === 0) return 0;

  let streak = 0;
  let currentDate = new Date();

  // Check if checked in today
  const todayDate = today();
  const hasToday = records.some(r => r.date === todayDate);

  if (!hasToday) {
    // Check yesterday
    currentDate.setDate(currentDate.getDate() - 1);
  }

  for (const record of records) {
    const checkDate = formatDateKey(currentDate);
    if (record.date === checkDate) {
      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
      // Skip weekends
      while (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
        currentDate.setDate(currentDate.getDate() - 1);
      }
    } else {
      break;
    }
  }

  return streak;
};

/**
 * Get all records (for export)
 */
export const getAllRecords = async (userId) => {
  return queryRows(
    `SELECT * FROM ${TABLE} WHERE userId = ? ORDER BY date DESC`,
    [userId]
  );
};

/**
 * Delete a record
 */
export const deleteRecord = async (id) => {
  await executeSql(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
};

/**
 * Delete all records for a user
 */
export const deleteAllForUser = async (userId) => {
  await executeSql(`DELETE FROM ${TABLE} WHERE userId = ?`, [userId]);
};

export default {
  createRecord,
  checkOut,
  findById,
  getTodayRecord,
  getTodayRecords,
  getActiveSession,
  autoCheckOutStaleRecords,
  getHistory,
  getByDateRange,
  getByMonth,
  getWeekAttendance,
  getTotalCount,
  getAverageHours,
  getStreak,
  getAllRecords,
  deleteRecord,
  deleteAllForUser,
};
