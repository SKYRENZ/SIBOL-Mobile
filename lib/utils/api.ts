import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_PORT = 5000;

// Emulator-friendly defaults:
// - Android emulator (AVD): 10.0.2.2
// - iOS simulator: localhost
const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2' : 'http://localhost';

export const API_BASE = (global as any).API_BASE_OVERRIDE ?? `${DEFAULT_HOST}:${DEFAULT_PORT}`;

// LOG the runtime API base for debugging web builds
console.log('[mobile api] API_BASE =', API_BASE);

async function request(path: string, opts: RequestInit = {}) {
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
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
  return get('/api/auth/barangays');
}
export async function ping() {
  return get('/api/health') /* optional; if not exposed backend, call a public endpoint like /api/auth/barangays */;
}