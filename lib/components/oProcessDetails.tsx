import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback, Animated, Easing } from 'react-native';
import tw from '../utils/tailwind';
import { Filter, ChevronDown } from 'lucide-react-native';

interface ProcessDetail {
  id: string;
  stage: string;
  description: string;
  requestNumber: string;
  dateAssigned: string;
  dueDate: string;
  remarks: string;
}

interface OProcessDetailsProps {
  machineId?: string;
}

const mockProcessDetails: ProcessDetail[] = [
  {
    id: '1',
    stage: 'Stage 2: Water (H20)',
    description: 'Add water to stage 2',
    requestNumber: '9/13/2025',
    dateAssigned: 'August 10, 2025',
    dueDate: 'August 10, 2025',
    remarks: 'Change filter',
  },
];

export default function OProcessDetails({ machineId }: OProcessDetailsProps) {
  const [selectedFilter, setSelectedFilter] = useState<'Today' | 'Week' | 'Month'>('Today');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const buttonRef = React.useRef<any>(null);
  const dropdownAnim = React.useRef(new Animated.Value(0)).current;
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width?: number }>({ top: 0, left: 0 });
  const handleSelect = (value: 'Today' | 'Week' | 'Month') => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setFilterDropdownOpen(false);
      setSelectedFilter(value);
    });
  };

  const openDropdown = () => {
    const node = buttonRef.current;
    if (node && node.measure) {
      (node as any).measure((fx: number, fy: number, width: number, height: number, px: number, py: number) => {
        setDropdownPos({ top: py + height + 6, left: px, width });
        setFilterDropdownOpen(true);
        Animated.timing(dropdownAnim, {
          toValue: 1,
          duration: 160,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      });
    } else {
      setFilterDropdownOpen(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }).start();
    }
  };

  const closeDropdown = () => {
    Animated.timing(dropdownAnim, {
      toValue: 0,
      duration: 120,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => setFilterDropdownOpen(false));
  };

  return (
    <ScrollView style={tw`flex-1 px-4 mt-6`} contentContainerStyle={tw`pb-24`}>
      {/* Filter Button */}
      <View style={tw`flex-row gap-3 mb-6`}>
        <TouchableOpacity
          ref={buttonRef}
          style={tw`bg-primary rounded-full px-4 py-2 flex-row items-center gap-2`}
          onPress={() => (filterDropdownOpen ? closeDropdown() : openDropdown())}
        >
          <Filter color="white" size={16} strokeWidth={2} />
          <Text style={tw`text-white font-bold text-xs`}>{selectedFilter}</Text>
          <ChevronDown color="white" size={12} strokeWidth={2} />
        </TouchableOpacity>

        <Modal
          visible={filterDropdownOpen}
          transparent
          animationType="none"
          onRequestClose={closeDropdown}
        >
          <TouchableWithoutFeedback onPress={closeDropdown}>
            <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} />
          </TouchableWithoutFeedback>

          <Animated.View
            pointerEvents="box-none"
            style={{
              position: 'absolute',
              top: dropdownPos.top,
              left: dropdownPos.left,
              minWidth: dropdownPos.width ?? 120,
              transform: [
                {
                  translateY: dropdownAnim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }),
                },
              ],
              opacity: dropdownAnim,
            }}
          >
            <View style={[tw`bg-white rounded-lg p-2 border border-gray-200 shadow-md`, { elevation: 4 }]}>
              {(['Today', 'Week', 'Month'] as Array<'Today' | 'Week' | 'Month'>).map((opt) => (
                <TouchableOpacity
                  key={opt}
                  onPress={() => handleSelect(opt)}
                  style={tw`px-3 py-2 rounded-md ${opt === selectedFilter ? 'bg-[#E8F5EA]' : ''}`}
                >
                  <Text style={tw`${opt === selectedFilter ? 'text-[#2E523A] font-bold' : 'text-[#6C8770] font-semibold'} text-xs`}>
                    {opt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>
        </Modal>
      </View>

      {mockProcessDetails.map((detail) => (
        <View key={detail.id} style={tw`mb-6`}>
          <View
            style={tw`border border-[#88AB8E] rounded-2xl bg-white overflow-hidden shadow-md`}
          >
            {/* Top Section with Stage Title */}
            <View style={tw`p-4 border-b border-gray-200`}>
              <Text style={tw`text-[#2E523A] font-bold text-sm mb-2`}>
                {detail.stage}
              </Text>
              <Text style={tw`text-[#6C8770] font-semibold text-xs`}>
                {detail.description}
              </Text>
            </View>

            {/* Details Grid */}
            <View style={tw`p-4`}>
              <View style={tw`gap-3`}>
                <View style={tw`flex-row justify-between items-start`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-xs flex-1`}>
                    Request number:
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-xs flex-1 text-right`}>
                    {detail.requestNumber}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between items-start`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-xs flex-1`}>
                    Date Assigned:
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-xs flex-1 text-right`}>
                    {detail.dateAssigned}
                  </Text>
                </View>

                <View style={tw`flex-row justify-between items-start`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-xs flex-1`}>
                    Due Date:
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-xs flex-1 text-right`}>
                    {detail.dueDate}
                  </Text>
                </View>

                {/* Remarks Row */}
                <View style={tw`flex-row justify-between items-start`}>
                  <Text style={tw`text-[#4F6853] font-semibold text-xs flex-1`}>
                    Remarks from brgy:
                  </Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-xs flex-1 text-right`}>
                    {detail.remarks}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
