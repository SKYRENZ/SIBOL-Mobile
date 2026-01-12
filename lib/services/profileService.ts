import { get } from './apiClient';

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
  return {
    points: Number(data?.points ?? 0),
    account_id: Number(data?.account_id ?? 0),
    username: String(data?.username ?? ''),
    totalContributions: Number(data?.total_contributions ?? 0)
  };
}