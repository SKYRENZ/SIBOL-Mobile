import { get, put } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  area?: number; // optional if you support area id updates
  username?: string;
  password?: string;
};

const pickFirst = (...vals: any[]) => vals.find(v => v !== undefined && v !== null && String(v).trim() !== '');

/**
 * Fetch authenticated user's profile
 * Requires valid auth token in AsyncStorage
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
    raw: data
  };
}

/**
 * Backward compatible alias (if you want to keep usage name)
 */
export async function getUserProfile(): Promise<UserProfile> {
  return getMyProfile();
}

/**
 * Fetch current authenticated user's points
 * Requires valid auth token in AsyncStorage
 */
export async function getMyPoints(): Promise<UserPoints> {
  const data = await get('/api/profile/points');

  // persist updated points into stored user so other components reading AsyncStorage see latest
  try {
    const rawUser = await AsyncStorage.getItem('user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (data?.points !== undefined) {
        u.Points = data.points;
        await AsyncStorage.setItem('user', JSON.stringify(u));
        // removed debug persist log
      }
    }
  } catch (e) {
    console.warn('[profileService] failed to persist points into storage', e);
  }

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