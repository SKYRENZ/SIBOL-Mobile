import axios, { AxiosInstance, AxiosError } from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Merge sources (Expo config extras + process.env)
const extras = (Constants as any).expoConfig?.extra ?? {};
const env = { ...(process.env as any), ...extras };

const envApiBaseWeb = env?.EXPO_PUBLIC_API_BASE_WEB;
const envApiBaseMobile = env?.EXPO_PUBLIC_API_BASE_MOBILE;

// Backward-compatible single var
const envApiBaseLegacy = env?.EXPO_PUBLIC_API_BASE;

const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2' : 'http://localhost';
const DEFAULT_PORT = 5000;

const normalizeUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/$/, '');
  // Axios baseURL must include scheme
  if (!/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`;
  return trimmed;
};

const platformEnvBase =
  Platform.OS === 'web' ? envApiBaseWeb : envApiBaseMobile;

export const API_BASE = normalizeUrl(
  (global as any).API_BASE_OVERRIDE ??
    platformEnvBase ??
    envApiBaseLegacy ??
    `${DEFAULT_HOST}:${DEFAULT_PORT}`
);

console.log('[mobile api] Platform:', Platform.OS);
console.log('[mobile api] API_BASE =', API_BASE);

const CLIENT_TYPE = Platform.OS === 'web' ? 'web' : 'mobile'; // ✅ ADD

// ✅ Create Axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'x-client-type': CLIENT_TYPE, // ✅ ADD
  },
});

// ✅ Request Interceptor - Attach auth token
apiClient.interceptors.request.use(
  async (config) => {
    // ✅ ensure header is always present
    config.headers = config.headers ?? {};
    (config.headers as any)['x-client-type'] =
      (config.headers as any)['x-client-type'] ?? CLIENT_TYPE;

    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (err) {
      console.error('[Axios] Failed to get token:', err);
    }

    // ✅ If sending FormData, remove JSON content-type so axios can set multipart boundary
    const isFormData =
      typeof FormData !== 'undefined' && config.data instanceof FormData;

    if (isFormData) {
      // axios will set the correct multipart/form-data; boundary=...
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }

    return config;
  },
  (error) => {
    console.error('[Axios] Request error:', error);
    return Promise.reject(error);
  }
);

// ✅ Response Interceptor - Handle errors
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[Axios Success] ${response.config.method?.toUpperCase()} ${response.config.url}`);
    return response;
  },
  (error: AxiosError) => {
    if (error.response) {
      // Server responded with error status
      const message = (error.response.data as any)?.message || 
                     (error.response.data as any)?.error || 
                     error.message;
      console.error(`[Axios Error] ${error.response.status}:`, message);
      
      const err: any = new Error(message);
      err.status = error.response.status;
      err.payload = error.response.data;
      return Promise.reject(err);
    } else if (error.request) {
      // Request made but no response
      console.error('[Axios] Network error - no response from server');
      return Promise.reject(new Error('Cannot connect to server. Please check your network.'));
    } else {
      // Something else happened
      console.error('[Axios] Error:', error.message);
      return Promise.reject(error);
    }
  }
);

// ✅ Export convenience methods (same signature as before!)
export const get = async <T = any>(path: string, config?: any): Promise<T> => {
  const response = await apiClient.get<T>(path, config); // ✅ Now accepts config
  return response.data;
};

export const post = async <T = any>(path: string, body?: any): Promise<T> => {
  const response = await apiClient.post<T>(path, body);
  return response.data;
};

export const put = async <T = any>(path: string, body?: any): Promise<T> => {
  const response = await apiClient.put<T>(path, body);
  return response.data;
};

export const patch = async <T = any>(path: string, body?: any): Promise<T> => {
  const response = await apiClient.patch<T>(path, body);
  return response.data;
};

export const del = async <T = any>(path: string): Promise<T> => {
  const response = await apiClient.delete<T>(path);
  return response.data;
};

// ✅ Token management (unchanged)
export async function setToken(token: string | null) {
  if (token) await AsyncStorage.setItem('token', token);
  else await AsyncStorage.removeItem('token');
}

// ✅ Convenience helpers (unchanged logic)
export async function fetchBarangays() {
  try {
    const data = await get('/api/auth/barangays');
    if (data && Array.isArray((data as any).barangays)) {
      return { barangays: (data as any).barangays };
    }
    if (Array.isArray(data)) {
      return { barangays: data };
    }
    if (data && Array.isArray((data as any).data)) {
      return { barangays: (data as any).data };
    }
    console.warn('[mobile api] fetchBarangays - unexpected response shape', data);
    return { barangays: [] };
  } catch (err) {
    console.error('[mobile api] fetchBarangays error', err);
    return { barangays: [] };
  }
}

export async function ping() {
  return get('/api/health');
}

export async function scanQr(qr: string, weight: number) {
  return post('/api/qr/scan', { qr, weight });
}

export default apiClient;