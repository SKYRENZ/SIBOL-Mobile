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
} from 'react-native';
import { X, Clock, AlertCircle } from 'lucide-react-native';
import Button from './commons/Button';
import { getWasteInputsByMachineId } from '../services/wasteInputService';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OInputWasteProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: {
    machineId: string;
    weightTotal: string;
    date: Date;
  }) => void | Promise<void>;
  loading?: boolean;
  machineId?: string;
  machineName?: string; // Add machine name prop
}

export default function OInputWaste({
  visible,
  onClose,
  onSave,
  loading = false,
  machineId: machineIdProp,
  machineName: machineNameProp,
}: OInputWasteProps) {
  const [weightTotal, setWeightTotal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [lastInput, setLastInput] = useState<any>(null);
  const [loadingLastInput, setLoadingLastInput] = useState(false);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  useEffect(() => {
    if (machineIdProp) {
      // When machine ID prop is provided, fetch last input for that machine
      fetchLastInput();
    }
  }, [visible, machineIdProp]);

  const fetchLastInput = async () => {
    if (!machineIdProp) return;
    
    setLoadingLastInput(true);
    try {
      // Get current operator ID
      const rawUser = await AsyncStorage.getItem('user');
      let operatorId: number | null = null;
      
      if (rawUser) {
        const user = JSON.parse(rawUser);
        operatorId = Number(user?.Account_id ?? user?.AccountId ?? user?.id);
      }

      const inputs = await getWasteInputsByMachineId(machineIdProp);
      if (inputs && inputs.length > 0) {
        // Filter inputs by current operator if operator ID is available
        const operatorInputs = operatorId 
          ? inputs.filter((input: any) => Number(input.Account_id) === operatorId)
          : inputs;

        if (operatorInputs.length > 0) {
          // Sort by date descending and get the most recent
          const sorted = operatorInputs.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setLastInput(sorted[0]);
        } else {
          setLastInput(null);
        }
      } else {
        setLastInput(null);
      }
    } catch (err) {
      console.error('Failed to fetch last input:', err);
      setLastInput(null);
    } finally {
      setLoadingLastInput(false);
    }
  };

  const resetForm = () => {
    setWeightTotal('');
    setError(null);
  };

  const handleChangeWeightTotal = (text: string) => {
    // Allow only numbers and decimals
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    if (cleaned.includes('.')) {
      const [intPart, decPart] = cleaned.split('.');
      cleaned = intPart + '.' + decPart.slice(0, 2);
    }
    setWeightTotal(cleaned);
    if (error) setError(null);
  };

  const normalizeDateString = (value: string | null | undefined) => {
    if (!value) return null;
    // convert DB datetime formats like '2026-03-23 17:53:14' to ISO '2026-03-23T17:53:14'
    const cleaned = String(value).trim().replace(' ', 'T');
    const d = new Date(cleaned);
    return Number.isNaN(d.getTime()) ? null : d;
  };

  const formatDateDisplay = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getLastInputDate = () => {
    if (!lastInput) return null;
    const raw = lastInput.Input_datetime ?? lastInput.created_at ?? lastInput.Created_at ?? lastInput.input_datetime;
    return normalizeDateString(raw);
  };

  const formatLastInputDisplay = () => {
    if (!lastInput) return null;

    const inputDate = getLastInputDate();
    if (!inputDate) return null;
    const today = new Date();
    const isToday = inputDate.toDateString() === today.toDateString();

    let dateStr = '';
    if (isToday) {
      dateStr = `Today at ${inputDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    } else {
      dateStr = inputDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: inputDate.getFullYear() === today.getFullYear() ? undefined : 'numeric'
      });
    }
    
    return {
      date: dateStr,
      weight: lastInput.Weight ?? lastInput.weight ?? lastInput.Weight_kg ?? lastInput.weight_kg ?? null,
      timeAgo: getTimeAgo(inputDate)
    };
  };

  const getTimeAgo = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const lastInputDisplay = formatLastInputDisplay();

  const validateAndSave = async () => {
    setError(null);

    if (!machineIdProp || !machineIdProp.trim()) {
      setError('Machine ID is required');
      return;
    }

    if (!weightTotal || !/^\d+(\.\d{1,2})?$/.test(weightTotal)) {
      setError('Please enter a valid weight');
      return;
    }

    try {
      setSaving(true);
      if (onSave) {
        await onSave({
          machineId: machineIdProp,
          weightTotal,
          date: new Date(),
        });
      }
      await fetchLastInput();
      resetForm();
      onClose();
    } catch (err: any) {
      const msg = err?.message ?? 'Failed to save waste input.';
      setError(String(msg));
    } finally {
      setSaving(false);
    }
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
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
              >
                <View style={styles.card}>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <X color="#88AB8E" size={20} strokeWidth={2} />
                  </TouchableOpacity>

                  <Text style={styles.heading}>Input waste</Text>
                  
                  <Text style={styles.dateText}>{formatDateDisplay()}</Text>

                  {/* Last Input Reminder */}
                  <View style={styles.reminderContainer}>
                    {loadingLastInput ? (
                      <View style={styles.reminderItem}>
                        <Clock color="#88AB8E" size={16} strokeWidth={1.5} />
                        <Text style={styles.reminderText}>Loading last input...</Text>
                      </View>
                    ) : lastInput && lastInputDisplay ? (
                      <View style={styles.reminderItem}>
                        <Clock color="#88AB8E" size={16} strokeWidth={1.5} />
                        <View style={styles.reminderContent}>
                          <Text style={styles.reminderText}>
                            Last: {lastInputDisplay.weight ?? '-'}kg - {lastInputDisplay.date ?? 'N/A'}
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <View style={styles.reminderItem}>
                        <AlertCircle color="#C65C5C" size={16} strokeWidth={1.5} />
                        <Text style={styles.reminderTextWarning}>No previous input found</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Machine</Text>
                    <View style={[styles.input, styles.nonEditableInput]}>
                      <Text style={styles.nonEditableText}>
                        {machineNameProp || `Machine ${machineIdProp}`}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Weight Total</Text>
                    <TextInput
                      value={weightTotal}
                      onChangeText={handleChangeWeightTotal}
                      placeholder="Weight (kg)"
                      placeholderTextColor="#B0C4B0"
                      keyboardType="decimal-pad"
                      style={styles.input}
                      maxLength={10}
                    />
                  </View>

                  {error && <Text style={styles.error}>{error}</Text>}

                  <View style={styles.buttonContainer}>
                    <Button
                      title="Save"
                      onPress={validateAndSave}
                      variant="primary"
                      style={styles.button}
                      loading={loading || saving}
                      disabled={loading || saving}
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
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  scrollView: {
    width: '100%',
  },
  card: {
    width: '85%',       
    maxWidth: 360,       
    alignSelf: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.10)',
    padding: 24,
    paddingTop: 30,
    paddingBottom: 30,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 4,
    elevation: 8,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  heading: {
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '700',
    color: '#2E523A',
    marginBottom: 8,
  },
  dateText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(136, 171, 142, 0.92)',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#88AB8E',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#88AB8E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#2E523A',
    fontWeight: '500',
    minHeight: 30,
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
    marginTop: 12,
  },
  button: {
    minHeight: 34,
  },
  reminderContainer: {
    backgroundColor: 'rgba(136, 171, 142, 0.08)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#88AB8E',
  },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reminderContent: {
    marginLeft: 8,
    flex: 1,
  },
  reminderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6C8770',
    flexShrink: 1,
  },
  reminderSubText: {
    fontSize: 11,
    fontWeight: '400',
    color: '#88AB8E',
    marginTop: 2,
  },
  reminderTextWarning: {
    fontSize: 12,
    fontWeight: '500',
    color: '#C65C5C',
    marginLeft: 8,
  },
  nonEditableInput: {
    backgroundColor: '#F5F5F5',
    borderColor: '#D0D0D0',
  },
  nonEditableText: {
    fontSize: 14,
    color: '#2E523A',
    fontWeight: '500',
  },
});
