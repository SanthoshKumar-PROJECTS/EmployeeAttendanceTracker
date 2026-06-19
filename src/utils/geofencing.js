/**
 * Geofencing Utility
 * Haversine formula for distance calculation and boundary checking.
 */

/**
 * Calculate the distance between two GPS coordinates using the Haversine formula.
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lon1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lon2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export const haversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371000; // Earth's radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};

/**
 * Check if a position is within a geofence zone
 * @param {{ latitude: number, longitude: number }} currentPosition
 * @param {{ latitude: number, longitude: number, radiusMeters: number }} zone
 * @returns {{ isInside: boolean, distance: number }}
 */
export const isWithinGeofence = (currentPosition, zone) => {
  const distance = haversineDistance(
    currentPosition.latitude,
    currentPosition.longitude,
    zone.latitude,
    zone.longitude
  );

  return {
    isInside: distance <= zone.radiusMeters,
    distance: Math.round(distance),
    radiusMeters: zone.radiusMeters,
  };
};

/**
 * Check position against multiple geofence zones
 * @param {{ latitude: number, longitude: number }} currentPosition
 * @param {Array} zones - Array of geofence zone objects
 * @returns {{ isInsideAny: boolean, nearestZone: object, allResults: Array }}
 */
export const checkAllGeofences = (currentPosition, zones) => {
  if (!zones || zones.length === 0) {
    return { isInsideAny: false, nearestZone: null, allResults: [] };
  }

  const results = zones.map((zone) => {
    const check = isWithinGeofence(currentPosition, zone);
    return {
      zone,
      ...check,
    };
  });

  // Sort by distance (nearest first)
  results.sort((a, b) => a.distance - b.distance);

  const insideZone = results.find((r) => r.isInside);

  return {
    isInsideAny: !!insideZone,
    matchedZone: insideZone ? insideZone.zone : null,
    nearestZone: results[0],
    allResults: results,
  };
};

/**
 * Format distance for display
 */
export const formatDistance = (meters) => {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  }
  return `${(meters / 1000).toFixed(1)}km`;
};

export default {
  haversineDistance,
  isWithinGeofence,
  checkAllGeofences,
  formatDistance,
};
