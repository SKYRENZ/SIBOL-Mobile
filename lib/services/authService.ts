import AsyncStorage from '@react-native-async-storage/async-storage';
import { post, setToken } from './apiClient';
import apiClient from './apiClient';
import { Platform } from 'react-native';

export type User = { Account_id?: number; Username?: string; Roles?: number; [k: string]: any };
export type AuthResponse = { token?: string; accessToken?: string; user?: User; [k: string]: any };

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await post('/api/auth/login', { username, password });
  
  const token = res?.token ?? res?.accessToken;
  const user = res?.user ?? null;
  
  if (!token) {
    throw new Error('No authentication token received');
  }

  if (!user) {
    throw new Error('No user data received');
  }

  await setToken(token);
  await AsyncStorage.setItem('token', token);
  await AsyncStorage.setItem('user', JSON.stringify(user));
  
  return { token, user };
}

export async function register(payload: any) {
  // legacy JSON register (keep if you still need it elsewhere)
  return post('/api/auth/register', payload);
}

export type RegisterWithAttachmentPayload = {
  firstName: string;
  lastName: string;
  email: string;
  barangayId: string | number;
  roleId: number;
  isSSO?: boolean;
  attachmentUri: string; // REQUIRED
};

function guessMimeType(uri: string) {
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  return 'image/jpeg';
}

function guessFileName(uri: string) {
  const last = uri.split('/').pop();
  if (last && last.includes('.')) return last;
  return `signup_attachment_${Date.now()}.jpg`;
}

export async function registerWithAttachment(payload: RegisterWithAttachmentPayload) {
  if (!payload?.attachmentUri) throw new Error('Signup attachment is required');

  const form = new FormData();
  form.append('firstName', String(payload.firstName ?? ''));
  form.append('lastName', String(payload.lastName ?? ''));
  form.append('email', String(payload.email ?? ''));
  form.append('barangayId', String(payload.barangayId ?? ''));
  form.append('roleId', String(payload.roleId ?? ''));
  form.append('isSSO', String(Boolean(payload.isSSO)));

  const name = guessFileName(payload.attachmentUri);
  const type = guessMimeType(payload.attachmentUri);

  if (Platform.OS === 'web') {
    const resp = await fetch(payload.attachmentUri);
    const blob = await resp.blob();
    const file = new File([blob], name, { type: blob.type || type });
    form.append('attachment', file);
  } else {
    form.append('attachment', { uri: payload.attachmentUri, name, type } as any);
  }

  const res = await apiClient.post('/api/auth/register', form, {
    headers: {
      'x-client-type': 'mobile',
    },
    timeout: 60000, // ✅ was 15000 globally; uploads + cloudinary/email can exceed 15s in prod
    maxBodyLength: Infinity, // ✅ helps in Node/axios envs; harmless in RN
    maxContentLength: Infinity,
  });

  return res.data;
}

// ✅ ADD: Sign out function
export async function logout() {
  try {
    // Clear local storage
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    await setToken(null);
    
    console.log('✅ Logout successful - Cleared auth data');
    
    // Optionally call backend logout endpoint if you have one
    // await post('/api/auth/logout', {});
  } catch (err) {
    console.error('❌ Logout failed:', err);
    throw err;
  }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  // uses apiClient.post helper which attaches auth headers already configured
  return post('/api/auth/change-password', { currentPassword, newPassword });
}