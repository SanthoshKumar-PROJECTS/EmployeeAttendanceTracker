/**
 * Auth Store (Zustand)
 * Global state management for authentication.
 */

import { create } from 'zustand';
import AuthService from '../auth/AuthService';
import NotificationService from '../services/NotificationService';

const useAuthStore = create((set, get) => ({
  // State
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // starts true for initial session restore
  isAuthLoading: false, // loading state for login/register buttons
  error: null,
  biometricInfo: null,
  _tokenRefreshUnsubscribe: null, // internal: cleans up FCM listener on logout

  // Actions

  /**
   * Initialize — restore session on app launch
   */
  initialize: async () => {
    try {
      set({ isLoading: true, error: null });
      const session = await AuthService.restoreSession();
      if (session) {
        const biometricInfo = await AuthService.checkBiometricAvailability();
        set({
          user: session.user,
          token: session.token,
          isAuthenticated: true,
          isLoading: false,
          biometricInfo,
        });
      } else {
        const biometricInfo = await AuthService.checkBiometricAvailability();
        set({ isLoading: false, biometricInfo });
      }
    } catch (error) {
      console.error('[AuthStore] Initialize error:', error);
      set({ isLoading: false, error: error.message });
    }
  },

  /**
   * Login with email & password
   */
  login: async (email, password) => {
    try {
      set({ isAuthLoading: true, error: null });
      const result = await AuthService.login(email, password);

      // Save FCM token and set up refresh listener
      await NotificationService.saveFCMTokenForUser(result.user.id);
      const unsubscribe = NotificationService.setupTokenRefresh(result.user.id);

      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isAuthLoading: false,
        error: null,
        _tokenRefreshUnsubscribe: unsubscribe,
      });

      // Send welcome back notification
      await NotificationService.sendWelcomeNotification(result.user, 'login');

      return { success: true };
    } catch (error) {
      set({ isAuthLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Register a new account
   */
  register: async ({ email, password, fullName, department, phone }) => {
    try {
      set({ isAuthLoading: true, error: null });
      const result = await AuthService.register({ email, password, fullName, department, phone });

      // Save FCM token and set up refresh listener
      await NotificationService.saveFCMTokenForUser(result.user.id);
      const unsubscribe = NotificationService.setupTokenRefresh(result.user.id);

      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isAuthLoading: false,
        error: null,
        _tokenRefreshUnsubscribe: unsubscribe,
      });

      // Send welcome notification for new user
      await NotificationService.sendWelcomeNotification(result.user, 'register');

      return { success: true };
    } catch (error) {
      set({ isAuthLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Login with biometrics
   */
  loginWithBiometric: async () => {
    try {
      set({ isAuthLoading: true, error: null });
      const result = await AuthService.loginWithBiometric();

      // Save FCM token and set up refresh listener
      await NotificationService.saveFCMTokenForUser(result.user.id);
      const unsubscribe = NotificationService.setupTokenRefresh(result.user.id);

      set({
        user: result.user,
        token: result.token,
        isAuthenticated: true,
        isAuthLoading: false,
        error: null,
        _tokenRefreshUnsubscribe: unsubscribe,
      });

      // Send welcome back notification
      await NotificationService.sendWelcomeNotification(result.user, 'login');

      return { success: true };
    } catch (error) {
      set({ isAuthLoading: false, error: error.message });
      return { success: false, error: error.message };
    }
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      // Clean up FCM token refresh listener
      const { _tokenRefreshUnsubscribe } = get();
      if (_tokenRefreshUnsubscribe) {
        _tokenRefreshUnsubscribe();
      }

      await AuthService.logout();
      
      // Refresh biometric info so the login screen knows credentials are now stored
      const biometricInfo = await AuthService.checkBiometricAvailability();

      set({
        user: null,
        token: null,
        isAuthenticated: false,
        biometricInfo,
        error: null,
        _tokenRefreshUnsubscribe: null,
      });
    } catch (error) {
      console.error('[AuthStore] Logout error:', error);
      // Force clear state even on error
      set({ user: null, token: null, isAuthenticated: false, _tokenRefreshUnsubscribe: null });
    }
  },

  /**
   * Update user profile
   */
  updateProfile: async (updates) => {
    try {
      const { user } = get();
      if (!user) return;
      const updatedUser = await AuthService.updateProfile(user.id, updates);
      set({ user: updatedUser });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Change password
   */
  changePassword: async (currentPassword, newPassword) => {
    try {
      const { user } = get();
      if (!user) throw new Error('Not authenticated');
      await AuthService.changePassword(user.id, currentPassword, newPassword);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Clear error
   */
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
