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
import { fetchAdditiveTypes, AdditiveType } from '../services/additivesService';

interface AdditiveInputProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: {
    additiveId: number;
    unit: string;
    value: string;
  }) => void;
}

export default function AdditiveInput({ visible, onClose, onSave }: AdditiveInputProps) {
  const [additiveOptions, setAdditiveOptions] = useState<AdditiveType[]>([]);
  const [additive, setAdditive] = useState('');
  const [additiveId, setAdditiveId] = useState<number | null>(null);
  const [additiveDropdownOpen, setAdditiveDropdownOpen] = useState(false);
  const [unit, setUnit] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchAdditiveTypes()
        .then(setAdditiveOptions)
        .catch(() => setAdditiveOptions([]));
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) resetForm();
  }, [visible]);

  const resetForm = () => {
    setAdditive('');
    setAdditiveId(null);
    setUnit('');
    setValue('');
    setError(null);
    setAdditiveDropdownOpen(false);
  };

  const handleSelectAdditive = (selected: AdditiveType) => {
    setAdditive(selected.name);
    setAdditiveId(selected.id);
    setAdditiveDropdownOpen(false);
    if (error) setError(null);
  };

  const handleChangeUnit = (text: string) => {
    setUnit(text);
    if (error) setError(null);
  };

  const handleChangeValue = (text: string) => {
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

  const validateAndSave = () => {
    setError(null);

    if (!additiveId) {
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

    onSave?.({ additiveId, unit, value });
    resetForm();
    onClose();
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
              <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                <View style={styles.card}>
                  <Text style={styles.heading}>Input an Additive</Text>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Additive:</Text>
                    <TouchableOpacity
                      style={styles.dropdownButton}
                      onPress={() => setAdditiveDropdownOpen(!additiveDropdownOpen)}
                    >
                      <Text style={[styles.dropdownButtonText, !additive && styles.placeholderText]}>
                        {additive || 'Select additive'}
                      </Text>
                      <ChevronDown color="#6C8770" size={14} />
                    </TouchableOpacity>
                    {additiveDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        <FlatList
                          data={additiveOptions}
                          keyExtractor={(item) => String(item.id)}
                          renderItem={({ item }) => (
                            <TouchableOpacity
                              style={styles.dropdownItem}
                              onPress={() => handleSelectAdditive(item)}
                            >
                              <Text style={styles.dropdownItemText}>{item.name}</Text>
                            </TouchableOpacity>
                          )}
                        />
                      </View>
                    )}
                  </View>

                  <View style={styles.rowContainer}>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Unit:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="e.g. liters"
                        value={unit}
                        onChangeText={handleChangeUnit}
                      />
                    </View>

                    <View style={styles.halfField}>
                      <Text style={styles.label}>Value:</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="0.00"
                        value={value}
                        keyboardType="numeric"
                        onChangeText={handleChangeValue}
                      />
                    </View>
                  </View>

                  <View style={styles.rowContainer}>
                    <View style={styles.halfField}>
                      <Text style={styles.label}>Date:</Text>
                      <Text style={styles.readonlyText}>
                        {new Date().toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>

                    <View style={styles.halfField}>
                      <Text style={styles.label}>Time:</Text>
                      <Text style={styles.readonlyText}>
                        {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>

                  {error ? <Text style={styles.error}>{error}</Text> : null}

                  <Button title="Add" onPress={validateAndSave} variant="primary" />
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
    gap: 12,
    marginBottom: 16,
  },
  halfField: {
    flex: 1,
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
  readonlyText: {
    backgroundColor: '#F6FBF7',
    borderWidth: 1,
    borderColor: '#88AB8E',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#2E523A',
    fontWeight: '500',
    minHeight: 40,
  },
});
