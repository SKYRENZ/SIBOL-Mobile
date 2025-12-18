import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from 'react-native';
import { Plus } from 'lucide-react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import RequestCard, { RequestItem } from '../components/RequestCard';
import Tabs from '../components/commons/Tabs';
import RequestForm from '../components/RequestForm';
import { useMaintenance } from '../hooks/useMaintenance';
import { MaintenanceTicket } from '../services/maintenanceService';
import OMenu from '../components/oMenu';

type FilterTab = 'Pending' | 'For review' | 'Done' | 'Canceled';

export default function ORequest() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Pending');
  const scrollViewRef = useRef<ScrollView>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [requestFormVisible, setRequestFormVisible] = useState(false);
  
  const {
    pendingTickets,
    forReviewTickets,
    doneTickets,
    canceledTickets,
    loading,
    error,
    refresh,
    submitForVerification,
  } = useMaintenance();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [checkedIds, setCheckedIds] = useState<Set<string>>(new Set());

  const filters: FilterTab[] = ['Pending', 'For review', 'Done', 'Canceled'];

  // Convert MaintenanceTicket to RequestItem format
  const convertToRequestItem = useCallback((ticket: MaintenanceTicket): RequestItem => {
    const statusMap: { [key: string]: 'Pending' | 'For review' | 'Done' | 'Canceled' } = {
      'On-going': 'Pending',
      'For Verification': 'For review',
      'Completed': 'Done',
      'Cancelled': 'Canceled'
    };

    return {
      id: String(ticket.Request_Id),
      title: ticket.Title || 'Untitled',
      description: ticket.Details || '',
      requestNumber: String(ticket.Request_Id),
      dateAssigned: ticket.Request_date ? new Date(ticket.Request_date).toLocaleDateString() : '',
      dueDate: ticket.Due_date ? new Date(ticket.Due_date).toLocaleDateString() : '',
      remarksBrgy: ticket.Remarks || 'No remarks',
      remarksMaintenance: 'No remarks from operator yet',
      status: statusMap[ticket.Status || ''] || 'Pending',
      isChecked: checkedIds.has(String(ticket.Request_Id)),
      isExpanded: expandedIds.has(String(ticket.Request_Id)),
      hasAttachment: !!ticket.Attachment,
    };
  }, [expandedIds, checkedIds]);

  const getFilteredTickets = useCallback(() => {
    switch (activeFilter) {
      case 'Pending':
        return pendingTickets.map(convertToRequestItem);
      case 'For review':
        return forReviewTickets.map(convertToRequestItem);
      case 'Done':
        return doneTickets.map(convertToRequestItem);
      case 'Canceled':
        return canceledTickets.map(convertToRequestItem);
      default:
        return [];
    }
  }, [activeFilter, pendingTickets, forReviewTickets, doneTickets, canceledTickets, convertToRequestItem]);

  const toggleRequestExpanded = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleRequestChecked = (id: string) => {
    setCheckedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleFilterChange = (filter: FilterTab) => {
    // Collapse all expanded items when changing filter
    setExpandedIds(new Set());
    setActiveFilter(filter);
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const handleRefresh = useCallback(() => {
    // Collapse all items on refresh
    setExpandedIds(new Set());
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
    
    refresh();
  }, [refresh]);

  const handleMarkDone = useCallback(async (requestId: string, remarks: string, attachments: any[]) => {
    try {
      await submitForVerification(Number(requestId));
      // You can add remarks and attachments handling here later
    } catch (error: any) {
      console.error('Error marking done:', error);
      throw error;
    }
  }, [submitForVerification]);

  const filteredRequests = getFilteredTickets();

  return (
    <View style={tw`flex-1 bg-white`}>
      <ScrollView 
        ref={scrollViewRef}
        style={tw`flex-1`}
      >
        <View style={tw`px-6 pt-12 pb-24`}>
          <Text style={tw`text-text-gray text-center text-xl font-bold mb-6`}>
            Request
          </Text>

          <View style={tw`mb-8`}>
            <Tabs
              tabs={filters}
              activeTab={activeFilter}
              onTabChange={(value) => handleFilterChange(value as FilterTab)}
            />
          </View>

          {error && (
            <View style={tw`bg-red-50 border border-red-200 rounded-lg p-4 mb-4`}>
              <Text style={tw`text-red-600 text-sm`}>{error}</Text>
            </View>
          )}

          {loading ? (
            <View style={tw`items-center justify-center py-12`}>
              <ActivityIndicator size="large" color="#2E523A" />
              <Text style={tw`text-[#2E523A] font-semibold text-base mt-2`}>
                Loading requests...
              </Text>
            </View>
          ) : filteredRequests.length === 0 ? (
            <View style={tw`items-center justify-center py-12`}>
              <Text style={tw`text-text-gray font-semibold text-base`}>
                No {activeFilter.toLowerCase()} requests found
              </Text>
            </View>
          ) : (
            filteredRequests.map((request) => (
              <RequestCard 
                key={request.id}
                request={request}
                onToggleExpand={toggleRequestExpanded}
                onToggleCheck={toggleRequestChecked}
                onMarkDone={handleMarkDone}
              />
            ))
          )}
        </View>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setRequestFormVisible(true)}
        activeOpacity={0.8}
      >
        <Plus color="#fff" size={28} strokeWidth={3} />
      </TouchableOpacity>

      <BottomNavbar
        currentPage="Request"
        onRefresh={handleRefresh}
        onMenuPress={() => setMenuVisible(true)}
      />

      <RequestForm
        visible={requestFormVisible}
        onClose={() => setRequestFormVisible(false)}
      />

      <OMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={() => setMenuVisible(false)}
      />
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
