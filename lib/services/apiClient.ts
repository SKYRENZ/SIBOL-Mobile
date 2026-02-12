import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// ✅ Merge sources ONCE (Expo config extras + process.env)
const extras = (Constants as any).expoConfig?.extra ?? {};
const env = { ...extras, ...(process.env as any) };

const envApiBaseWeb = env?.EXPO_PUBLIC_API_BASE_WEB;
const envApiBaseMobile = env?.EXPO_PUBLIC_API_BASE_MOBILE;
const envApiBaseLegacy = env?.EXPO_PUBLIC_API_BASE;

const DEFAULT_PORT = 5000;
const API_BASE_OVERRIDE_KEY = 'apiBaseOverride';

const normalizeUrl = (url: string) => {
  const trimmed = url.trim().replace(/\/$/, '');
  if (!/^https?:\/\//i.test(trimmed)) return `http://${trimmed}`;
  return trimmed;
};

function getDevLanHostFromExpo(): string | null {
  const hostUri =
    (Constants as any)?.expoConfig?.hostUri ??
    (Constants as any)?.manifest?.hostUri ??
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri ??
    null;

  if (!hostUri || typeof hostUri !== 'string') return null;

  const cleaned = hostUri.replace(/^https?:\/\//i, '');
  const host = cleaned.split(':')[0]?.trim();
  return host || null;
}

const isPhysicalDevice = Boolean((Constants as any)?.isDevice);

const DEFAULT_HOST =
  Platform.OS === 'android' && !isPhysicalDevice
    ? 'http://10.0.2.2'
    : Platform.OS !== 'web' && isPhysicalDevice
      ? `http://${getDevLanHostFromExpo() ?? 'localhost'}`
      : 'http://localhost';

const platformEnvBase = Platform.OS === 'web' ? envApiBaseWeb : envApiBaseMobile;

// ✅ This is the *default* base (used when no runtime override is set)
export const API_BASE_DEFAULT = normalizeUrl(
  platformEnvBase ??
    envApiBaseLegacy ??
    `${DEFAULT_HOST}:${DEFAULT_PORT}`
);

// ✅ Keep existing export for compatibility
export const API_BASE = API_BASE_DEFAULT;

const CLIENT_TYPE = Platform.OS === 'web' ? 'web' : 'mobile';

const apiClient: ReturnType<typeof axios.create> = axios.create({
  baseURL: API_BASE_DEFAULT, // will be overridden per-request if needed
  timeout: 15000,
  headers: {
    Accept: 'application/json',
    'x-client-type': CLIENT_TYPE,
  },
});

function isAxiosError(err: any): err is {
  isAxiosError?: boolean;
  response?: any;
  request?: any;
  message?: string;
  code?: string;
} {
  return !!err && err.isAxiosError === true;
}

function isFormDataLike(data: any): boolean {
  if (!data) return false;
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;
  return typeof data === 'object' && typeof data.append === 'function' && Array.isArray((data as any)._parts);
}

const DEBUG_NET = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

// ✅ NEW: set/clear runtime override so you can switch LAN <-> PROD without rebuild
export async function setApiBaseOverride(url: string | null) {
  if (!url) {
    await AsyncStorage.removeItem(API_BASE_OVERRIDE_KEY);
    return;
  }
  await AsyncStorage.setItem(API_BASE_OVERRIDE_KEY, normalizeUrl(url));
}

export async function getApiBaseOverride(): Promise<string | null> {
  const v = await AsyncStorage.getItem(API_BASE_OVERRIDE_KEY);
  return v ? normalizeUrl(v) : null;
}

// ✅ Resolve the baseURL for each request
async function resolveBaseURL(): Promise<string> {
  const override = await getApiBaseOverride();
  return override || API_BASE_DEFAULT;
}

export async function getResolvedApiBaseUrl(): Promise<string> {
  const override = await getApiBaseOverride();
  return override || API_BASE_DEFAULT;
}

apiClient.interceptors.request.use(
  async (config: any) => {
    config.headers = config.headers ?? {};
    (config.headers as any)['x-client-type'] = (config.headers as any)['x-client-type'] ?? CLIENT_TYPE;

    // ✅ apply runtime baseURL
    const baseURL = await resolveBaseURL();
    config.baseURL = baseURL;

    if (DEBUG_NET) {
      try {
        console.log('[mobile api] ->', config.method?.toUpperCase(), `${baseURL}${config.url}`);
      } catch {}
    }

    try {
      const token = await AsyncStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {
      console.debug('[apiClient] token read failed', e);
    }

    if (isFormDataLike(config.data)) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      config.headers['Content-Type'] = config.headers['Content-Type'] ?? 'application/json';
    }

    return config;
  },
  (error: any) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (res: any) => res,
  (error: any) => {
    if (isAxiosError(error)) {
      if (error.code === 'ECONNABORTED' || String(error.message || '').toLowerCase().includes('timeout')) {
        return Promise.reject(new Error('Request timed out. Please try again (or upload a smaller image).'));
      }
      if (error.response) {
        const msg = error.response?.data?.message ?? error.response?.data?.error ?? error.response?.data ?? error.message;
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

// ✅ UPDATED: allow passing axios config (needed for upload timeout)
export const get = async <T = any>(path: string, config?: any): Promise<T> => {
  const res = await apiClient.get<T>(path, config);
  return res.data;
};
export const post = async <T = any>(path: string, body?: any, config?: any): Promise<T> => {
  const res = await apiClient.post<T>(path, body, config);
  return res.data;
};
export const put = async <T = any>(path: string, body?: any, config?: any): Promise<T> => {
  const res = await apiClient.put<T>(path, body, config);
  return res.data;
};
export const patch = async <T = any>(path: string, body?: any, config?: any): Promise<T> => {
  const res = await apiClient.patch<T>(path, body, config);
  return res.data;
};
export const del = async <T = any>(path: string, config?: any): Promise<T> => {
  const res = await apiClient.delete<T>(path, config);
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

// ✅ helper to call backend QR scan endpoint
export async function scanQr(qr: string, weight: number): Promise<any> {
  // adjust path if your backend expects a different route
  return post('/qr/scan', { qr, weight });
}

// NEW: fetch barangays helper used by mobile signup
export async function fetchBarangays(): Promise<{ id: number; name: string }[]> {
  try {
    const res: any = await get('/api/auth/barangays');
    return Array.isArray(res?.barangays) ? res.barangays : [];
  } catch (err) {
    console.error('fetchBarangays error', err);
    return [];
  }
}

export default apiClient;