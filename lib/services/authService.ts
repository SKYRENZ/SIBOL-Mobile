import AsyncStorage from '@react-native-async-storage/async-storage';
import { post, setToken } from './apiClient';

export type User = { Account_id?: number; Username?: string; Roles?: number; [k: string]: any };
export type AuthResponse = { token?: string; accessToken?: string; user?: User; [k: string]: any };

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await post('/api/auth/login', { username, password });
  // Ensure login succeeded
  const token = res?.token ?? res?.accessToken;
  const user = res?.user ?? null;
  if (!token && !user) {
    // backend returns 401 with message on bad creds — surface that
    const msg = (res && (res.message || res.error)) || 'Invalid credentials';
    throw new Error(msg);
  }

  // mobile apiClient.post returns parsed data (not wrapped in { data })
  if (token) {
    // keep apiClient.setToken in-sync (it writes AsyncStorage) and also persist user
    await setToken(token);
    await AsyncStorage.setItem('token', token).catch(() => {});
  }
  if (user) {
    await AsyncStorage.setItem('user', JSON.stringify(user)).catch(() => {});
  }
  return res as AuthResponse;
}

export async function register(payload: any) {
  return post('/api/auth/register', payload);
}

export async function logout() {
  await setToken(null);
  await AsyncStorage.removeItem('user').catch(() => {});
}