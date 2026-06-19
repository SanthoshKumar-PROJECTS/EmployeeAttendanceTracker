/**
 * Export Service
 * Handles data export/import as JSON files for backup and data portability.
 * This replaces the "sync" functionality since we have no backend.
 */

import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import AttendanceRepository from '../database/repositories/AttendanceRepository';
import UserRepository from '../database/repositories/UserRepository';
import { APP_CONFIG } from '../constants/config';

/**
 * Export all attendance data as JSON
 */
export const exportData = async (userId) => {
  try {
    // Gather data
    const user = await UserRepository.findById(userId);
    const records = await AttendanceRepository.getAllRecords(userId);

    const exportPayload = {
      exportedAt: new Date().toISOString(),
      appVersion: APP_CONFIG.APP_VERSION,
      user: {
        email: user.email,
        fullName: user.fullName,
        department: user.department,
      },
      totalRecords: records.length,
      attendance: records.map((r) => ({
        date: r.date,
        checkInTime: r.checkInTime,
        checkOutTime: r.checkOutTime,
        checkInLocation: r.checkInLat ? { lat: r.checkInLat, lng: r.checkInLng } : null,
        checkOutLocation: r.checkOutLat ? { lat: r.checkOutLat, lng: r.checkOutLng } : null,
        isWithinGeofence: !!r.isWithinGeofence,
        geofenceZone: r.geofenceZone,
        status: r.status,
      })),
    };

    // Write to file
    const fileName = `${APP_CONFIG.EXPORT_FILE_PREFIX}_${Date.now()}.json`;
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
    await RNFS.writeFile(filePath, JSON.stringify(exportPayload, null, 2), 'utf8');

    return { filePath, fileName, recordCount: records.length };
  } catch (error) {
    console.error('[Export] Export failed:', error);
    throw new Error('Failed to export data: ' + error.message);
  }
};

/**
 * Share exported JSON file via system share sheet
 */
export const shareExport = async (userId) => {
  const { filePath, fileName, recordCount } = await exportData(userId);

  try {
    await Share.open({
      url: `file://${filePath}`,
      type: 'application/json',
      filename: fileName,
      title: 'Export Attendance Data',
      message: `Attendance data export (${recordCount} records)`,
    });
    return { success: true, recordCount };
  } catch (error) {
    if (error.message && error.message.includes('User did not share')) {
      return { success: false, cancelled: true };
    }
    throw error;
  }
};

/**
 * Get export file size for display
 */
export const getExportSize = async (userId) => {
  try {
    const records = await AttendanceRepository.getAllRecords(userId);
    // Rough estimate: ~200 bytes per record in JSON
    const estimatedBytes = records.length * 200 + 500;
    return formatFileSize(estimatedBytes);
  } catch (error) {
    return 'Unknown';
  }
};

/**
 * Format bytes to human-readable string
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default {
  exportData,
  shareExport,
  getExportSize,
};
