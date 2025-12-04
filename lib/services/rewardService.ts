import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, post } from './apiClient';

export type RewardSummary = {
  Reward_id?: number;
  Item?: string;
  Description?: string;
  Points_cost?: number;
  Quantity?: number;
  IsArchived?: number;
  [k: string]: any;
};

export type RewardDetail = RewardSummary & { /* add more fields if backend returns them */ };

export type RedeemResponse = {
  message?: string;
  data?: {
    transactionId?: number;
    redemption_code?: string;
    total_points?: number;
    status?: string;
    [k: string]: any;
  };
};

/**
 * List rewards.
 * Pass archived = true|false to filter, otherwise returns all.
 */
export async function listRewards(archived?: boolean): Promise<RewardSummary[]> {
  const qs = typeof archived === 'boolean' ? `?archived=${archived}` : '';
  const data = await get(`/api/rewards${qs}`);
  if (Array.isArray(data)) return data as RewardSummary[];
  if (data && Array.isArray((data as any).data)) return (data as any).data;
  // fallback: sometimes controller returns object directly
  return Array.isArray(data?.rows) ? data.rows : [];
}

/**
 * Get single reward by id
 */
export async function getReward(id: number): Promise<RewardDetail | null> {
  const data = await get(`/api/rewards/${id}`);
  return data || null;
}

/**
 * Redeem a reward for the currently authenticated user (or pass accountId).
 * Backend expects { account_id, reward_id, quantity } in body.
 */
export async function redeemReward(rewardId: number, quantity = 1, accountId?: number): Promise<RedeemResponse> {
  let acct = accountId;
  if (!acct) {
    try {
      const raw = await AsyncStorage.getItem('user');
      console.log('[rewardService] stored user:', raw); // ✅ DEBUG
      if (raw) {
        const user = JSON.parse(raw);
        acct = Number(user?.Account_id ?? user?.account_id ?? user?.id);
        console.log('[rewardService] extracted account_id:', acct); // ✅ DEBUG
      }
    } catch (e) {
      console.error('[rewardService] failed to read user from storage', e);
    }
  }

  if (!acct) throw new Error('Account id required to redeem reward');

  const payload = { account_id: Number(acct), reward_id: Number(rewardId), quantity: Number(quantity) };
  console.log('[rewardService] redeem payload:', payload); // ✅ DEBUG
  
  const res = await post('/api/rewards/redeem', payload);
  console.log('[rewardService] redeem response:', res); // ✅ DEBUG
  
  return res;
}

/**
 * Validate a redemption code (staff lookup or user checking)
 */
export async function validateRedemptionCode(code: string) {
  if (!code) throw new Error('Code required');
  const res = await get(`/api/rewards/code/${encodeURIComponent(code)}`);
  return res;
}

export default {
  listRewards,
  getReward,
  redeemReward,
  validateRedemptionCode,
};