/**
 * Geofence Zone Definitions
 * These are the allowed office / client locations for check-in.
 * Users can only check-in when inside one of these zones.
 */

export const GEOFENCE_ZONES = [
  {
    id: 'zone_main_office_v5', // Bumped ID to force re-seed
    name: 'Main Office',
    locationName: '87, Gopathy Narayana Rd, Lakshimi Colony, T. Nagar, Chennai',
    latitude: 13.045672,
    longitude: 80.241572,
    radiusMeters: 200,
    isActive: true,
  },
  {
    id: 'zone_site_1',
    name: 'Site 1',
    locationName: '89, Subbarayan Nagar, Thoraipakkam, Chennai',
    latitude: 12.948383,
    longitude: 80.245552,
    radiusMeters: 200,
    isActive: true,
  },
  {
    id: 'zone_site_2',
    name: 'Site 2',
    locationName: '4/313, MMDA Colony, Maduravoyal, Chennai',
    latitude: 13.077429,
    longitude: 80.193912,
    radiusMeters: 200,
    isActive: true,
  },
];

export default GEOFENCE_ZONES;
