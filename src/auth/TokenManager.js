/**
 * Token Manager
 * Simulates JWT-like token management using local generation.
 * Generates session tokens with expiry, validates them locally.
 */

import uuid from 'react-native-uuid';
import { executeSql, queryOne } from '../database/SQLiteDB';
import { APP_CONFIG } from '../constants/config';

/**
 * Generate a local session token (simulating JWT)
 * Format: EAT.<uuid>.<timestamp>
 */
export const generateToken = () => {
  const tokenId = uuid.v4();
  const timestamp = Date.now();
  return `${APP_CONFIG.TOKEN_PREFIX}.${tokenId}.${timestamp}`;
};

/**
 * Create a new session in the database
 */
export const createSession = async (userId) => {
  const token = generateToken();
  const sessionId = uuid.v4();
  const createdAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + APP_CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  // Clear any existing sessions for this user
  await executeSql('DELETE FROM sessions WHERE userId = ?', [userId]);

  // Create new session
  await executeSql(
    'INSERT INTO sessions (id, userId, token, expiresAt, createdAt) VALUES (?, ?, ?, ?, ?)',
    [sessionId, userId, token, expiresAt, createdAt]
  );

  return { token, expiresAt };
};

/**
 * Validate a session token
 * @returns {object|null} Session data with userId if valid, null if invalid
 */
export const validateToken = async (token) => {
  if (!token || !token.startsWith(APP_CONFIG.TOKEN_PREFIX)) {
    return null;
  }

  const session = await queryOne(
    'SELECT * FROM sessions WHERE token = ?',
    [token]
  );

  if (!session) return null;

  // Check expiry
  const expiresAt = new Date(session.expiresAt);
  if (expiresAt < new Date()) {
    // Token expired — clean up
    await executeSql('DELETE FROM sessions WHERE id = ?', [session.id]);
    return null;
  }

  return {
    userId: session.userId,
    expiresAt: session.expiresAt,
    createdAt: session.createdAt,
  };
};

/**
 * Refresh a session (extend expiry)
 */
export const refreshSession = async (token) => {
  const newExpiresAt = new Date(
    Date.now() + APP_CONFIG.SESSION_EXPIRY_HOURS * 60 * 60 * 1000
  ).toISOString();

  await executeSql(
    'UPDATE sessions SET expiresAt = ? WHERE token = ?',
    [newExpiresAt, token]
  );

  return { token, expiresAt: newExpiresAt };
};

/**
 * Destroy a session (logout)
 */
export const destroySession = async (token) => {
  await executeSql('DELETE FROM sessions WHERE token = ?', [token]);
};

/**
 * Destroy all sessions for a user
 */
export const destroyAllSessions = async (userId) => {
  await executeSql('DELETE FROM sessions WHERE userId = ?', [userId]);
};

/**
 * Clean up expired sessions
 */
export const cleanupExpiredSessions = async () => {
  const now = new Date().toISOString();
  await executeSql('DELETE FROM sessions WHERE expiresAt < ?', [now]);
};

export default {
  generateToken,
  createSession,
  validateToken,
  refreshSession,
  destroySession,
  destroyAllSessions,
  cleanupExpiredSessions,
};
