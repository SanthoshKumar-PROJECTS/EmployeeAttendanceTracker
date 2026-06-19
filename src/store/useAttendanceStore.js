/**
 * Attendance Store (Zustand)
 * Global state management for attendance operations.
 * Supports multiple sessions per day.
 */

import { create } from 'zustand';
import AttendanceService from '../services/AttendanceService';
import NotificationService from '../services/NotificationService';

const useAttendanceStore = create((set, get) => ({
  // State
  // todayStatus shape:
  //   { status: 'checked_in' | 'available' | 'not_checked_in',
  //     activeSession: record | null,
  //     todaySessions: [record, ...],
  //     totalHoursToday: '3.5',
  //     record: record | null (backward compat) }
  todayStatus: null,
  dashboardStats: null,
  history: [],
  weeklyRecords: [],
  isLoading: false,
  isCheckingIn: false,
  isCheckingOut: false,
  error: null,
  historyPage: 0,
  hasMoreHistory: true,

  /**
   * Load today's status
   */
  loadTodayStatus: async (userId) => {
    try {
      const status = await AttendanceService.getTodayStatus(userId);
      set({ todayStatus: status });
    } catch (error) {
      console.error('[AttendanceStore] loadTodayStatus error:', error);
    }
  },

  /**
   * Load dashboard stats
   */
  loadDashboardStats: async (userId) => {
    try {
      set({ isLoading: true });
      const stats = await AttendanceService.getDashboardStats(userId);
      set({ dashboardStats: stats, isLoading: false, todayStatus: stats.today });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  /**
   * Perform check-in (creates a new session)
   */
  checkIn: async (userId, options = {}) => {
    try {
      set({ isCheckingIn: true, error: null });
      const record = await AttendanceService.checkIn(userId, options);
      // Reload full today status to get updated sessions list
      const todayStatus = await AttendanceService.getTodayStatus(userId);
      set({
        isCheckingIn: false,
        todayStatus,
        error: null,
      });
      // Refresh dashboard
      get().loadDashboardStats(userId);
      // Send check-in push notification
      NotificationService.sendCheckInNotification(record);
      return { success: true, record };
    } catch (error) {
      set({ isCheckingIn: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Perform check-out (closes the active session)
   */
  checkOut: async (userId) => {
    try {
      set({ isCheckingOut: true, error: null });
      const record = await AttendanceService.checkOut(userId);
      // Reload full today status — status becomes 'available' (not 'checked_out')
      const todayStatus = await AttendanceService.getTodayStatus(userId);
      set({
        isCheckingOut: false,
        todayStatus,
        error: null,
      });
      // Refresh dashboard
      get().loadDashboardStats(userId);
      // Send check-out push notification
      NotificationService.sendCheckOutNotification(record);
      return { success: true, record };
    } catch (error) {
      set({ isCheckingOut: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Load attendance history (paginated)
   */
  loadHistory: async (userId, refresh = false) => {
    try {
      const page = refresh ? 0 : get().historyPage;
      set({ isLoading: true });
      const records = await AttendanceService.getHistory(userId, 20, page * 20);
      set({
        history: refresh ? records : [...get().history, ...records],
        historyPage: page + 1,
        hasMoreHistory: records.length === 20,
        isLoading: false,
      });
    } catch (error) {
      set({ isLoading: false, error: error.message });
    }
  },

  /**
   * Load weekly attendance
   */
  loadWeeklyRecords: async (userId) => {
    try {
      const records = await AttendanceService.getWeeklyAttendance(userId);
      set({ weeklyRecords: records });
    } catch (error) {
      console.error('[AttendanceStore] loadWeeklyRecords error:', error);
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),

  /**
   * Reset store
   */
  reset: () => set({
    todayStatus: null,
    dashboardStats: null,
    history: [],
    weeklyRecords: [],
    isLoading: false,
    isCheckingIn: false,
    isCheckingOut: false,
    error: null,
    historyPage: 0,
    hasMoreHistory: true,
  }),
}));

export default useAttendanceStore;
