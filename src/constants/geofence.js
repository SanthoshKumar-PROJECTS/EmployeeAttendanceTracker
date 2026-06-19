/**
 * Geofence Zone Definitions
 * These are the allowed office / client locations for check-in.
 * Users can only check-in when inside one of these zones.
 */

export const GEOFENCE_ZONES = [
  {
    id: 'zone_main_office',
    name: 'Main Office',
    latitude: 12.9716,     // Example: Bangalore coordinates
    longitude: 77.5946,
    radiusMeters: 200,
    isActive: true,
  },
  {
    id: 'zone_branch_office',
    name: 'Branch Office',
    latitude: 13.0827,     // Example: Secondary location
    longitude: 80.2707,
    radiusMeters: 150,
    isActive: true,
  },
  {
    id: 'zone_client_site',
    name: 'Client Site - A',
    latitude: 12.9352,
    longitude: 77.6245,
    radiusMeters: 100,
    isActive: true,
  },
];

export default GEOFENCE_ZONES;
