import React, { useState, useMemo } from 'react';
import { useNavigation } from '@react-navigation/native';
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
} from 'react-native';
import { ArrowLeft, ChevronDown, X } from 'lucide-react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import HistoryCard from '../components/HistoryCard';
import BottomNavbar from '../components/hBotNav';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type FilterOption = 'All' | 'This Week' | 'This Month' | 'Custom';

interface HistoryItem {
  id: number;
  date: string;
  dateObj: Date;
  pointsEarned: number;
  totalContribution: string;
  area: string;
}

export default function HHistory() {
  const navigation = useNavigation();
  const [selectedFilter, setSelectedFilter] = useState<FilterOption>('All');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date>(new Date());
  const [customEndDate, setCustomEndDate] = useState<Date>(new Date());
  const [selectingDateType, setSelectingDateType] = useState<'start' | 'end'>('start');

  const filterOptions: FilterOption[] = ['All', 'This Week', 'This Month', 'Custom'];

  // Mock history data
  const historyData: HistoryItem[] = [
    {
      id: 1,
      date: 'December 15, 2024',
      dateObj: new Date(2024, 11, 15),
      pointsEarned: 25,
      totalContribution: '5.2 kg',
      area: 'Barangay San Antonio',
    },
    {
      id: 2,
      date: 'December 10, 2024',
      dateObj: new Date(2024, 11, 10),
      pointsEarned: 18,
      totalContribution: '3.8 kg',
      area: 'Barangay Poblacion',
    },
    {
      id: 3,
      date: 'December 5, 2024',
      dateObj: new Date(2024, 11, 5),
      pointsEarned: 32,
      totalContribution: '7.1 kg',
      area: 'Barangay San Antonio',
    },
    {
      id: 4,
      date: 'November 28, 2024',
      dateObj: new Date(2024, 10, 28),
      pointsEarned: 15,
      totalContribution: '3.0 kg',
      area: 'Barangay Poblacion',
    },
    {
      id: 5,
      date: 'November 15, 2024',
      dateObj: new Date(2024, 10, 15),
      pointsEarned: 22,
      totalContribution: '4.5 kg',
      area: 'Barangay San Antonio',
    },
  ];

  // Filter logic 
  const filteredData = useMemo(() => {
    const now = new Date();
    
    switch (selectedFilter) {
      case 'All':
        return historyData;
      
      case 'This Week': {
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        
        return historyData.filter(item => 
          item.dateObj >= startOfWeek && item.dateObj <= endOfWeek
        );
      }
      
      case 'This Month': {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        return historyData.filter(item => 
          item.dateObj >= startOfMonth && item.dateObj <= endOfMonth
        );
      }
      
      case 'Custom': {
        const start = new Date(customStartDate);
        start.setHours(0, 0, 0, 0);
        
        const end = new Date(customEndDate);
        end.setHours(23, 59, 59, 999);
        
        return historyData.filter(item => 
          item.dateObj >= start && item.dateObj <= end
        );
      }
      
      default:
        return historyData;
    }
  }, [selectedFilter, customStartDate, customEndDate]);

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
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
      paddingBottom: 12,
      backgroundColor: '#FFFFFF',
    },
    backButton: {
      padding: 4,
      marginRight: 12,
    },
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
    filterContainer: {
      position: 'relative',
      zIndex: 1000,
      elevation: 1000,
    },
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
    filterButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '500',
      marginRight: 6,
    },
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
    dropdownItemLast: {
      borderBottomWidth: 0,
    },
    dropdownItemText: {
      fontSize: 14,
      color: '#374151',
    },
    dropdownItemTextSelected: {
      color: '#2E523A',
      fontWeight: '600',
    },
    scrollView: {
      flex: 1,
      zIndex: 1,
    },
    scrollViewContent: {
      paddingBottom: 120,
      paddingTop: 8,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyText: {
      fontSize: 16,
      color: '#6B7280',
      textAlign: 'center',
    },
    calendarModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    calendarContainer: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      width: SCREEN_WIDTH * 0.9,
      maxWidth: 360,
    },
    calendarHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    calendarTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
    },
    calendarCloseButton: {
      padding: 4,
    },
    calendarLabel: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 8,
      textAlign: 'center',
    },
    calendarDateDisplay: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 16,
      paddingTop: 8,
    },
    dateBox: {
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#F3F4F6',
      borderRadius: 8,
      minWidth: 120,
    },
    dateBoxActive: {
      backgroundColor: '#2E523A',
    },
    dateBoxLabel: {
      fontSize: 12,
      color: '#6B7280',
      marginBottom: 4,
    },
    dateBoxLabelActive: {
      color: '#FFFFFF',
    },
    dateBoxValue: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
    },
    dateBoxValueActive: {
      color: '#FFFFFF',
    },
    datePickerWrapper: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    confirmButton: {
      backgroundColor: '#2E523A',
      borderRadius: 8,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 16,
    },
    confirmButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color="#2E523A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
      </View>

      {/* Filter Row */}
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
                  style={[
                    styles.dropdownItem,
                    index === filterOptions.length - 1 && styles.dropdownItemLast,
                  ]}
                  onPress={() => handleFilterSelect(option)}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selectedFilter === option && styles.dropdownItemTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      {/* History List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {filteredData.length > 0 ? (
          filteredData.map((item) => (
            <HistoryCard
              key={item.id}
              date={item.date}
              pointsEarned={item.pointsEarned}
              totalContribution={item.totalContribution}
              area={item.area}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No history records found for this period</Text>
          </View>
        )}
      </ScrollView>

      {/* Calendar Modal */}
      <Modal visible={showCalendar} transparent animationType="fade">
        <View style={styles.calendarModalOverlay}>
          <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>Select Date Range</Text>
              <TouchableOpacity
                style={styles.calendarCloseButton}
                onPress={() => setShowCalendar(false)}
              >
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.calendarLabel}>
              {selectingDateType === 'start' ? 'Select Start Date' : 'Select End Date'}
            </Text>

            <View style={styles.calendarDateDisplay}>
              <TouchableOpacity
                style={[styles.dateBox, selectingDateType === 'start' && styles.dateBoxActive]}
                onPress={() => setSelectingDateType('start')}
              >
                <Text
                  style={[
                    styles.dateBoxLabel,
                    selectingDateType === 'start' && styles.dateBoxLabelActive,
                  ]}
                >
                  Start Date
                </Text>
                <Text
                  style={[
                    styles.dateBoxValue,
                    selectingDateType === 'start' && styles.dateBoxValueActive,
                  ]}
                >
                  {customStartDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.dateBox, selectingDateType === 'end' && styles.dateBoxActive]}
                onPress={() => setSelectingDateType('end')}
              >
                <Text
                  style={[
                    styles.dateBoxLabel,
                    selectingDateType === 'end' && styles.dateBoxLabelActive,
                  ]}
                >
                  End Date
                </Text>
                <Text
                  style={[
                    styles.dateBoxValue,
                    selectingDateType === 'end' && styles.dateBoxValueActive,
                  ]}
                >
                  {customEndDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.datePickerWrapper}>
              <DateTimePicker
                value={selectingDateType === 'start' ? customStartDate : customEndDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleDateChange}
              />
            </View>

            {Platform.OS === 'ios' && (
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={() => {
                  if (selectingDateType === 'start') {
                    setSelectingDateType('end');
                  } else {
                    setShowCalendar(false);
                    setSelectedFilter('Custom');
                  }
                }}
              >
                <Text style={styles.confirmButtonText}>
                  {selectingDateType === 'start' ? 'Next: Select End Date' : 'Confirm'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
        <BottomNavbar />
      </View>
    </SafeAreaView>
  );
}
