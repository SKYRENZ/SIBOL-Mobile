import AsyncStorage from '@react-native-async-storage/async-storage';
import { post, setToken } from './apiClient';

export type User = { Account_id?: number; Username?: string; Roles?: number; [k: string]: any };
export type AuthResponse = { token?: string; accessToken?: string; user?: User; [k: string]: any };

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await post('/api/auth/login', { username, password });
  
  // ✅ Extract token from response
  const token = res?.token ?? res?.accessToken;
  const user = res?.user ?? null;
  
  if (!token) {
    throw new Error('No authentication token received');
  }

  if (!user) {
    throw new Error('No user data received');
  }

  // ✅ Store token in AsyncStorage
  await setToken(token);
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  console.log('✅ Login successful - Token saved:', token.substring(0, 20) + '...');
  
  return { token, user };
}

export async function register(payload: any) {
  return post('/api/auth/register', payload);
}

export async function logout() {
  await setToken(null);
  await AsyncStorage.removeItem('user');
  await AsyncStorage.removeItem('token');
}