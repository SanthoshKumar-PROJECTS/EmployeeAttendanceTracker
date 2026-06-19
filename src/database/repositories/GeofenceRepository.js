/**
 * Geofence Repository
 * CRUD operations for the geofence_zones table in local SQLite database.
 */

import { executeSql, queryRows, queryOne } from '../SQLiteDB';
import { now } from '../../utils/dateUtils';
import { GEOFENCE_ZONES } from '../../constants/geofence';

const TABLE = 'geofence_zones';

/**
 * Seed default geofence zones (runs once on first app launch)
 */
export const seedDefaults = async () => {
  const existing = await queryOne(`SELECT COUNT(*) as count FROM ${TABLE}`);
  if (existing && existing.count > 0) return; // Already seeded

  const timestamp = now();
  for (const zone of GEOFENCE_ZONES) {
    await executeSql(
      `INSERT OR IGNORE INTO ${TABLE} (id, name, latitude, longitude, radiusMeters, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [zone.id, zone.name, zone.latitude, zone.longitude, zone.radiusMeters, zone.isActive ? 1 : 0, timestamp, timestamp]
    );
  }
  console.log('[GeofenceRepo] Default zones seeded');
};

/**
 * Get all active geofence zones
 */
export const getActiveZones = async () => {
  return queryRows(`SELECT * FROM ${TABLE} WHERE isActive = 1 ORDER BY name ASC`);
};

/**
 * Get all zones
 */
export const getAllZones = async () => {
  return queryRows(`SELECT * FROM ${TABLE} ORDER BY name ASC`);
};

/**
 * Find zone by ID
 */
export const findById = async (id) => {
  return queryOne(`SELECT * FROM ${TABLE} WHERE id = ?`, [id]);
};

/**
 * Create a new zone
 */
export const createZone = async ({ id, name, latitude, longitude, radiusMeters = 200 }) => {
  const timestamp = now();
  await executeSql(
    `INSERT INTO ${TABLE} (id, name, latitude, longitude, radiusMeters, isActive, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
    [id, name, latitude, longitude, radiusMeters, timestamp, timestamp]
  );
  return findById(id);
};

/**
 * Update a zone
 */
export const updateZone = async (id, updates) => {
  const fields = [];
  const values = [];

  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.latitude !== undefined) { fields.push('latitude = ?'); values.push(updates.latitude); }
  if (updates.longitude !== undefined) { fields.push('longitude = ?'); values.push(updates.longitude); }
  if (updates.radiusMeters !== undefined) { fields.push('radiusMeters = ?'); values.push(updates.radiusMeters); }
  if (updates.isActive !== undefined) { fields.push('isActive = ?'); values.push(updates.isActive ? 1 : 0); }

  if (fields.length === 0) return findById(id);

  fields.push('updatedAt = ?');
  values.push(now());
  values.push(id);

  await executeSql(`UPDATE ${TABLE} SET ${fields.join(', ')} WHERE id = ?`, values);
  return findById(id);
};

/**
 * Delete a zone
 */
export const deleteZone = async (id) => {
  await executeSql(`DELETE FROM ${TABLE} WHERE id = ?`, [id]);
};

export default {
  seedDefaults,
  getActiveZones,
  getAllZones,
  findById,
  createZone,
  updateZone,
  deleteZone,
};
