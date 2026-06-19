/**
 * Geofence Service
 * Business logic layer for geofence operations.
 */

import GeofenceRepository from '../database/repositories/GeofenceRepository';
import { checkAllGeofences } from '../utils/geofencing';

/**
 * Initialize geofence zones (seed defaults on first launch)
 */
export const initialize = async () => {
  await GeofenceRepository.seedDefaults();
};

/**
 * Check current position against all active geofence zones
 * @param {{ latitude: number, longitude: number }} position
 * @returns {Promise<{ isInsideAny: boolean, matchedZone: object|null, nearestZone: object }>}
 */
export const checkPosition = async (position) => {
  const zones = await GeofenceRepository.getActiveZones();
  return checkAllGeofences(position, zones);
};

/**
 * Get all active zones
 */
export const getActiveZones = async () => {
  return GeofenceRepository.getActiveZones();
};

/**
 * Get all zones (including inactive)
 */
export const getAllZones = async () => {
  return GeofenceRepository.getAllZones();
};

/**
 * Add a new geofence zone
 */
export const addZone = async (zoneData) => {
  return GeofenceRepository.createZone(zoneData);
};

/**
 * Update a geofence zone
 */
export const updateZone = async (id, updates) => {
  return GeofenceRepository.updateZone(id, updates);
};

/**
 * Toggle zone active status
 */
export const toggleZone = async (id) => {
  const zone = await GeofenceRepository.findById(id);
  if (zone) {
    return GeofenceRepository.updateZone(id, { isActive: !zone.isActive });
  }
};

/**
 * Delete a zone
 */
export const deleteZone = async (id) => {
  return GeofenceRepository.deleteZone(id);
};

export default {
  initialize,
  checkPosition,
  getActiveZones,
  getAllZones,
  addZone,
  updateZone,
  toggleZone,
  deleteZone,
};
