import NetInfo from '@react-native-community/netinfo';
import AttendanceRepository from '../database/repositories/AttendanceRepository';
import MockApiService from './MockApiService';

class SyncService {
  constructor() {
    this.isSyncing = false;
    this.unsubscribe = null;
  }

  /**
   * Initialize the background network listener
   */
  init() {
    console.log('[SyncService] Initializing network listener...');
    this.unsubscribe = NetInfo.addEventListener(state => {
      console.log('[SyncService] Network state changed:', state.isConnected ? 'Online' : 'Offline');
      if (state.isConnected && state.isInternetReachable !== false) {
        this.syncPendingRecords();
      }
    });
  }

  /**
   * Stop listening (useful for cleanup if needed)
   */
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  /**
   * Loop through local SQLite and sync pending records to the REST API
   */
  async syncPendingRecords() {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      // 1. Fetch pending records from local SQLite DB
      const pendingRecords = await AttendanceRepository.getPendingSyncRecords();
      
      if (pendingRecords.length === 0) {
        console.log('[SyncService] No pending records to sync.');
        this.isSyncing = false;
        return;
      }

      console.log(`[SyncService] Found ${pendingRecords.length} records pending sync. Attempting upload...`);

      // 2. Push to REST API using MockApiService
      const response = await MockApiService.syncAttendance(pendingRecords);

      if (response.success) {
        // 3. Mark as synced locally
        for (const record of pendingRecords) {
          await AttendanceRepository.markRecordAsSynced(record.id);
        }
        console.log(`[SyncService] Successfully synced ${pendingRecords.length} records to the server!`);
      }
    } catch (error) {
      console.error('[SyncService] Sync failed:', error.message);
    } finally {
      this.isSyncing = false;
    }
  }
}

export default new SyncService();
