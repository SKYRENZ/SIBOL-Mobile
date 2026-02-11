import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback } from 'react-native';
import { Plus } from 'lucide-react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import RequestCard, { RequestItem } from '../components/maintenance/RequestCard';
import RequestForm from '../components/maintenance/RequestForm';
import { useMaintenance } from '../hooks/useMaintenance';
import type { MaintenanceTicket } from '../types/maintenance.types';
import { useRoute } from '@react-navigation/native'; // ✅ add

type FilterTab = 'Requested' | 'Pending' | 'For Verification' | 'Completed' | 'Canceled' | 'Cancel Requested';

type ORequestRouteParams = {
  initialTab?: FilterTab;
  openRequestId?: string;
  navAt?: number;
};

export default function ORequest() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Pending');
  const [filterOpen, setFilterOpen] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const [requestFormVisible, setRequestFormVisible] = useState(false);

  const route = useRoute<any>(); // ✅ keep loose to avoid navigator typing mismatch
  const lastNavAtRef = useRef<number | null>(null); // ✅ prevents re-applying params repeatedly

  // ✅ NEW: store each rendered card Y position inside the ScrollView content
  const itemYRef = useRef<Record<string, number>>({});
  // ✅ NEW: when Dashboard requests "open this ticket", remember it until layout is ready
  const pendingScrollToIdRef = useRef<string | null>(null);

  const {
    pendingTickets,
    forReviewTickets,
    doneTickets,
    canceledTickets,
    loading,
    error,
    refresh,
    submitForVerification,
    submitCancelRequest,
  } = useMaintenance();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // ✅ NEW: try scroll when we have layout info
  const tryScrollToPendingId = useCallback(() => {
    const id = pendingScrollToIdRef.current;
    if (!id) return;

    const y = itemYRef.current[id];
    if (typeof y !== 'number') return;

    // small offset so it doesn't stick to the very top edge
    const targetY = Math.max(0, y - 12);

    // wait a tick so the expansion layout settles
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: 0, y: targetY, animated: true });
      pendingScrollToIdRef.current = null; // ✅ consume it (scroll only once)
    }, 50);
  }, []);

  // ✅ Apply navigation intent from Dashboard:
  // - force tab (Pending)
  // - optionally auto-expand a specific ticket
  useEffect(() => {
    const params = (route.params || {}) as ORequestRouteParams;
    if (!params?.navAt) return;
    if (lastNavAtRef.current === params.navAt) return;

    lastNavAtRef.current = params.navAt;

    if (params.initialTab) {
      setActiveFilter(params.initialTab);
    }

    if (params.openRequestId) {
      const id = String(params.openRequestId);

      setExpandedIds(new Set([id]));
      pendingScrollToIdRef.current = id;

      // ✅ DON'T force scroll to top; we'll scroll to the ticket once layout is measured
      // setTimeout(() => scrollViewRef.current?.scrollTo({ x: 0, y: 0, animated: true }), 0);
    }
  }, [route.params]);

  const filters: FilterTab[] = ['Requested', 'Pending', 'For Verification', 'Completed', 'Cancel Requested','Canceled'];

  const formatRequestNumber = (ticket: MaintenanceTicket) => {
    const baseDate = ticket.Request_date ? new Date(ticket.Request_date) : new Date();
    const yyyy = String(baseDate.getFullYear());
    const mm = String(baseDate.getMonth() + 1).padStart(2, '0');
    return `${yyyy}${mm}${ticket.Request_Id}`;
  };

  const convertToRequestItem = useCallback(
    (ticket: MaintenanceTicket): RequestItem => {
      const statusMap: { [key: string]: RequestItem['status'] } = {
        'Requested': 'Requested', // ✅ add
        'On-going': 'Pending',
        'For Verification': 'For review',
        'Completed': 'Done',
        'Cancelled': 'Canceled',
        'Cancel Requested': 'Cancel Requested',
      };

      return {
        id: String(ticket.Request_Id),
        title: ticket.Title || 'Untitled',
        description: ticket.Details || '',
        requestNumber: formatRequestNumber(ticket),
        dateAssigned: ticket.Request_date ? new Date(ticket.Request_date).toLocaleDateString() : '',
        dueDate: ticket.Due_date ? new Date(ticket.Due_date).toLocaleDateString() : '',
        remarksBrgy: ticket.Remarks || 'No remarks',
        remarksMaintenance: 'No remarks from operator yet',
        status: statusMap[ticket.Status || ''] || 'Pending',
        priority: ticket.Priority ?? null,
        isExpanded: expandedIds.has(String(ticket.Request_Id)),
        hasAttachment: !!ticket.Attachment,
      };
    },
    [expandedIds]
  );

  const getFilteredTickets = useCallback((): RequestItem[] => {
    // combine all source arrays from the hook then convert once, avoid duplicates if hook already partitions
    const allTickets = [...pendingTickets, ...forReviewTickets, ...doneTickets, ...canceledTickets];
    const converted = allTickets.map(convertToRequestItem);

    switch (activeFilter) {
      case 'Requested':
        return converted.filter(t => t.status === 'Requested');

      case 'Pending':
        return converted.filter(t => t.status === 'Pending');

      case 'For Verification':
        // Only include tickets with the backend "For Verification" status (mapped to 'For review' in RequestItem)
        return converted.filter(t => t.status === 'For review');

      case 'Cancel Requested':
        return converted.filter(t => t.status === 'Cancel Requested');

      case 'Completed':
        // backend "Completed" is mapped to "Done" in convertToRequestItem
        return converted.filter(t => t.status === 'Done');

      case 'Canceled':
        return converted
          .filter(t => t.status === 'Canceled')
          .map((t) => {
            // preserve cancelCutoffAt when coming from canceledTickets
            const orig = canceledTickets.find(ct => String(ct.Request_Id) === t.id);
            return orig ? { ...t, cancelCutoffAt: orig.CancelApprovedAt ?? null } : t;
          });

      default:
        return [];
    }
  }, [activeFilter, pendingTickets, forReviewTickets, doneTickets, canceledTickets, convertToRequestItem]);

  const toggleRequestExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const handleFilterChange = (filter: FilterTab) => {
    setExpandedIds(new Set());
    setActiveFilter(filter);

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const handleRefresh = useCallback(() => {
    setExpandedIds(new Set());

    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }

    refresh();
  }, [refresh]);

  const handleMarkDone = useCallback(
    async (requestId: string, remarks: string, attachments: any[]) => {
      try {
        await submitForVerification(Number(requestId));
      } catch (error: any) {
        console.error('Error marking done:', error);
        throw error;
      }
    },
    [submitForVerification]
  );

  const handleCancelRequest = useCallback(
    async (requestId: string, reason: string) => {
      await submitCancelRequest(Number(requestId), reason);
    },
    [submitCancelRequest]
  );

  const handleRequestFormClose = useCallback(() => {
    setRequestFormVisible(false);
  }, []);

  const handleRequestFormSave = useCallback(() => {
    setRequestFormVisible(false);
    refresh();
  }, [refresh]);

  const filteredRequests = getFilteredTickets();

  // ✅ NEW: whenever list renders / expands, attempt the scroll
  useEffect(() => {
    tryScrollToPendingId();
  }, [activeFilter, filteredRequests.length, expandedIds, tryScrollToPendingId]);

  return (
    <View style={tw`flex-1 bg-white`}>
      <ScrollView ref={scrollViewRef} style={tw`flex-1`}>
        <View style={tw`px-6 pt-12 pb-24`}>
          <Text style={tw`text-text-gray text-center text-xl font-bold mb-6`}>Request</Text>

          <View style={tw`mb-8`}>
            <View>
              <TouchableOpacity
                onPress={() => setFilterOpen(true)}
                style={tw`bg-white border border-green-light rounded-lg px-4 flex-row justify-between items-center`}
                activeOpacity={0.8}
              >
                <Text style={tw`text-text-gray text-sm`}>{activeFilter}</Text>
                <Text style={[tw`text-text-gray`, { fontSize: 40 }]}>▾</Text>
              </TouchableOpacity>

              <Modal visible={filterOpen} transparent animationType="fade" onRequestClose={() => setFilterOpen(false)}>
                <TouchableWithoutFeedback onPress={() => setFilterOpen(false)}>
                  <View style={tw`flex-1 bg-black/40 justify-center items-center`}>
                    <TouchableWithoutFeedback>
                      <View style={tw`bg-white w-11/12 max-w-[320px] rounded-lg overflow-hidden`}>
                        {filters.map((f) => (
                          <TouchableOpacity
                            key={f}
                            onPress={() => {
                              setFilterOpen(false);
                              handleFilterChange(f);
                            }}
                            style={tw`px-4 py-3 border-b border-gray-100`}
                          >
                            <Text style={tw`${f === activeFilter ? 'font-bold text-[#2E523A]' : 'text-text-gray'} text-sm`}>
                              {f}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </TouchableWithoutFeedback>
                  </View>
                </TouchableWithoutFeedback>
              </Modal>
            </View>
          </View>

          {error && (
            <View style={tw`bg-red-50 border border-red-200 rounded-lg p-4 mb-4`}>
              <Text style={tw`text-red-600 text-sm`}>{error}</Text>
            </View>
          )}

          {loading ? (
            <View style={tw`items-center justify-center py-12`}>
              <ActivityIndicator size="large" color="#2E523A" />
              <Text style={tw`text-[#2E523A] font-semibold text-base mt-2`}>Loading requests...</Text>
            </View>
          ) : filteredRequests.length === 0 ? (
            <View style={tw`items-center justify-center py-12`}>
              <Text style={tw`text-text-gray font-semibold text-base`}>No {activeFilter.toLowerCase()} requests found</Text>
            </View>
          ) : (
            filteredRequests.map((request) => (
              // ✅ Wrap each card so we can measure its Y position
              <View
                key={request.id}
                onLayout={(e) => {
                  itemYRef.current[request.id] = e.nativeEvent.layout.y;

                  // ✅ if this is the one we need, scroll as soon as we learn its position
                  if (pendingScrollToIdRef.current === request.id) {
                    tryScrollToPendingId();
                  }
                }}
              >
                <RequestCard
                  request={request}
                  onToggleExpand={toggleRequestExpanded}
                  onMarkDone={handleMarkDone}
                  onCancelRequest={handleCancelRequest}
                />
              </View>
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setRequestFormVisible(true)} activeOpacity={0.8}>
        <Plus color="#fff" size={28} strokeWidth={3} />
      </TouchableOpacity>

      <BottomNavbar currentPage="Request" onRefresh={handleRefresh} />

      <RequestForm visible={requestFormVisible} onClose={handleRequestFormClose} onSave={handleRequestFormSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 140,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f6b3f',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
});
