import { useState, useEffect, useCallback } from 'react';
import {
  listAssignedTickets,
  markForVerification,
  cancelTicket, // ✅ add
  MaintenanceTicket
} from '../services/maintenanceService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useMaintenance() {
  const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);

  // Get current user
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

  const fetchTickets = useCallback(async () => {
    if (!currentUserId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await listAssignedTickets(currentUserId);
      setTickets(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load maintenance tickets');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      fetchTickets();
    }
  }, [currentUserId, fetchTickets]);

  const submitForVerification = useCallback(
    async (requestId: number) => {
      if (!currentUserId) {
        throw new Error('User not found');
      }

      try {
        await markForVerification(requestId, { operator_account_id: currentUserId });
        // Refresh tickets after submission
        await fetchTickets();
      } catch (err: any) {
        throw new Error(err?.message || 'Failed to submit for verification');
      }
    },
    [currentUserId, fetchTickets]
  );

  const submitCancelRequest = useCallback(
    async (requestId: number, reason: string) => {
      if (!currentUserId) throw new Error('User not found');
      await cancelTicket(requestId, currentUserId, reason);
      await fetchTickets();
    },
    [currentUserId, fetchTickets]
  );

  // Filter tickets by status
  const pendingTickets = tickets.filter(t => t.Status === 'On-going');
  const forReviewTickets = tickets.filter(t => t.Status === 'For Verification');
  const doneTickets = tickets.filter(t => t.Status === 'Completed');

  // ✅ include Cancel Requested
  const canceledTickets = tickets.filter(t => t.Status === 'Cancelled' || t.Status === 'Cancel Requested');

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
    submitCancelRequest, // ✅ export
  };
}