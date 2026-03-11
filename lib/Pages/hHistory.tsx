import React, { useEffect, useMemo, useState } from 'react';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Modal,
  Platform,
  Dimensions,
  ActivityIndicator,
  DeviceEventEmitter, // added
} from 'react-native';
import { ChevronDown, X, HelpCircle } from 'lucide-react-native';
import { TourGuideProvider, TourGuideZone, useTourGuideController } from 'rn-tourguide';
import CustomTooltip from '../components/commons/CustomTooltip';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import HistoryCard from '../components/HistoryCard';
import BottomNavbar from '../components/hBotNav';
import { fetchMyHistory, type HistoryApiItem } from '../services/historyService';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ already present
import BottomNavSpacer from '../components/commons/BottomNavSpacer'; // ✅ added
import tw from '../utils/tailwind'; // <-- added

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterOption = 'All' | 'This Week' | 'This Month' | 'Custom';

type UiHistoryItem = HistoryApiItem & {
  dateObj: Date;
  dateLabel: string;
};

function HHistoryContent() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // ✅ add
  const { start, canStart, getCurrentStep } = useTourGuideController();

  const NAV_HEIGHT = 72; // adjust to match your BottomNavbar height

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
      // initial load when screen focused
      load();

      // listen for explicit updates instead of polling
      const sub = DeviceEventEmitter.addListener('historyUpdated', () => {
        load();
      });

      return () => {
        sub.remove();
      };
    }, [])
  );

  // Track tour state and close dropdown when tour starts
  useEffect(() => {
    const checkTourState = () => {
      const isActive = getCurrentStep() !== undefined;
      setIsTourActive(isActive);
      if (isActive) {
        setShowFilterDropdown(false);
      }
    };

    // Check initially
    checkTourState();

    // Check periodically (tour guide updates)
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
      if (event.type === 'dismissed') {
        setShowCalendar(false);
        return;
      }
    }

    if (date) {
      if (selectingDateType === 'start') {
        setCustomStartDate(date);
        if (Platform.OS === 'android') {
          setSelectingDateType('end');
        }
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

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 32,
      paddingBottom: 12,
      backgroundColor: '#FFFFFF',
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      textAlign: 'center',
    },
    helpButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterRow: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      zIndex: isTourActive ? 0 : 1000,
      elevation: isTourActive ? 0 : 1000,
    },
    filterContainer: { position: 'relative', zIndex: isTourActive ? 0 : 1000, elevation: isTourActive ? 0 : 1000 },
    filterButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#2E523A',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      minWidth: 100,
    },
    filterButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '500', marginRight: 6 },
    dropdownContainer: {
      position: 'absolute',
      top: '100%',
      right: 0,
      backgroundColor: '#FFFFFF',
      borderRadius: 8,
      marginTop: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: isTourActive ? 0 : 1000,
      zIndex: isTourActive ? 0 : 1000,
      borderWidth: 1,
      borderColor: '#E5E7EB',
      minWidth: 140,
    },
    dropdownItem: {
      paddingHorizontal: 16,
      paddingVertical: 14,
      borderBottomWidth: 1,
      borderBottomColor: '#F3F4F6',
    },
    dropdownItemLast: { borderBottomWidth: 0 },
    dropdownItemText: { fontSize: 14, color: '#374151' },
    dropdownItemTextSelected: { color: '#2E523A', fontWeight: '600' },
    scrollView: { flex: 1 },
    scrollViewContent: {
      paddingTop: 8,
      paddingBottom: 16, // changed: remove NAV_HEIGHT + insets.bottom math — spacer handles bottom space
    },
    emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60, paddingHorizontal: 40 },
    emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center' },

    calendarModalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' },
    calendarContainer: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: SCREEN_WIDTH * 0.9, maxWidth: 360 },
    calendarHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    calendarTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
    calendarCloseButton: { padding: 4 },

    codeOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
    codeBox: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 18, width: '100%', maxWidth: 360 },
    codeTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 10 },
    codeValue: { fontSize: 18, fontWeight: '800', color: '#2E523A', letterSpacing: 1.2, textAlign: 'center', paddingVertical: 10, backgroundColor: '#F3F4F6', borderRadius: 10 },
    codeClose: { marginTop: 12, backgroundColor: '#2E523A', borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
    codeCloseText: { color: '#FFFFFF', fontWeight: '700' },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={{ width: 40 }} />
        <Text style={styles.headerTitle}>History</Text>
        <View style={{ width: 40, alignItems: 'center', justifyContent: 'center' }}>
          <TourGuideZone
            zone={20}
            text="Tap here anytime to view this guide again."
            shape="circle"
            borderRadius={15}
          >
            <TouchableOpacity
              style={{ width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 16, backgroundColor: 'transparent' }}
              onPress={() => start()}
            >
              <Text style={{ fontSize: 18, color: '#111827', fontWeight: '700' }}>?</Text>
            </TouchableOpacity>
          </TourGuideZone>
        </View>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterContainer}>
          <TourGuideZone
            zone={22}
            text="Use this filter to view history by All, This Week, This Month, or a custom date range."
            shape="rectangle"
            borderRadius={8}
          >
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setShowFilterDropdown(!showFilterDropdown)}
            >
              <Text style={styles.filterButtonText}>{getFilterDisplayText()}</Text>
              <ChevronDown size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </TourGuideZone>
  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <View style={tw`flex-row items-center px-5 pt-5 pb-3 bg-white`}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-1 mr-3`}>
          <ArrowLeft size={24} color="#2E523A" />
        </TouchableOpacity>
        <Text style={tw`flex-1 text-lg font-semibold text-gray-900 text-center mr-10`}>History</Text>
      </View>

      <View style={tw`px-4 pb-4 flex-row justify-end z-50`}>
        <View style={tw`relative z-50`}>
          <TouchableOpacity
            style={tw`flex-row items-center justify-between bg-[#2E523A] rounded-lg px-3 py-2 min-w-[100px]`}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Text style={tw`text-white text-[13px] font-medium mr-1`}>{getFilterDisplayText()}</Text>
            <ChevronDown size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {showFilterDropdown && (
            <View style={tw`absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 min-w-[140px]`}>
              {filterOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    index !== filterOptions.length - 1 ? tw`px-4 py-3 border-b border-gray-100` : tw`px-4 py-3`,
                  ]}
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

      <ScrollView
        style={tw`flex-1`}
        contentContainerStyle={tw`pt-2 pb-4`}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
                  onViewCode={(code) => {
                    setSelectedCode(code);
                    setCodeModalVisible(true);
                  }}
                  isFirstCard={false}
                />
              )}
            </View>
          filteredData.map((item) => (
            <HistoryCard
              key={item.id}
              title={item.type === 'QR_SCAN' ? 'QR Scan' : item.title}
              date={item.dateLabel}
              type={item.type}
              pointsDelta={item.pointsDelta}
              kgDelta={item.kgDelta}
              code={item.code}
              status={item.status} // pass status so card can show "Claimed"
              onViewCode={(code) => {
                setSelectedCode(code);
                setCodeModalVisible(true);
              }}
            />
          ))
        ) : (
          <View style={tw`items-center justify-center py-16 px-10`}>
            <Text style={tw`text-gray-500 text-base text-center`}>No history records found for this period</Text>
          </View>
        )}

        {/* spacer so content can scroll above bottom nav */}
        <BottomNavSpacer />
      </ScrollView>

      {/* Calendar Modal (unchanged layout but tailwind'd) */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={tw`flex-1 bg-[rgba(0,0,0,0.5)] justify-center items-center`}>
          <View style={tw`bg-white rounded-2xl p-5 w-[90%] max-w-[360px]`}>
            <View style={tw`flex-row justify-between items-center mb-4`}>
              <Text style={tw`text-lg font-semibold text-gray-900`}>Select Date Range</Text>
              <TouchableOpacity style={tw`p-1`} onPress={() => setShowCalendar(false)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <DateTimePicker
              value={selectingDateType === 'start' ? customStartDate : customEndDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleDateChange}
            />
          </View>
        </View>
      </Modal>

      {/* Code Modal */}
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
