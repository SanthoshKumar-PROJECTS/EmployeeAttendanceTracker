/**
 * Auth Service
 * Handles user registration, login, logout, and session management.
 * All authentication is handled locally — no backend required.
 */

import uuid from 'react-native-uuid';
import UserRepository from '../database/repositories/UserRepository';
import TokenManager from './TokenManager';
import SecureStorageService from './SecureStorageService';
import BiometricService from './BiometricService';

/**
 * Simple hash function for password storage.
 * In production, use bcrypt/argon2 via native module.
 * This uses a basic Base64 encode with salt for demo purposes.
 */
const hashPassword = (password, salt = '') => {
  // Simple reversible encoding for demo — in production use bcrypt
  const combined = `${salt}:${password}`;
  
  // Pure JavaScript Base64 implementation to support Hermes without external dependencies
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let base64 = '';
  let i = 0;
  while (i < combined.length) {
    const c1 = combined.charCodeAt(i++);
    const c2 = i < combined.length ? combined.charCodeAt(i++) : NaN;
    const c3 = i < combined.length ? combined.charCodeAt(i++) : NaN;

    const byte1 = c1 >> 2;
    const byte2 = ((c1 & 3) << 4) | (isNaN(c2) ? 0 : c2 >> 4);
    const byte3 = isNaN(c2) ? 64 : ((c2 & 15) << 2) | (isNaN(c3) ? 0 : c3 >> 6);
    const byte4 = isNaN(c3) ? 64 : c3 & 63;

    base64 += chars.charAt(byte1) + chars.charAt(byte2) + 
              (byte3 === 64 ? '=' : chars.charAt(byte3)) + 
              (byte4 === 64 ? '=' : chars.charAt(byte4));
  }
  return `hashed:${base64}`;
};

const verifyPassword = (password, hashedPassword, salt = '') => {
  return hashPassword(password, salt) === hashedPassword;
};

/**
 * Register a new user
 */
export const register = async ({ email, password, fullName, department = '', phone = '' }) => {
  // Validate inputs
  if (!email || !password || !fullName) {
    throw new Error('Email, password, and full name are required');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters');
  }

  // Check if email already exists
  const existingUser = await UserRepository.findByEmail(email);
  if (existingUser) {
    throw new Error('An account with this email already exists');
  }

  // Create user
  const userId = uuid.v4();
  const hashedPassword = hashPassword(password, userId);

  const user = await UserRepository.createUser({
    id: userId,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    fullName,
    department,
    phone,
  });

  // Create session
  const session = await TokenManager.createSession(userId);

  // Store token securely
  await SecureStorageService.storeToken(session.token);

  // Store credentials for biometric login
  await SecureStorageService.storeCredentials(email.toLowerCase().trim(), password);

  return {
    user: sanitizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
};

/**
 * Login with email and password
 */
export const login = async (email, password) => {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  // Find user
  const user = await UserRepository.findByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  // Verify password
  if (!verifyPassword(password, user.password, user.id)) {
    throw new Error('Invalid email or password');
  }

  // Create session
  const session = await TokenManager.createSession(user.id);

  // Store token securely
  await SecureStorageService.storeToken(session.token);

  // Update stored credentials for biometric
  await SecureStorageService.storeCredentials(email.toLowerCase().trim(), password);

  return {
    user: sanitizeUser(user),
    token: session.token,
    expiresAt: session.expiresAt,
  };
};

/**
 * Login with biometric authentication
 * Uses stored credentials after biometric verification
 */
export const loginWithBiometric = async () => {
  // Verify biometric
  const biometricResult = await BiometricService.authenticate('Login with biometrics');
  if (!biometricResult.success) {
    throw new Error(biometricResult.error || 'Biometric authentication failed');
  }

  // Get stored credentials
  const credentials = await SecureStorageService.getCredentials();
  if (!credentials) {
    throw new Error('No stored credentials found. Please login with email and password first.');
  }

  // Login with stored credentials
  return login(credentials.email, credentials.password);
};

/**
 * Restore session from stored token (app launch)
 */
export const restoreSession = async () => {
  try {
    const token = await SecureStorageService.getToken();
    if (!token) return null;

    const session = await TokenManager.validateToken(token);
    if (!session) {
      await SecureStorageService.clearAll();
      return null;
    }

    const user = await UserRepository.findById(session.userId);
    if (!user) {
      await TokenManager.destroySession(token);
      await SecureStorageService.clearAll();
      return null;
    }

    // Refresh session
    await TokenManager.refreshSession(token);

    return {
      user: sanitizeUser(user),
      token,
    };
  } catch (error) {
    console.error('[AuthService] Session restore failed:', error);
    return null;
  }
};

/**
 * Logout — clear session and stored credentials
 */
export const logout = async () => {
  try {
    const token = await SecureStorageService.getToken();
    if (token) {
      await TokenManager.destroySession(token);
    }
    // Note: we keep credentials in keychain for biometric login next time
    // Only clear the session token
    await SecureStorageService.storeToken('');
  } catch (error) {
    console.error('[AuthService] Logout error:', error);
  }
};

/**
 * Change password
 */
export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await UserRepository.findById(userId);
  if (!user) throw new Error('User not found');

  if (!verifyPassword(currentPassword, user.password, user.id)) {
    throw new Error('Current password is incorrect');
  }

  if (newPassword.length < 6) {
    throw new Error('New password must be at least 6 characters');
  }

  const newHash = hashPassword(newPassword, user.id);
  await UserRepository.updateUser(userId, { password: newHash });

  // Update stored credentials
  await SecureStorageService.storeCredentials(user.email, newPassword);

  return true;
};

/**
 * Update user profile
 */
export const updateProfile = async (userId, updates) => {
  const user = await UserRepository.updateUser(userId, updates);
  return sanitizeUser(user);
};

/**
 * Remove sensitive fields from user object before returning
 */
const sanitizeUser = (user) => {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
};

/**
 * Check if biometric login is available
 */
export const checkBiometricAvailability = async () => {
  const biometric = await BiometricService.checkBiometricAvailability();
  const hasCredentials = await SecureStorageService.getCredentials();
  return {
    ...biometric,
    hasStoredCredentials: !!hasCredentials,
  };
};

export default {
  register,
  login,
  loginWithBiometric,
  restoreSession,
  logout,
  changePassword,
  updateProfile,
  checkBiometricAvailability,
};
