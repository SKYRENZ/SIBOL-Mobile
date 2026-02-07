import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  listAssignedTickets,
  listMyTickets, // ✅ add
  listOperatorCancelledHistoryTickets,
  markForVerification,
  cancelTicket,
  MaintenanceTicket
} from '../services/maintenanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useMaintenance() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]); // assigned tickets
  const [myTickets, setMyTickets] = useState<MaintenanceTicket[]>([]); // ✅ created-by-me tickets
  const [cancelledHistory, setCancelledHistory] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userStr = await AsyncStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          setCurrentUserId(user.Account_id || user.account_id);
        }
      } catch (err) {
        console.error('Error loading user:', err);
      }
    };
    loadUser();
  }, []);

  const uniqByRequestId = (arr: MaintenanceTicket[]) => {
    const map = new Map<number, MaintenanceTicket>();
    for (const t of arr) map.set(t.Request_Id, t);
    return Array.from(map.values());
  };

  const fetchTickets = useCallback(async () => {
    if (!currentUserId) return;

    setLoading(true);
    setError(null);
    try {
      const [assigned, mine, cancelled] = await Promise.all([
        listAssignedTickets(currentUserId),
        listMyTickets(currentUserId), // ✅ NEW
        listOperatorCancelledHistoryTickets(currentUserId),
      ]);

      setTickets(uniqByRequestId(assigned || []));
      setMyTickets(uniqByRequestId(mine || [])); // ✅ NEW
      setCancelledHistory(uniqByRequestId(cancelled || []));
    } catch (err: any) {
      setError(err?.message || 'Failed to load maintenance tickets');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) fetchTickets();
  }, [currentUserId, fetchTickets]);

  const submitForVerification = useCallback(
    async (requestId: number) => {
      if (!currentUserId) throw new Error('User not found. Please sign in again.');
      await markForVerification(requestId, { operator_account_id: currentUserId });
      await fetchTickets();
    },
    [currentUserId, fetchTickets]
  );

  const submitCancelRequest = useCallback(
    async (requestId: number, reason: string) => {
      if (!currentUserId) throw new Error('User not found. Please sign in again.');
      await cancelTicket(requestId, currentUserId, reason);
      await fetchTickets();
    },
    [currentUserId, fetchTickets]
  );

  const cancelledIdSet = useMemo(() => new Set(cancelledHistory.map(t => t.Request_Id)), [cancelledHistory]);

  const assignedWithoutCancelled = useMemo(() => {
    return tickets.filter(t => !cancelledIdSet.has(t.Request_Id));
  }, [tickets, cancelledIdSet]);

  // ✅ Requested tickets created by operator (typically not assigned yet)
  const requestedTickets = useMemo(() => {
    return (myTickets || []).filter(t => t.Status === 'Requested' && !cancelledIdSet.has(t.Request_Id));
  }, [myTickets, cancelledIdSet]);

  // ✅ Pending tab now includes: On-going (assigned) + Requested (created)
  const pendingTickets = useMemo(() => {
    return uniqByRequestId([
      ...assignedWithoutCancelled.filter(t => t.Status === 'On-going'),
      ...requestedTickets,
    ]);
  }, [assignedWithoutCancelled, requestedTickets]);

  const forReviewTickets = assignedWithoutCancelled.filter(
    t => t.Status === 'For Verification' || t.Status === 'Cancel Requested'
  );
  const doneTickets = assignedWithoutCancelled.filter(t => t.Status === 'Completed');
  const canceledTickets = cancelledHistory;

  return {
    tickets,
    pendingTickets,
    forReviewTickets,
    doneTickets,
    canceledTickets,
    loading,
    error,
    refresh: fetchTickets,
    submitForVerification,
    submitCancelRequest,
  };
}