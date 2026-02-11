import { get, put } from './apiClient';
import { getResolvedApiBaseUrl } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ✅ use the same module + enum style as authService.ts
import * as FileSystem from 'expo-file-system/legacy';
import { FileSystemUploadType } from 'expo-file-system/legacy';

export type UserProfile = {
  accountId: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  contact?: string;
  barangayName?: string;
  areaName?: string;
  fullAddress?: string;
  city?: string;

  imagePath?: string;

  // ✅ add these so UI can pre-check restrictions
  usernameLastUpdated?: string | null;
  passwordLastUpdated?: string | null;
  profileLastUpdated?: string | null;

  raw?: any;
};

export type UserPoints = {
  points: number;
  account_id: number;
  username: string;
  totalContributions?: number;
};

export type UpdateProfilePayload = {
  firstName?: string;
  lastName?: string;
  contact?: string;
  email?: string;
  area?: number;
  username?: string;
  password?: string;

  // ✅ NEW: used to verify identity when changing username
  currentPassword?: string;
};

const pickFirst = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && String(v).trim() !== '');

/**
 * Fetch authenticated user's profile
 */
export async function getMyProfile(): Promise<UserProfile> {
  const data = await get('/api/profile/me');

  return {
    accountId: Number(pickFirst(data?.Account_id, data?.account_id, data?.id, 0)),
    username: String(pickFirst(data?.Username, data?.username, '')),
    email: String(pickFirst(data?.Email, data?.email, '')),
    firstName: pickFirst(data?.FirstName, data?.firstName, data?.first_name),
    lastName: pickFirst(data?.LastName, data?.lastName, data?.last_name),
    contact: pickFirst(data?.Contact, data?.contact, data?.phone_number),
    barangayName: pickFirst(data?.Barangay_Name, data?.barangay_name),
    areaName: pickFirst(data?.Area_Name, data?.area_name),
    fullAddress: pickFirst(data?.Full_Address, data?.full_address, data?.Address, data?.address),
    city: pickFirst(data?.City, data?.city),

    imagePath: pickFirst(
      data?.Image_path,
      data?.Profile_image_path,
      data?.imagePath,
      data?.image_path
    ),

    // ✅ timestamps (backend returns these exact names from getProfileByAccountId)
    usernameLastUpdated: pickFirst(data?.Username_last_updated, data?.username_last_updated, null) ?? null,
    passwordLastUpdated: pickFirst(data?.Password_last_updated, data?.password_last_updated, null) ?? null,
    profileLastUpdated: pickFirst(data?.Profile_last_updated, data?.profile_last_updated, null) ?? null,

    raw: data,
  };
}

export async function getUserProfile(): Promise<UserProfile> {
  return getMyProfile();
}

export async function getMyPoints(): Promise<UserPoints> {
  const data = await get('/api/profile/points');

  return {
    points: Number(data?.points ?? 0),
    account_id: Number(data?.account_id ?? 0),
    username: String(data?.username ?? ''),
    totalContributions: Number(data?.total_contributions ?? 0)
  };
}

export async function updateMyProfile(payload: UpdateProfilePayload) {
  return put('/api/profile/me', payload);
}

async function toUploadableFileUri(uri: string, mime: string) {
  if (!uri) return uri;

  const lower = uri.toLowerCase();
  const needsCopy = lower.startsWith('content://') || lower.startsWith('ph://');

  if (!needsCopy) return uri;

  const ext = mime === 'image/png' ? 'png' : 'jpg';
  const dest = `${FileSystem.cacheDirectory}sibol_profile_${Date.now()}.${ext}`;

  await FileSystem.copyAsync({ from: uri, to: dest });
  return dest; // file://...
}

// ✅ UPDATED: upload profile image using your axios apiClient
export async function uploadMyProfileImage(input: {
  uri: string;
  mimeType?: string;
  name?: string;
}): Promise<{ imagePath: string; raw: any }> {
  const rawMime = String(input.mimeType || '').toLowerCase();
  const mime = rawMime === 'image/jpg' ? 'image/jpeg' : (rawMime || 'image/jpeg');

  const safeUri = await toUploadableFileUri(input.uri, mime);

  const baseURL = await getResolvedApiBaseUrl();
  const token = await AsyncStorage.getItem('token');

  const res = await FileSystem.uploadAsync(`${baseURL}/api/profile/me/image`, safeUri, {
    httpMethod: 'POST',
    uploadType: FileSystemUploadType.MULTIPART, // ✅ same as signup
    fieldName: 'file',
    mimeType: mime,
    headers: {
      Accept: 'application/json',
      'x-client-type': 'mobile',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  let payload: any = null;
  try {
    payload = res.body ? JSON.parse(res.body) : null;
  } catch {
    payload = res.body;
  }

  if (res.status < 200 || res.status >= 300) {
    const msg =
      payload?.message ||
      (typeof payload === 'string' && payload) ||
      `Upload failed (${res.status})`;
    const err: any = new Error(msg);
    err.status = res.status;
    err.payload = payload;
    throw err;
  }

  const updated = payload?.data ?? payload;
  const imagePath =
    updated?.Image_path ??
    updated?.Profile_image_path ??
    updated?.imagePath ??
    updated?.image_path;

  if (!imagePath) throw new Error('Upload succeeded but response did not include image url');
  return { imagePath, raw: payload };
}