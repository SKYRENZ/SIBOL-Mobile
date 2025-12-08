import { get } from './apiClient';

export type UserPoints = {
  points: number;
  account_id: number;
  username: string;
};

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
  };
}