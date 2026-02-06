import apiClient from './apiClient';

export type MobileLBRow = {
  Account_id?: number;
  Username?: string;
  Total_kg?: number;
  rank?: number;
  previous_rank?: number | null;
};

export async function fetchLeaderboard(limit = 100): Promise<MobileLBRow[]> {
  const res: any = await apiClient.get('/api/leaderboard', { params: { limit } });
  // backend returns { data: [...] } as in web API
  const rows = res?.data?.data ?? [];
  return Array.isArray(rows) ? rows : [];
}