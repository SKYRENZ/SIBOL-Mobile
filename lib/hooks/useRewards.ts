import { useEffect, useState, useCallback } from 'react';
import * as rewardService from '../services/rewardService';

export type MobileReward = {
  id: number;
  title: string;
  description?: string;
  points?: number;
  quantity?: number;
  raw?: any;
};

export default function useRewards() {
  const [rewards, setRewards] = useState<MobileReward[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await rewardService.listRewards(false);
      const mapped = (rows || []).map((r: any) => ({
        id: Number(r.Reward_id ?? r.reward_id ?? r.id),
        title: r.Item ?? r.item ?? r.title ?? 'Reward',
        description: r.Description ?? r.description ?? '',
        points: Number(r.Points_cost ?? r.points_cost ?? r.points ?? 0),
        quantity: Number(r.Quantity ?? r.quantity ?? 0),
        raw: r,
      }));
      setRewards(mapped);
    } catch (err: any) {
      console.error('[useRewards] load error', err);
      setError(err?.message || 'Failed to load rewards');
      setRewards([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const redeem = useCallback(async (rewardId: number, qty = 1) => {
    setLoading(true);
    try {
      const res = await rewardService.redeemReward(rewardId, qty);
      // refresh list after redeem
      await load();
      return res;
    } catch (err: any) {
      console.error('[useRewards] redeem error', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [load]);

  return {
    rewards,
    loading,
    error,
    refresh: load,
    redeem,
  } as const;
}