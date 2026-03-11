import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
  Dimensions,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { ChevronDown, X, ArrowLeft } from 'lucide-react-native';
import { TourGuideProvider, TourGuideZone, useTourGuideController } from 'rn-tourguide';
import CustomTooltip from '../components/commons/CustomTooltip';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import HistoryCard from '../components/HistoryCard';
import BottomNavbar from '../components/hBotNav';
import { fetchMyHistory, type HistoryApiItem } from '../services/historyService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomNavSpacer from '../components/commons/BottomNavSpacer';
import tw from '../utils/tailwind';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterOption = 'All' | 'This Week' | 'This Month' | 'Custom';

type UiHistoryItem = HistoryApiItem & {
  dateObj: Date;
  dateLabel: string;
};

function HHistoryContent() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { start, getCurrentStep } = useTourGuideController();

  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [selectingDateType, setSelectingDateType] = useState<'start' | 'end'>('start');

  const [items, setItems] = useState<UiHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [codeModalVisible, setCodeModalVisible] = useState(false);
  const [selectedCode, setSelectedCode] = useState<string>('');

  const [isTourActive, setIsTourActive] = useState(false);

  const filterOptions: FilterOption[] = ['All', 'This Week', 'This Month', 'Custom'];

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchMyHistory({ limit: 100 });
      const mapped: UiHistoryItem[] = rows.map((r) => {
        const d = new Date(r.createdAt);
        const label = d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
        return { ...r, dateObj: d, dateLabel: label };
      });
      setItems(mapped);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load history');
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      load();
      const sub = DeviceEventEmitter.addListener('historyUpdated', () => {
        load();
      });
      return () => sub.remove();
    }, [])
  );

  useEffect(() => {
    const checkTourState = () => {
      const isActive = getCurrentStep() !== undefined;
      setIsTourActive(isActive);
      if (isActive) setShowFilterDropdown(false);
    };
    checkTourState();
    const interval = setInterval(checkTourState, 100);
    return () => clearInterval(interval);
  }, [getCurrentStep]);

  const filteredData = useMemo(() => {
    const now = new Date();
    switch (selectedFilter) {
      case 'All':
        return items;
      case 'This Week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return items.filter((item) => item.dateObj >= startOfWeek && item.dateObj <= endOfWeek);
      }
      case 'This Month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return items.filter((item) => item.dateObj >= startOfMonth && item.dateObj <= endOfMonth);
      }
      case 'Custom': {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        return items.filter((item) => item.dateObj >= start && item.dateObj <= end);
      }
      default:
        return items;
    }
  }, [selectedFilter, customStartDate, customEndDate, items]);

  const handleFilterSelect = (filter: FilterOption) => {
    if (filter === 'Custom') {
      setShowFilterDropdown(false);
      setSelectingDateType('start');
      setShowCalendar(true);
    } else {
      setSelectedFilter(filter);
      setShowFilterDropdown(false);
    }
  };

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      if ((event as any).type === 'dismissed') {
        setShowCalendar(false);
        return;
      }
    }
    if (date) {
      if (selectingDateType === 'start') {
        setCustomStartDate(date);
        if (Platform.OS === 'android') setSelectingDateType('end');
      } else {
        setCustomEndDate(date);
        if (Platform.OS === 'android') {
          setShowCalendar(false);
          setSelectedFilter('Custom');
        }
      }
    }
  };

  const getFilterDisplayText = () => {
    if (selectedFilter === 'Custom') {
      const startStr = customStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const endStr = customEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startStr} - ${endStr}`;
    }
    return selectedFilter;
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row items-center px-5 pt-5 pb-3 bg-white`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1 mr-3`}>
          <ArrowLeft size={24} color="#2E523A" />
        </TouchableOpacity>
        <Text style={tw`flex-1 text-lg font-semibold text-gray-900 text-center mr-10`}>History</Text>
        <View style={tw`absolute right-4` }>
          <TourGuideZone
            zone={20}
            text="Tap here anytime to view this guide again."
            shape="circle"
            borderRadius={15}
          >
            <TouchableOpacity
              style={tw`w-8 h-8 items-center justify-center rounded-full`}
              onPress={() => start()}
            >
              <Text style={tw`text-lg text-gray-900 font-bold`}>?</Text>
            </TouchableOpacity>
          </TourGuideZone>
        </View>
      </View>

      <View style={tw`px-4 pb-4 flex-row justify-end z-50`}>
        <View style={tw`relative z-50`}>
          <TourGuideZone
            zone={22}
            text="Use this filter to view history by All, This Week, This Month, or a custom date range."
            shape="rectangle"
            borderRadius={8}
          >
            <TouchableOpacity
              style={tw`flex-row items-center justify-between bg-[#2E523A] rounded-lg px-3 py-2 min-w-[100px]`}
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Text style={tw`text-white text-[13px] font-medium mr-1`}>{getFilterDisplayText()}</Text>
              <ChevronDown size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </TourGuideZone>

          {showFilterDropdown && (
            <View style={tw`absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[140px]`}>
              {filterOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={index !== filterOptions.length - 1 ? tw`px-4 py-3 border-b border-gray-100` : tw`px-4 py-3`}
                  onPress={() => handleFilterSelect(option)}
                >
                  <Text style={ selectedFilter === option ? tw`text-[#2E523A] font-semibold` : tw`text-gray-700 text-[14px]`}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <ScrollView style={tw`flex-1`} contentContainerStyle={tw`pt-2 pb-4`} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {loading ? (
          <View style={tw`items-center justify-center py-16 px-10`}>
            <ActivityIndicator size="large" color="#2E523A" />
          </View>
        ) : error ? (
          <View style={tw`items-center justify-center py-16 px-10`}>
            <Text style={tw`text-gray-500 text-base text-center`}>{error}</Text>
            <TouchableOpacity onPress={load} style={tw`mt-3`}>
              <Text style={tw`text-[#2E523A] font-bold`}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <View key={item.id}>
              {index === 0 ? (
                <TourGuideZone
                  zone={21}
                  text="This shows your past records of claimed rewards and QR scans with points earned or deducted."
                  shape="rectangle"
                  borderRadius={12}
                >
                  <HistoryCard
                    title={item.type === 'QR_SCAN' ? 'QR Scan' : item.title}
                    date={item.dateLabel}
                    type={item.type}
                    pointsDelta={item.pointsDelta}
                    kgDelta={item.kgDelta}
                    code={item.code}
                    status={item.status}
                    onViewCode={(code) => {
                      setSelectedCode(code);
                      setCodeModalVisible(true);
                    }}
                    isFirstCard={true}
                  />
                </TourGuideZone>
              ) : (
                <HistoryCard
                  title={item.type === 'QR_SCAN' ? 'QR Scan' : item.title}
                  date={item.dateLabel}
                  type={item.type}
                  pointsDelta={item.pointsDelta}
                  kgDelta={item.kgDelta}
                  code={item.code}
                  status={item.status}
                  onViewCode={(code) => {
                    setSelectedCode(code);
                    setCodeModalVisible(true);
                  }}
                  isFirstCard={false}
                />
              )}
            </View>
          ))
        ) : (
          <View style={tw`items-center justify-center py-16 px-10`}>
            <Text style={tw`text-gray-500 text-base text-center`}>No history records found for this period</Text>
          </View>
        )}

        <BottomNavSpacer />
      </ScrollView>

      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={tw`flex-1 bg-[rgba(0,0,0,0.5)] justify-center items-center`}>
          <View style={tw`bg-white rounded-2xl p-5 w-[90%] max-w-[360px]`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-lg font-semibold text-gray-900`}>Select Date Range</Text>
              <TouchableOpacity style={tw`p-1`} onPress={() => setShowCalendar(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <DateTimePicker value={selectingDateType === 'start' ? customStartDate : customEndDate} mode="date" display={Platform.OS === 'ios' ? 'spinner' : 'default'} onChange={handleDateChange} />
          </View>
        </View>
      </Modal>

      <Modal visible={codeModalVisible} transparent animationType="fade" onRequestClose={() => setCodeModalVisible(false)}>
        <View style={tw`flex-1 bg-[rgba(0,0,0,0.5)] justify-center items-center p-5`}>
          <View style={tw`bg-white rounded-xl p-4 w-full max-w-[360px]`}>
            <Text style={tw`text-base font-bold text-gray-900 mb-2`}>Reward Code</Text>
            <Text style={tw`text-xl font-medium text-[#2E523A] tracking-wider text-center py-2 bg-[#F3F4F6] rounded-md`}>{selectedCode}</Text>
            <TouchableOpacity style={tw`mt-3 bg-[#2E523A] rounded-md py-3 items-center`} onPress={() => setCodeModalVisible(false)}>
              <Text style={tw`text-white font-bold`}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={tw`absolute inset-x-0 bottom-0`}>
        <BottomNavbar />
      </View>
    </SafeAreaView>
  );
}

export default function HHistory() {
  return (
    <TourGuideProvider
      tooltipComponent={CustomTooltip}
      androidStatusBarVisible={true}
      backdropColor="rgba(0,0,0,0.5)"
      preventOutsideInteraction={true}
    >
      <HHistoryContent />
    </TourGuideProvider>
  );
}
