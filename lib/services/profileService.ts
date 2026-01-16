import { get } from './apiClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserProfile = {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  address?: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt: string;
};

export type UserPoints = {
  points: number;
  account_id: number;
  username: string;
  totalContributions?: number;
};

/**
 * Fetch user profile data
 * Requires valid auth token in AsyncStorage
 */
export async function getUserProfile(): Promise<UserProfile> {
  const data = await get('/api/profile');
  return {
    id: Number(data?.id ?? 0),
    username: String(data?.username ?? ''),
    email: String(data?.email ?? ''),
    firstName: data?.first_name || undefined,
    lastName: data?.last_name || undefined,
    address: data?.address || undefined,
    phoneNumber: data?.phone_number || undefined,
    createdAt: String(data?.created_at ?? ''),
    updatedAt: String(data?.updated_at ?? '')
  };
}

/**
 * Fetch current authenticated user's points
 * Requires valid auth token in AsyncStorage
 */
export async function getMyPoints(): Promise<UserPoints> {
  const data = await get('/api/profile/points');

  console.log('[profileService] /api/profile/points ->', data);

  // persist updated points into stored user so other components reading AsyncStorage see latest
  try {
    const rawUser = await AsyncStorage.getItem('user');
    if (rawUser) {
      const u = JSON.parse(rawUser);
      if (data?.points !== undefined) {
        u.Points = data.points;
        await AsyncStorage.setItem('user', JSON.stringify(u));
        console.log('[profileService] persisted user Points ->', u.Points);
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