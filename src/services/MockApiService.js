import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import * as Keychain from 'react-native-keychain';

// Create a real axios instance
const api = axios.create({
  baseURL: 'https://api.yourcompany.com/v1',
  timeout: 5000,
});

// Setup mock adapter
const mock = new MockAdapter(api, { delayResponse: 800 });

// Mock endpoints
mock.onPost('/auth/login').reply(config => {
  const { email, password } = JSON.parse(config.data);
  if (email && password) {
    return [200, { token: 'mock-jwt-token-xyz-123', user: { email } }];
  }
  return [401, { message: 'Invalid credentials' }];
});

mock.onPost('/attendance/sync').reply(config => {
  // Require Authorization header to demonstrate JWT usage
  if (!config.headers.Authorization || !config.headers.Authorization.startsWith('Bearer ')) {
    return [401, { message: 'Unauthorized. Missing JWT token.' }];
  }

  const { records } = JSON.parse(config.data);
  console.log(`[Mock API] Successfully received ${records.length} records for sync.`);
  
  return [200, { success: true, syncedCount: records.length }];
});

mock.onPost('/users/fcm-token').reply(config => {
  return [200, { success: true }];
});

/**
 * Helper to get the JWT token from Keychain
 */
const getAuthHeaders = async () => {
  const credentials = await Keychain.getGenericPassword();
  const token = credentials ? credentials.password : 'fallback-token';
  return { Authorization: `Bearer ${token}` };
};

/**
 * Service to interact with the Mock API
 */
export const MockApiService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  syncAttendance: async (records) => {
    const headers = await getAuthHeaders();
    const response = await api.post('/attendance/sync', { records }, { headers });
    return response.data;
  },

  updateFCMToken: async (token) => {
    const headers = await getAuthHeaders();
    const response = await api.post('/users/fcm-token', { token }, { headers });
    return response.data;
  }
};

export default MockApiService;
