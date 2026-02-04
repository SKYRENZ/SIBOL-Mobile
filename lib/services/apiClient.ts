import axios from 'axios';
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
const CLIENT_TYPE = Platform.OS === 'web' ? 'web' : 'mobile';

// Use concrete runtime type from axios.create to avoid importing axios types
const apiClient: ReturnType<typeof axios.create> = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    'x-client-type': CLIENT_TYPE,
  },
});

// local axios error type-guard (include message so TS allows error.message)
function isAxiosError(err: any): err is { isAxiosError?: boolean; response?: any; request?: any; message?: string } {
  return !!err && err.isAxiosError === true;
}

apiClient.interceptors.request.use(
  async (config: any) => {
    config.headers = config.headers ?? {};
    (config.headers as any)['x-client-type'] = (config.headers as any)['x-client-type'] ?? CLIENT_TYPE;
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.debug('[apiClient] token read failed', e);
    }

    const isFormData = typeof FormData !== 'undefined' && config.data instanceof FormData;
    if (isFormData) {
      delete (config.headers as any)['Content-Type'];
      delete (config.headers as any)['content-type'];
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (isAxiosError(error)) {
      if (error.response) {
        const msg = error.response?.data?.message ?? error.response?.data ?? error.message;
        const e: any = new Error(String(msg));
        e.status = error.response.status;
        e.payload = error.response.data;
        return Promise.reject(e);
      }
      if (error.request) {
        return Promise.reject(new Error('Cannot connect to server. Please check your network.'));
      }
    }
    return Promise.reject(error);
  }
);

// typed wrapper functions (use any where axios types previously caused issues)
export const get = async <T = any>(path: string, config?: any): Promise<T> => {
  const res = await apiClient.get<T>(path, config);
  return res.data;
};
export const post = async <T = any>(path: string, body?: any): Promise<T> => {
  const res = await apiClient.post<T>(path, body);
  return res.data;
};
export const put = async <T = any>(path: string, body?: any): Promise<T> => {
  const res = await apiClient.put<T>(path, body);
  return res.data;
};
export const patch = async <T = any>(path: string, body?: any): Promise<T> => {
  const res = await apiClient.patch<T>(path, body);
  return res.data;
};
export const del = async <T = any>(path: string): Promise<T> => {
  const res = await apiClient.delete<T>(path);
  return res.data;
};

export async function setToken(token: string | null) {
  if (token) await AsyncStorage.setItem('token', token);
  else await AsyncStorage.removeItem('token');
}

const handleError = (error: any) => {
  if (isAxiosError(error)) {
    console.error('API Error:', error.response?.status, error.response?.data);
  } else {
    console.error('Network Error:', error);
  }
};

export default apiClient;

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
    console.log('[mobile api] fetchBarangays error', err);
    return { barangays: [] };
  }
}

export async function ping() {
  return get('/api/health');
}

export async function scanQr(qr: string, weight: number) {
  return post('/api/qr/scan', { qr, weight });
}