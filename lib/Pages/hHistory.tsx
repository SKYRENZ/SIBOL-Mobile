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
} from 'react-native';
import { ArrowLeft, ChevronDown, X } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import HistoryCard from '../components/HistoryCard';
import BottomNavbar from '../components/hBotNav';
import { fetchMyHistory, type HistoryApiItem } from '../services/historyService';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // ✅ add

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type FilterOption = 'All' | 'This Week' | 'This Month' | 'Custom';

type UiHistoryItem = HistoryApiItem & {
  dateObj: Date;
  dateLabel: string;
};

export default function HHistory() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets(); // ✅ add

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
    }, [])
  );

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
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: '#FFFFFF',
    },
    backButton: { padding: 4, marginRight: 12 },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      textAlign: 'center',
      marginRight: 40,
    },
    filterRow: {
      paddingHorizontal: 16,
      paddingBottom: 16,
      flexDirection: 'row',
      justifyContent: 'flex-end',
      zIndex: 1000,
      elevation: 1000,
    },
    filterContainer: { position: 'relative', zIndex: 1000, elevation: 1000 },
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
      elevation: 1000,
      zIndex: 1000,
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
      paddingBottom: NAV_HEIGHT + insets.bottom + 16,
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
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2E523A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      <View style={styles.filterRow}>
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterDropdown(!showFilterDropdown)}
          >
            <Text style={styles.filterButtonText}>{getFilterDisplayText()}</Text>
            <ChevronDown size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {showFilterDropdown && (
            <View style={styles.dropdownContainer}>
              {filterOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.dropdownItem, index === filterOptions.length - 1 && styles.dropdownItemLast]}
                  onPress={() => handleFilterSelect(option)}
                >
                  <Text style={[styles.dropdownItemText, selectedFilter === option && styles.dropdownItemTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {loading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color="#2E523A" />
          </View>
        ) : error ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={load} style={{ marginTop: 12 }}>
              <Text style={{ color: '#2E523A', fontWeight: '700' }}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredData.length > 0 ? (
          filteredData.map((item) => (
            <HistoryCard
              key={item.id}
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
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No history records found for this period</Text>
          </View>
        )}
      </ScrollView>

      {/* Calendar Modal (unchanged) */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: SCREEN_WIDTH * 0.9, maxWidth: 360 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>Select Date Range</Text>
              <TouchableOpacity style={{ padding: 4 }} onPress={() => setShowCalendar(false)}>
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
        <View style={styles.codeOverlay}>
          <View style={styles.codeBox}>
            <Text style={styles.codeTitle}>Reward Code</Text>
            <Text style={styles.codeValue}>{selectedCode}</Text>
            <TouchableOpacity style={styles.codeClose} onPress={() => setCodeModalVisible(false)}>
              <Text style={styles.codeCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <BottomNavbar />
      </View>
    </SafeAreaView>
  );
}
