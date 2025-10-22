import React, { useState, useRef, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import RequestCard, { RequestItem } from '../components/RequestCard';

type FilterTab = 'Pending' | 'For review' | 'Done' | 'Canceled';

export default function ORequest() {
  const [activeFilter, setActiveFilter] = useState<FilterTab>('Pending');
  const scrollViewRef = useRef<ScrollView>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [requests, setRequests] = useState<RequestItem[]>([
    // Pending requests
    {
      id: '112103',
      title: 'Change filters',
      description: 'Change the stage 2 filters on SIBOL Machine 2',
      requestNumber: '112103',
      dateAssigned: 'August 10, 2025',
      dueDate: 'August 15, 2025',
      remarksBrgy: 'Change filter',
      remarksMaintenance: 'Filter is broken and was changed into new one.',
      status: 'Pending',
      isChecked: false,
      isExpanded: false,
      hasAttachment: true,
    },
    {
      id: '112106',
      title: 'Inspect leakage',
      description: 'Inspect possible water leakage on SIBOL Machine 2',
      requestNumber: '112106',
      dateAssigned: 'August 11, 2025',
      dueDate: 'August 16, 2025',
      remarksBrgy: 'Water puddle found underneath the unit',
      remarksMaintenance: 'Leak found in drainage pipe, temporary fix applied.',
      status: 'Pending',
      isChecked: false,
      isExpanded: false,
      hasAttachment: true,
    },
    {
      id: '112109',
      title: 'Calibrate sensors',
      description: 'Calibrate all temperature sensors on SIBOL Machine 3',
      requestNumber: '112109',
      dateAssigned: 'August 12, 2025',
      dueDate: 'August 17, 2025',
      remarksBrgy: 'Temperature readings seem inaccurate',
      remarksMaintenance: 'All sensors calibrated against reference thermometer.',
      status: 'Pending',
      isChecked: false,
      isExpanded: false,
      hasAttachment: false,
    },
    
    // For review requests
    {
      id: '112105',
      title: 'Clean intake valve',
      description: 'Clean the clogged intake valve on SIBOL Machine 3',
      requestNumber: '112105',
      dateAssigned: 'August 12, 2025',
      dueDate: 'August 14, 2025',
      remarksBrgy: 'Valve is clogged',
      remarksMaintenance: 'Valve cleaned and tested, flow restored to normal.',
      status: 'For review',
      isChecked: false,
      isExpanded: false,
      hasAttachment: false,
    },
    {
      id: '112108',
      title: 'Replace pump',
      description: 'Replace the circulation pump on SIBOL Machine 1',
      requestNumber: '112108',
      dateAssigned: 'August 10, 2025',
      dueDate: 'August 13, 2025',
      remarksBrgy: 'Pump making loud noise',
      remarksMaintenance: 'Pump replaced with spare unit, old pump sent for repair.',
      status: 'For review',
      isChecked: false,
      isExpanded: false,
      hasAttachment: true,
    },
    
    // Done requests
    {
      id: '112104',
      title: 'Replace sensor',
      description: 'Replace faulty temperature sensor on SIBOL Machine 1',
      requestNumber: '112104',
      dateAssigned: 'August 8, 2025',
      dueDate: 'August 11, 2025',
      remarksBrgy: 'Sensor malfunctioning',
      remarksMaintenance: 'Sensor replaced with new model, calibration completed.',
      status: 'Done',
      isChecked: false,
      isExpanded: false,
      hasAttachment: true,
    },
    {
      id: '112107',
      title: 'Update software',
      description: 'Update control software on SIBOL Machine 2',
      requestNumber: '112107',
      dateAssigned: 'August 5, 2025',
      dueDate: 'August 7, 2025',
      remarksBrgy: 'Software update needed',
      remarksMaintenance: 'Software updated to v2.5.1, all systems tested and functioning properly.',
      status: 'Done',
      isChecked: false,
      isExpanded: false,
      hasAttachment: false,
    },
    
    // Canceled requests
    {
      id: '112110',
      title: 'Install backup power',
      description: 'Install backup power system for SIBOL Machine 1',
      requestNumber: '112110',
      dateAssigned: 'August 1, 2025',
      dueDate: 'August 10, 2025',
      remarksBrgy: 'Need backup during power outages',
      remarksMaintenance: 'Canceled due to budget constraints.',
      status: 'Canceled',
      isChecked: false,
      isExpanded: false,
      hasAttachment: false,
    },
    {
      id: '112111',
      title: 'Relocate machine',
      description: 'Move SIBOL Machine 2 to new location',
      requestNumber: '112111',
      dateAssigned: 'July 28, 2025',
      dueDate: 'August 5, 2025',
      remarksBrgy: 'Need to relocate for better access',
      remarksMaintenance: 'Request canceled as current location is optimal.',
      status: 'Canceled',
      isChecked: false,
      isExpanded: false,
      hasAttachment: true,
    },
  ]);

  const filters: FilterTab[] = ['Pending', 'For review', 'Done', 'Canceled'];

  const toggleRequestExpanded = (id: string) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, isExpanded: !req.isExpanded } : req
    ));
  };

  const toggleRequestChecked = (id: string) => {
    setRequests(requests.map(req => 
      req.id === id ? { ...req, isChecked: !req.isChecked } : req
    ));
  };

  const handleFilterChange = (filter: FilterTab) => {
    setRequests(requests.map(req => ({
      ...req,
      isExpanded: false
    })));
    
    setActiveFilter(filter);
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    
    setRequests(requests.map(req => ({
      ...req,
      isExpanded: false
    })));
    
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
    
    setTimeout(() => {
      setIsRefreshing(false);
    }, 1000);
  }, [requests]);

  const filteredRequests = requests.filter(req => req.status === activeFilter);

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
            <View style={tw`flex-row items-center justify-center bg-white border border-[#CAD3CA] rounded-2xl p-1`}>
              {filters.map((filter) => (
                <TouchableOpacity
                  key={filter}
                  onPress={() => handleFilterChange(filter)}
                  style={[
                    tw`flex-1 py-2 px-3 rounded-2xl`,
                    activeFilter === filter && tw`bg-[#88AB8E] border border-[#88AB8E]`,
                  ]}
                >
                  <Text
                    style={[
                      tw`text-center text-[13px] font-semibold`,
                      activeFilter === filter ? tw`text-white` : tw`text-text-gray`,
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {isRefreshing ? (
            <View style={tw`items-center justify-center py-12`}>
              <ActivityIndicator size="large" color="#2E523A" />
              <Text style={tw`text-[#2E523A] font-semibold text-base mt-2`}>
                Refreshing...
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
              />
            ))
          )}
        </View>
      </ScrollView>

      <BottomNavbar 
        currentPage="Request" 
        onRefresh={handleRefresh}
      />
    </View>
  );
}
