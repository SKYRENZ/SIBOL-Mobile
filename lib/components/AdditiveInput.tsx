import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  FlatList,
} from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import tw from '../utils/tailwind';
import Button from './commons/Button';

interface AdditiveInputProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: {
    additive: string;
    unit: string;
    value: string;
    date: Date;
    time: string;
  }) => void;
}

const ADDITIVE_OPTIONS = [
  'Ferric Chloride',
  'Alum',
  'Sodium Hydroxide',
  'Lime',
  'Chlorine',
  'Hydrogen Peroxide',
];

const UNIT_OPTIONS = [
  'liters',
  'milliliters',
  'kilos',
  'grams',
  'kilograms',
  'milligrams',
];

export default function AdditiveInput({
  visible,
  onClose,
  onSave,
}: AdditiveInputProps) {
  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const [additive, setAdditive] = useState('');
  const [additiveDropdownOpen, setAdditiveDropdownOpen] = useState(false);
  const [unit, setUnit] = useState('');
  const [value, setValue] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [time, setTime] = useState('');
  const [timeInput, setTimeInput] = useState(getCurrentTime());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setAdditive('');
    setUnit('');
    setValue('');
    setSelectedDate(new Date());
    setTime('');
    setTimeInput(getCurrentTime());
    setError(null);
    setAdditiveDropdownOpen(false);
  };

  const handleSelectAdditive = (selected: string) => {
    setAdditive(selected);
    setAdditiveDropdownOpen(false);
    if (error) setError(null);
  };

  const handleChangeUnit = (text: string) => {
    setUnit(text);
    if (error) setError(null);
  };

  const handleChangeValue = (text: string) => {
    // Allow only numbers and decimals
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    if (cleaned.includes('.')) {
      const [intPart, decPart] = cleaned.split('.');
      cleaned = intPart + '.' + decPart.slice(0, 2);
    }
    setValue(cleaned);
    if (error) setError(null);
  };

  const handleChangeTime = (text: string) => {
    let cleaned = text.replace(/[^0-9:]/g, '');
    if (cleaned.length <= 2) {
      setTimeInput(cleaned);
    } else if (cleaned.length === 3) {
      const hour = cleaned.substring(0, 2);
      const min = cleaned.substring(2, 3);
      const h = parseInt(hour);
      if (!isNaN(h) && h <= 23) {
        setTimeInput(`${hour}:${min}`);
      } else {
        setTimeInput(hour);
      }
    } else {
      const hour = cleaned.substring(0, 2);
      const min = cleaned.substring(3, 5);
      const h = parseInt(hour);
      const m = parseInt(min);
      if (!isNaN(h) && h <= 23 && !isNaN(m) && m <= 59) {
        setTimeInput(`${hour}:${min}`);
      } else {
        setTimeInput(hour + ':' + (cleaned.length > 2 ? cleaned.substring(3, 5) : ''));
      }
    }
    if (error) setError(null);
  };

  const validateAndSave = () => {
    setError(null);

    if (!additive || !additive.trim()) {
      setError('Please select an additive');
      return;
    }

    if (!unit || !unit.trim()) {
      setError('Please select a unit');
      return;
    }

    if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) {
      setError('Please enter a valid numeric value');
      return;
    }

    if (!timeInput || !timeInput.includes(':')) {
      setError('Please enter a valid time (HH:MM)');
      return;
    }

    const [hourStr, minStr] = timeInput.split(':');
    const hour = parseInt(hourStr);
    const min = parseInt(minStr);

    if (isNaN(hour) || hour < 0 || hour > 23 || isNaN(min) || min < 0 || min > 59) {
      setError('Please enter a valid time (00:00 - 23:59)');
      return;
    }

    if (onSave) {
      onSave({
        additive,
        unit,
        value,
        date: selectedDate,
        time: timeInput,
      });
    }

    resetForm();
    onClose();
  };

  const formatDateDisplay = () => {
    return selectedDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.centered}
            >
              <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.card}>
                  <Text style={styles.heading}>Input an Additive</Text>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Additive:</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setAdditiveDropdownOpen(!additiveDropdownOpen)}
                    >
                      <Text
                        style={[
                          styles.dropdownButtonText,
                          !additive && styles.placeholderText,
                        ]}
                      >
                        {additive || 'Select additive'}
                      </Text>
                      <ChevronDown
                        color="#88AB8E"
                        size={16}
                        strokeWidth={2}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Additive Dropdown Overlay */}
                  {additiveDropdownOpen && (
                    <View style={styles.overlayContainer}>
                      <View style={styles.dropdownMenuOverlay}>
                        <FlatList
                          data={ADDITIVE_OPTIONS}
                          keyExtractor={(item) => item}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => handleSelectAdditive(item)}
                            >
                              <Text
                                style={[
                                  styles.dropdownItemText,
                                  item === additive &&
                                    styles.dropdownItemTextSelected,
                                ]}
                              >
                                {item}
                              </Text>
                            </TouchableOpacity>
                          )}
                          scrollEnabled={false}
                        />
                      </View>
                    </View>
                  )}

                  {/* Unit and Value */}
                  <View style={styles.rowContainer}>
                    <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Unit:</Text>
                      <TextInput
                        value={unit}
                        onChangeText={handleChangeUnit}
                        placeholder="e.g. liters"
                        placeholderTextColor="#B0C4B0"
                        style={styles.input}
                        maxLength={20}
                      />
                    </View>

                    <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Value:</Text>
                      <TextInput
                        value={value}
                        onChangeText={handleChangeValue}
                        placeholder="0.00"
                        placeholderTextColor="#B0C4B0"
                        keyboardType="decimal-pad"
                        style={styles.input}
                        maxLength={10}
                      />
                    </View>
                  </View>

                  {/* Date and Time */}
                  <View style={styles.rowContainer}>
                    <View style={[styles.fieldContainer, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.label}>Date:</Text>
                      <TextInput
                        style={styles.input}
                        value={formatDateDisplay()}
                        editable={false}
                        placeholder="MM/DD/YYYY"
                        placeholderTextColor="#B0C4B0"
                      />
                    </View>

                    <View style={[styles.fieldContainer, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.label}>Time:</Text>
                      <TextInput
                        value={timeInput}
                        onChangeText={handleChangeTime}
                        placeholder="HH:MM"
                        placeholderTextColor="#B0C4B0"
                        keyboardType="number-pad"
                        style={styles.input}
                        maxLength={5}
                      />
                    </View>
                  </View>

                  {/* Error Message */}
                  {error && <Text style={styles.error}>{error}</Text>}

                  {/* Add Button */}
                  <View style={styles.buttonContainer}>
                    <Button
                      title="Add"
                      onPress={validateAndSave}
                      variant="primary"
                      style={styles.button}
                    />
                  </View>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  centered: {
    width: '100%',
    alignItems: 'center',
    overflow: 'visible',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    overflow: 'visible',
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 20,
    paddingBottom: 24, 
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 8,
    overflow: 'visible',
    position: 'relative',
  },
  heading: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#6C8770',
    marginBottom: 18,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#88AB8E',
    marginBottom: 6,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#88AB8E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 40,
  },
  dropdownButtonText: {
    fontSize: 12,
    color: '#2E523A',
    fontWeight: '500',
    flex: 1,
  },
  placeholderText: {
    color: '#B0C4B0',
  },
  overlayContainer: {
    position: 'absolute',
    top: 128,
    left: 20,
    right: 20,
    zIndex: 100,
    elevation: 20,
  },
  dropdownMenuOverlay: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#88AB8E',
    borderRadius: 8,
    maxHeight: 180,
    zIndex: 100,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  dropdownMenu: {
    marginTop: 6,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#88AB8E',
    borderRadius: 8,
    maxHeight: 120,
    zIndex: 10,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E6F0E9',
  },
  dropdownItemText: {
    fontSize: 12,
    color: '#2E523A',
    fontWeight: '500',
  },
  dropdownItemTextSelected: {
    color: '#2E523A',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#88AB8E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#2E523A',
    fontWeight: '500',
    minHeight: 40,
    justifyContent: 'center',
  },
  error: {
    color: '#C65C5C',
    fontSize: 12,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    minHeight: 44,
  },
});
