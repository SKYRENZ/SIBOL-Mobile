import { useState, useEffect, useCallback, useRef } from 'react';
import { get } from '../services/apiClient';

export type QueueInfo = {
  position: number;
  totalPending: number;
  estimatedWaitTime: string;
} | null;

export function useAdminPending(initialEmail?: string) {
  const [email, setEmail] = useState<string>(initialEmail ?? '');
  const [loading, setLoading] = useState<boolean>(false);
  const [queueInfo, setQueueInfo] = useState<QueueInfo>(null);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);
  const intervalRef = useRef<number | null>(null);

  const fetchQueue = useCallback(async (e?: string) => {
    const target = (e ?? email)?.trim();
    if (!target) {
      setQueueInfo(null);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const qs = `?email=${encodeURIComponent(target)}`;
      const res = await get(`/api/auth/queue-position${qs}`);
      // backend returns { success: true, position, totalPending, estimatedWaitTime }
      if (res && (res.success === true || res.position !== undefined)) {
        setQueueInfo({
          position: res.position ?? res.pos ?? 0,
          totalPending: res.totalPending ?? res.total ?? 0,
          estimatedWaitTime: res.estimatedWaitTime ?? res.eta ?? ''
        });
      } else {
        setQueueInfo(null);
        setError(res?.error || 'No queue info');
      }
    } catch (err: any) {
      setQueueInfo(null);
      setError(err?.message || 'Failed to fetch queue');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [email]);

  const refresh = useCallback(() => fetchQueue(), [fetchQueue]);

  useEffect(() => {
    mounted.current = true;
    // start polling when an email is present
    if (email) {
      fetchQueue();
      // poll every 30s
      intervalRef.current = window.setInterval(() => {
        fetchQueue();
      }, 30000);
    }

    return () => {
      mounted.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [email, fetchQueue]);

  return {
    email,
    setEmail,
    queueInfo,
    loading,
    error,
    refresh,
  } as const;
}