import apiClient from './apiClient';

export type HistoryApiItem = {
  id: string; // "qr:<qr_code>" | "reward:<reward_transaction_id>"
  type: 'QR_SCAN' | 'REWARD_CLAIM';
  createdAt: string; // MySQL datetime string
  pointsDelta: number; // + earned, - spent
  kgDelta: number; // + kg for QR scan, 0 for rewards
  title: string; // "QR Scan" or reward item title
  code: string | null; // redemption code (reward claim)
};

export async function fetchMyHistory(opts?: {
  limit?: number;
  cursor?: string | null;
}): Promise<HistoryApiItem[]> {
  // NOTE: if your backend is mounted under /api, change to '/api/history'
  const res = await apiClient.get('/history', {
    params: {
      ...(opts?.limit != null ? { limit: opts.limit } : {}),
      ...(opts?.cursor != null ? { cursor: opts.cursor } : {}),
    },
  });

  const data = res?.data;
  const items = Array.isArray(data?.items) ? data.items : Array.isArray(data) ? data : [];
  return items as HistoryApiItem[];
}