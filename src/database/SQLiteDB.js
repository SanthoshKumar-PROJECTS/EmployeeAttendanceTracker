/**
 * SQLite Database Manager
 * Handles database initialization, migrations, and provides a singleton DB instance.
 */

import SQLite from 'react-native-sqlite-storage';

// Enable promise-based API
SQLite.enablePromise(true);

let dbInstance = null;

const DB_NAME = 'EmployeeAttendance.db';
const DB_VERSION = 1;

/**
 * SQL statements for creating tables
 */
const CREATE_TABLES = [
  // Users table
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    fullName TEXT NOT NULL,
    department TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    avatarPath TEXT DEFAULT '',
    fcmToken TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,

  // Attendance records table
  `CREATE TABLE IF NOT EXISTS attendance (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    date TEXT NOT NULL,
    checkInTime TEXT,
    checkOutTime TEXT,
    checkInLat REAL,
    checkInLng REAL,
    checkOutLat REAL,
    checkOutLng REAL,
    selfiePath TEXT DEFAULT '',
    isWithinGeofence INTEGER DEFAULT 1,
    geofenceZone TEXT DEFAULT '',
    status TEXT DEFAULT 'checked_in',
    notes TEXT DEFAULT '',
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`,

  // Geofence zones table
  `CREATE TABLE IF NOT EXISTS geofence_zones (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    radiusMeters REAL DEFAULT 200,
    isActive INTEGER DEFAULT 1,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
  )`,

  // Sessions table (local token management)
  `CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    token TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    FOREIGN KEY (userId) REFERENCES users(id)
  )`,

  // App settings / key-value store
  `CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  )`,
];

/**
 * Index creation for query optimization
 */
const CREATE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_attendance_userId ON attendance(userId)',
  'CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date)',
  'CREATE INDEX IF NOT EXISTS idx_attendance_userId_date ON attendance(userId, date)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_userId ON sessions(userId)',
  'CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)',
];

/**
 * Get or initialize the database instance
 */
export const getDatabase = async () => {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    dbInstance = await SQLite.openDatabase({
      name: DB_NAME,
      location: 'default',
    });

    // Enable WAL mode for better performance
    await dbInstance.executeSql('PRAGMA journal_mode = WAL');
    await dbInstance.executeSql('PRAGMA foreign_keys = ON');

    // Create tables
    for (const sql of CREATE_TABLES) {
      await dbInstance.executeSql(sql);
    }

    // Create indexes
    for (const sql of CREATE_INDEXES) {
      await dbInstance.executeSql(sql);
    }

    // Migration: add fcmToken column to existing users tables
    try {
      await dbInstance.executeSql(`ALTER TABLE users ADD COLUMN fcmToken TEXT DEFAULT ''`);
      console.log('[SQLiteDB] Migration: added fcmToken column to users table');
    } catch (e) {
      // Column already exists — safe to ignore
    }

    console.log('[SQLiteDB] Database initialized successfully');
    return dbInstance;
  } catch (error) {
    console.error('[SQLiteDB] Failed to initialize database:', error);
    throw error;
  }
};

/**
 * Execute a SQL query with parameters
 * @param {string} sql - SQL statement
 * @param {Array} params - Query parameters
 * @returns {Array} - Result rows
 */
export const executeSql = async (sql, params = []) => {
  const db = await getDatabase();
  try {
    const [results] = await db.executeSql(sql, params);
    return results;
  } catch (error) {
    console.error('[SQLiteDB] Query failed:', sql, error);
    throw error;
  }
};

/**
 * Execute a query and return rows as an array of objects
 */
export const queryRows = async (sql, params = []) => {
  const results = await executeSql(sql, params);
  const rows = [];
  for (let i = 0; i < results.rows.length; i++) {
    rows.push(results.rows.item(i));
  }
  return rows;
};

/**
 * Execute a query and return a single row
 */
export const queryOne = async (sql, params = []) => {
  const results = await executeSql(sql, params);
  if (results.rows.length > 0) {
    return results.rows.item(0);
  }
  return null;
};

/**
 * Close the database connection
 */
export const closeDatabase = async () => {
  if (dbInstance) {
    await dbInstance.close();
    dbInstance = null;
    console.log('[SQLiteDB] Database closed');
  }
};

/**
 * Delete all data (for testing/reset)
 */
export const resetDatabase = async () => {
  const db = await getDatabase();
  await db.executeSql('DELETE FROM sessions');
  await db.executeSql('DELETE FROM attendance');
  await db.executeSql('DELETE FROM geofence_zones');
  await db.executeSql('DELETE FROM users');
  await db.executeSql('DELETE FROM settings');
  console.log('[SQLiteDB] Database reset complete');
};

export default {
  getDatabase,
  executeSql,
  queryRows,
  queryOne,
  closeDatabase,
  resetDatabase,
};
