import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
} from 'react-native';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react-native';
import tw from '../../utils/tailwind';

type Props = {
  initialSelectedDate?: Date;
  initialCurrentDate?: Date;
  onSelect?: (date: Date) => void;
};

export default function Calendar({
  initialSelectedDate = new Date(2021, 9, 17),
  initialCurrentDate = new Date(2021, 9, 12),
  onSelect,
}: Props) {
  const [selectedDate, setSelectedDate] = useState<Date>(initialSelectedDate);
  const [currentDate] = useState<Date>(initialCurrentDate);
  const [displayDate, setDisplayDate] = useState<Date>(
    new Date(initialSelectedDate.getFullYear(), initialSelectedDate.getMonth(), 1)
  );

  const [pickerVisible, setPickerVisible] = useState(false);
  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];
  const [pickerMonth, setPickerMonth] = useState<number>(displayDate.getMonth());
  const [pickerYear, setPickerYear] = useState<number>(displayDate.getFullYear());

  useEffect(() => {
    if (onSelect) onSelect(selectedDate);
  }, [selectedDate]);

  const generateCalendarMatrix = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const lead = (firstDay + 6) % 7; 

    const weeks: (number | null)[][] = [];
    let week = Array(7).fill(null) as (number | null)[];
    let day = 1;

    for (let i = 0; i < 7; i++) {
      if (i >= lead && day <= daysInMonth) {
        week[i] = day++;
      } else {
        week[i] = null;
      }
    }
    weeks.push(week);

    while (day <= daysInMonth) {
      week = Array(7).fill(null) as (number | null)[];
      for (let i = 0; i < 7 && day <= daysInMonth; i++) {
        week[i] = day++;
      }
      weeks.push(week);
    }

    return weeks;
  };

  const renderCalendarGrid = () => {
    const weeks = generateCalendarMatrix(displayDate);
    const displayMonth = displayDate.getMonth();
    const displayYear = displayDate.getFullYear();

    return weeks.map((week, weekIdx) => (
      <View key={weekIdx} style={tw`flex-row justify-around mb-1`}>
        {week.map((day, dayIdx) => {
          if (day === null) {
            return (
              <View key={`empty-${weekIdx}-${dayIdx}`} style={styles.dayCell}>
                <Text style={tw`text-black/40 text-[15px]`}>
                  {weekIdx === 5 ? dayIdx + 1 : ''}
                </Text>
              </View>
            );
          }

          const isSelected = selectedDate.getFullYear() === displayYear &&
                             selectedDate.getMonth() === displayMonth &&
                             selectedDate.getDate() === day;
          const isCurrent = currentDate.getFullYear() === displayYear &&
                            currentDate.getMonth() === displayMonth &&
                            currentDate.getDate() === day;

          return (
            <TouchableOpacity
              key={day}
              style={styles.dayCell}
              onPress={() => setSelectedDate(new Date(displayYear, displayMonth, day))}
            >
              {isCurrent && !isSelected && (
                <View style={styles.currentDayCircle} />
              )}
              {isSelected && (
                <View style={styles.selectedDayCircle} />
              )}
              <Text style={[
                tw`text-[15px]`,
                isSelected ? tw`text-white` : tw`text-black/87`
              ]}>
                {day}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    ));
  };

  const prevMonth = () => {
    const y = displayDate.getFullYear();
    const m = displayDate.getMonth();
    setDisplayDate(new Date(y, m - 1, 1));
  };
  const nextMonth = () => {
    const y = displayDate.getFullYear();
    const m = displayDate.getMonth();
    setDisplayDate(new Date(y, m + 1, 1));
  };

  const openPicker = () => {
    setPickerMonth(displayDate.getMonth());
    setPickerYear(displayDate.getFullYear());
    setPickerVisible(true);
  };
  const closePicker = () => setPickerVisible(false);
  const applyPicker = () => {
    setDisplayDate(new Date(pickerYear, pickerMonth, 1));
    setPickerVisible(false);
  };
  const prevPickerYear = () => setPickerYear(y => y - 1);
  const nextPickerYear = () => setPickerYear(y => y + 1);

  return (
    <View>
      <View style={styles.calendarContainer}>
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={openPicker} style={tw`flex-row items-center flex-1`}>
            <Text style={styles.monthYear}>
              {displayDate.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <ChevronDown size={20} color="rgba(0,0,0,0.6)" style={tw`ml-1`} />
          </TouchableOpacity>
          <View style={tw`flex-row gap-4`}>
            <TouchableOpacity onPress={prevMonth}>
              <ChevronLeft size={20} color="rgba(0,0,0,0.6)" />
            </TouchableOpacity>
            <TouchableOpacity onPress={nextMonth}>
              <ChevronRight size={20} color="rgba(0,0,0,0.6)" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.weekdaysRow}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
            <View key={idx} style={styles.weekdayCell}>
              <Text style={styles.weekdayText}>{day}</Text>
            </View>
          ))}
        </View>

        <View style={tw`px-5 pb-3`}>
          {renderCalendarGrid()}
        </View>
      </View>

      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={closePicker}
      >
        <Pressable style={styles.modalOverlay} onPress={closePicker}>
          <Pressable style={styles.pickerContainer} onPress={() => {}}>
            <View style={styles.yearSelector}>
              <TouchableOpacity onPress={prevPickerYear}>
                <ChevronLeft size={18} color="rgba(0,0,0,0.6)" />
              </TouchableOpacity>
              <Text style={styles.pickerYearText}>{pickerYear}</Text>
              <TouchableOpacity onPress={nextPickerYear}>
                <ChevronRight size={18} color="rgba(0,0,0,0.6)" />
              </TouchableOpacity>
            </View>

            <View style={styles.monthsGrid}>
              {months.map((m, idx) => {
                const selected = idx === pickerMonth;
                return (
                  <TouchableOpacity
                    key={m}
                    style={[styles.monthItem, selected && styles.monthItemSelected]}
                    onPress={() => setPickerMonth(idx)}
                  >
                    <Text style={[styles.monthText, selected && styles.monthTextSelected]}>
                      {m.slice(0,3)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.pickerButtons}>
              <TouchableOpacity style={styles.pickerButton} onPress={closePicker}>
                <Text style={styles.pickerButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.pickerButton, styles.pickerApply]} onPress={applyPicker}>
                <Text style={[styles.pickerButtonText, styles.pickerApplyText]}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  calendarContainer: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 15,
    marginBottom: 24,
    marginTop: -22,     
    paddingTop: 20,     
    minHeight: 100,
    zIndex: 50,
    overflow: 'visible',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  monthYear: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '500',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  weekdayCell: {
    width: 32,            
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.6)',
    fontWeight: '400',
  },
  dayCell: {
    width: 32,           
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  currentDayCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.87)',
    backgroundColor: '#fff',
  },
  selectedDayCircle: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6C8770',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerContainer: {
    width: '88%',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',                  
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 22,
  },
  yearSelector: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    gap: 18,
  },
  pickerYearText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(0,0,0,0.8)',
    marginHorizontal: 12,
  },
  monthsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  monthItem: {
    width: '30%',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  monthItemSelected: {
    backgroundColor: '#6C8770',
  },
  monthText: {
    color: 'rgba(0,0,0,0.8)',
    fontWeight: '600',
  },
  monthTextSelected: {
    color: '#fff',
  },
  pickerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
    gap: 8,
  },
  pickerButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  pickerApply: {
    backgroundColor: '#2E523A',
  },
  pickerButtonText: {
    color: '#2E523A',
    fontWeight: '600',
  },
  pickerApplyText: {
    color: '#fff',
  },
});
