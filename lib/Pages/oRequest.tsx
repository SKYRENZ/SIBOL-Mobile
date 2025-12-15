import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, ActivityIndicator } from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import RequestCard, { RequestItem } from '../components/RequestCard';
import Tabs from '../components/commons/Tabs';
import { useMaintenance } from '../hooks/useMaintenance';
import { MaintenanceTicket } from '../services/maintenanceService';
import OMenu from '../components/oMenu'; // ✅ Add this import

type FilterTab = 'Pending' | 'For review' | 'Done' | 'Canceled';

export default function ORequest() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Pending');
  const scrollViewRef = useRef<ScrollView>(null);
  const [menuVisible, setMenuVisible] = useState(false); // ✅ Add menu state
  
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

      <BottomNavbar 
        currentPage="Request" 
        onRefresh={handleRefresh}
        onMenuPress={() => setMenuVisible(true)} // ✅ Add this prop
      />

      {/* ✅ Add the OMenu component */}
      <OMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onNavigate={() => setMenuVisible(false)} 
      />
    </View>
  );
}
