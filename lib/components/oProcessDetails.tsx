import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Modal, TouchableWithoutFeedback, Animated, Easing, ActivityIndicator } from 'react-native';
import tw from '../utils/tailwind';
import { Filter, ChevronDown } from 'lucide-react-native';
import { getWasteInputsByMachineId } from '../services/wasteInputService';

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
  machineId?: number | string | null;
  machineName?: string | null;
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

export default function OProcessDetails({ machineId, machineName }: OProcessDetailsProps) {
  const [selectedFilter, setSelectedFilter] = useState<'Today' | 'Week' | 'Month'>('Today');
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false);
  const buttonRef = React.useRef<any>(null);
  const dropdownAnim = React.useRef(new Animated.Value(0)).current;
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width?: number }>({ top: 0, left: 0 });
  const [inputs, setInputs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!machineId) {
        setInputs([]);
        return;
      }
      setLoading(true);
      try {
        const rows = await getWasteInputsByMachineId(machineId);
        if (!mounted) return;
        setInputs(rows || []);
      } catch {
        if (!mounted) return;
        setInputs([]);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [machineId]);

  const filteredInputs = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (selectedFilter === 'Today') {
      start.setHours(0, 0, 0, 0);
    } else if (selectedFilter === 'Week') {
      start.setDate(start.getDate() - 7);
    } else {
      start.setDate(start.getDate() - 30);
    }

    const end = new Date(now);
    if (selectedFilter === 'Today') {
      end.setHours(23, 59, 59, 999);
    }

    return (inputs || []).filter((row) => {
      const d = parseInputDate(row?.Input_datetime ?? row?.input_datetime ?? row?.Created_at ?? row?.created_at);
      if (!d) return false;
      return d.getTime() >= start.getTime() && d.getTime() <= end.getTime();
    });
  }, [inputs, selectedFilter]);

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

      <View style={tw`mb-4`}>
        <Text style={tw`text-[#2E523A] font-bold text-sm mb-2`}>
          Waste input history{machineName ? ` • ${machineName}` : ''}
        </Text>
      </View>

      {loading ? (
        <View style={tw`items-center py-8`}>
          <ActivityIndicator size="small" color="#2E523A" />
        </View>
      ) : filteredInputs.length === 0 ? (
        <Text style={tw`text-xs text-[#6C8770] font-semibold`}>No waste inputs yet.</Text>
      ) : (
        filteredInputs.map((row: any, idx: number) => {
          const d = parseInputDate(row?.Input_datetime ?? row?.input_datetime ?? row?.Created_at ?? row?.created_at);
          const dateLabel = d ? formatDateLabel(d) : 'Unknown date';
          const weight = Number(row?.Weight ?? row?.weight ?? 0);
          return (
            <View key={row?.Input_id ?? row?.input_id ?? idx} style={tw`mb-3`}>
              <View style={tw`border border-[#88AB8E] rounded-2xl bg-white overflow-hidden shadow-md`}>
                <View style={tw`p-4 border-b border-gray-200`}>
                  <Text style={tw`text-[#2E523A] font-bold text-sm`}>{dateLabel}</Text>
                  <Text style={tw`text-[#6C8770] font-semibold text-xs mt-1`}>Weight: {weight.toFixed(2)} kg</Text>
                </View>
                <View style={tw`p-4`}>
                  <View style={tw`flex-row justify-between items-start`}>
                    <Text style={tw`text-[#4F6853] font-semibold text-xs flex-1`}>Machine ID:</Text>
                    <Text style={tw`text-[#6C8770] font-semibold text-xs flex-1 text-right`}>
                      {row?.Machine_id ?? row?.machine_id ?? '—'}
                    </Text>
                  </View>
                  <View style={tw`flex-row justify-between items-start mt-2`}>
                    <Text style={tw`text-[#4F6853] font-semibold text-xs flex-1`}>Operator:</Text>
                    <Text style={tw`text-[#6C8770] font-semibold text-xs flex-1 text-right`}>
                      {row?.Username ?? row?.username ?? row?.Account_id ?? row?.account_id ?? '—'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

function parseInputDate(input: any): Date | null {
  if (!input) return null;
  const d = new Date(input);
  return Number.isFinite(d.getTime()) ? d : null;
}

function formatDateLabel(d: Date): string {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
