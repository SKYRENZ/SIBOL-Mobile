import AsyncStorage from '@react-native-async-storage/async-storage';
import { post, setToken, API_BASE } from './apiClient';
import apiClient from './apiClient';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';

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

  console.log('[authService] registerWithAttachment called');
  console.log('[authService] attachmentUri =', payload.attachmentUri);

  const name = guessFileName(payload.attachmentUri);
  const type = guessMimeType(payload.attachmentUri);

  // ✅ Native: use FileSystem multipart upload instead of axios
  if (Platform.OS !== 'web') {
    const url = `${API_BASE}/api/auth/register`;

    const result = await FileSystem.uploadAsync(url, payload.attachmentUri, {
      httpMethod: 'POST',
      uploadType: FileSystemUploadType.MULTIPART, // ✅ change
      fieldName: 'attachment',
      mimeType: type,
      headers: {
        'x-client-type': 'mobile',
        Accept: 'application/json',
      },
      parameters: {
        firstName: String(payload.firstName ?? ''),
        lastName: String(payload.lastName ?? ''),
        email: String(payload.email ?? ''),
        barangayId: String(payload.barangayId ?? ''),
        roleId: String(payload.roleId ?? ''),
        isSSO: String(Boolean(payload.isSSO)),
      },
    });

    console.log('[authService] upload status =', result.status);

    let data: any = result.body;
    try {
      data = JSON.parse(result.body);
    } catch {
      // leave as string
    }

    if (result.status < 200 || result.status >= 300) {
      const msg = data?.message ?? data?.error ?? result.body ?? `HTTP ${result.status}`;
      const err: any = new Error(String(msg));
      err.status = result.status;
      err.payload = data;
      throw err;
    }

    return data;
  }

  // Web: keep existing axios FormData flow
  const form = new FormData();
  form.append('firstName', String(payload.firstName ?? ''));
  form.append('lastName', String(payload.lastName ?? ''));
  form.append('email', String(payload.email ?? ''));
  form.append('barangayId', String(payload.barangayId ?? ''));
  form.append('roleId', String(payload.roleId ?? ''));
  form.append('isSSO', String(Boolean(payload.isSSO)));

  const resp = await fetch(payload.attachmentUri);
  const blob = await resp.blob();
  const file = new File([blob], name, { type: blob.type || type });
  form.append('attachment', file);

  const res = await apiClient.post('/api/auth/register', form, {
    headers: { 'x-client-type': 'mobile' },
    timeout: 120000,
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