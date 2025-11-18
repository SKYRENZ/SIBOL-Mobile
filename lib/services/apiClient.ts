import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Read from env if available, otherwise use emulator defaults
const extras = (Constants as any).expoConfig?.extra ?? process.env;
const envApiBase = extras?.EXPO_PUBLIC_API_BASE;

// Define DEFAULT_HOST before using it
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2' : 'http://localhost';
const DEFAULT_PORT = 5000;

// Remove trailing slash to prevent double slashes
const normalizeUrl = (url: string) => url.replace(/\/$/, '');

// If env provided a full URL (with port), don't append :5000
export const API_BASE = normalizeUrl(
  (global as any).API_BASE_OVERRIDE ?? 
  (envApiBase || `${DEFAULT_HOST}:${DEFAULT_PORT}`)
);

console.log('[mobile api] Platform:', Platform.OS);
console.log('[mobile api] API_BASE =', API_BASE);

async function request(path: string, opts: RequestInit = {}) {
  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = path.startsWith('http') ? path : `${API_BASE}${normalizedPath}`;
  
  console.log(`[API Request] ${opts.method || 'GET'} ${url}`);
  
  const headers: Record<string,string> = { ...(opts.headers as Record<string,string> || {}) };

  // attach token if available
  try {
    const token = await AsyncStorage.getItem('token');
    if (token) headers.Authorization = `Bearer ${token}`;
  } catch {
    /* ignore */
  }

  // default JSON header for non-multipart bodies
  const method = (opts.method || 'GET').toUpperCase();
  const hasBody = !!(opts as any).body;
  if (hasBody && method !== 'GET' && method !== 'HEAD' && !(opts.headers && (opts.headers as any)['Content-Type'] === 'multipart/form-data')) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...opts, headers });
  const text = await res.text().catch(() => '');
  let data: any = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }

  if (!res.ok) {
    const msg = data?.message || data?.error || text || res.statusText || `HTTP ${res.status}`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.payload = data;
    throw err;
  }
  
  console.log(`[API Success] ${method} ${url}`);
  return data;
}

export const get = (path: string) => request(path, { method: 'GET' });
export const post = (path: string, body?: any) =>
  request(path, { method: 'POST', body: body && typeof body === 'string' ? body : body ? JSON.stringify(body) : undefined });

export async function setToken(token: string | null) {
  if (token) await AsyncStorage.setItem('token', token);
  else await AsyncStorage.removeItem('token');
}

// Convenience helpers (adjust endpoints if needed)
export async function fetchBarangays() {
  try {
    const data = await get('/api/auth/barangays');
    // Normalize common shapes:
    // - { success: true, barangays: [...] }
    // - [...] (array directly)
    // - { data: [...] }
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
  return get('/api/health') /* optional; if not exposed backend, call a public endpoint like /api/auth/barangays */;
}
export async function scanQr(qr: string, weight: number) {
  return post('/api/qr/scan', { qr, weight });
}