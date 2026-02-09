import axios from 'axios';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Merge sources (Expo config extras + process.env)
// IMPORTANT: let build/runtime env vars override "extra"
const extras = (Constants as any).expoConfig?.extra ?? {};
const env = { ...extras, ...(process.env as any) };

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
    // ✅ don't set Content-Type globally; it breaks multipart in RN sometimes
    Accept: 'application/json',
    'x-client-type': CLIENT_TYPE,
  },
});

// local axios error type-guard (include message so TS allows error.message)
function isAxiosError(err: any): err is {
  isAxiosError?: boolean;
  response?: any;
  request?: any;
  message?: string;
  code?: string;
} {
  return !!err && err.isAxiosError === true;
}

// ✅ RN-safe FormData detection
function isFormDataLike(data: any): boolean {
  if (!data) return false;

  // Web / some runtimes
  if (typeof FormData !== 'undefined' && data instanceof FormData) return true;

  // React Native FormData polyfill usually has _parts + append()
  return typeof data === 'object' && typeof data.append === 'function' && Array.isArray((data as any)._parts);
}

const DEBUG_NET = typeof __DEV__ !== 'undefined' ? __DEV__ : false;

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

    // ✅ IMPORTANT: don't force JSON header when sending FormData
    if (isFormDataLike(config.data)) {
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      // (optional) ensure JSON only for non-FormData requests
      config.headers['Content-Type'] = config.headers['Content-Type'] ?? 'application/json';
    }

    if (DEBUG_NET) {
      const full = `${config.baseURL ?? ''}${config.url ?? ''}`;
      console.log('[apiClient] ->', config.method?.toUpperCase(), full);
      console.log('[apiClient]    ct=', config.headers?.['Content-Type'] ?? config.headers?.['content-type']);
      console.log('[apiClient]    hasData=', !!config.data);
    }

    return config;
  },
  (error: any) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (res: any) => res,
  (error: any) => {
    if (DEBUG_NET) {
      console.log('[apiClient] <- ERROR message=', error?.message, 'code=', error?.code);
      console.log('[apiClient] <- ERROR baseURL=', error?.config?.baseURL, 'url=', error?.config?.url);
      console.log('[apiClient] <- ERROR status=', error?.response?.status);
      console.log('[apiClient] <- ERROR data=', error?.response?.data);
    }

    if (isAxiosError(error)) {
      // ✅ make timeouts obvious (was previously shown as "Cannot connect...")
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