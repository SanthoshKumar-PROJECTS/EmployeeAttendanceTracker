/**
 * User Repository
 * CRUD operations for the users table in local SQLite database.
 */

import { executeSql, queryRows, queryOne } from '../SQLiteDB';
import { now } from '../../utils/dateUtils';

const TABLE = 'users';

/**
 * Create a new user
 */
export const createUser = async ({ id, email, password, fullName, department = '', phone = '' }) => {
  const timestamp = now();
  await executeSql(
    `INSERT INTO ${TABLE} (id, email, password, fullName, department, phone, avatarPath, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, '', ?, ?)`,
    [id, email.toLowerCase().trim(), password, fullName.trim(), department, phone, timestamp, timestamp]
  );
  return findById(id);
};

/**
 * Find user by ID
 */
export const findById = async (id) => {
  return queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
};

/**
 * Find user by email
 */
export const findByEmail = async (email) => {
  return queryOne(`SELECT * FROM ${TABLE} WHERE email = ?`, [email.toLowerCase().trim()]);
};

/**
 * Update user profile
 */
export const updateUser = async (id, updates) => {
  const fields = [];
  const values = [];

  if (updates.fullName !== undefined) { fields.push('fullName = ?'); values.push(updates.fullName.trim()); }
  if (updates.department !== undefined) { fields.push('department = ?'); values.push(updates.department); }
  if (updates.phone !== undefined) { fields.push('phone = ?'); values.push(updates.phone); }
  if (updates.avatarPath !== undefined) { fields.push('avatarPath = ?'); values.push(updates.avatarPath); }
  if (updates.password !== undefined) { fields.push('password = ?'); values.push(updates.password); }
  if (updates.fcmToken !== undefined) { fields.push('fcmToken = ?'); values.push(updates.fcmToken); }

  if (fields.length === 0) return findById(id);

  fields.push('updatedAt = ?');
  values.push(now());
  values.push(id);

  await executeSql(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

/**
 * Delete a user
 */
export const deleteUser = async (id) => {
  await executeSql(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
};

/**
 * Save or update the FCM push token for a user
 */
export const updateFCMToken = async (userId, fcmToken) => {
  await executeSql(
    `UPDATE ${TABLE} SET fcmToken = ?, updatedAt = ? WHERE id = ?`,
    [fcmToken, now(), userId]
  );
};

/**
 * Get all users (admin use)
 */
export const getAllUsers = async () => {
  return queryRows(`SELECT id, email, fullName, department, phone, createdAt FROM ${TABLE} ORDER BY createdAt DESC`);
};

/**
 * Check if email exists
 */
export const emailExists = async (email) => {
  const result = await queryOne(`SELECT COUNT(*) as count FROM ${TABLE} WHERE email = ?`, [email.toLowerCase().trim()]);
  return result && result.count > 0;
};

export default {
  createUser,
  findById,
  findByEmail,
  updateUser,
  updateFCMToken,
  deleteUser,
  getAllUsers,
  emailExists,
};
