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
import { X } from 'lucide-react-native';
import Button from './commons/Button';

interface OInputWasteProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: {
    machineId: string;
    weightTotal: string;
    date: Date;
  }) => void;
}

export default function OInputWaste({
  visible,
  onClose,
  onSave,
}: OInputWasteProps) {
  const [machineId, setMachineId] = useState('');
  const [weightTotal, setWeightTotal] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  const resetForm = () => {
    setMachineId('');
    setWeightTotal('');
    setError(null);
  };

  const handleChangeMachineId = (text: string) => {
    setMachineId(text);
    if (error) setError(null);
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

  const formatDateDisplay = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const validateAndSave = () => {
    setError(null);

    if (!machineId || !machineId.trim()) {
      setError('Please enter a Machine ID');
      return;
    }

    if (!weightTotal || !/^\d+(\.\d{1,2})?$/.test(weightTotal)) {
      setError('Please enter a valid weight');
      return;
    }

    if (onSave) {
      onSave({
        machineId,
        weightTotal,
        date: new Date(),
      });
    }

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

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Machine ID</Text>
                    <TextInput
                      value={machineId}
                      onChangeText={handleChangeMachineId}
                      placeholder=""
                      placeholderTextColor="#B0C4B0"
                      style={styles.input}
                      maxLength={50}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.label}>Weight Total</Text>
                    <TextInput
                      value={weightTotal}
                      onChangeText={handleChangeWeightTotal}
                      placeholder=""
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
});
