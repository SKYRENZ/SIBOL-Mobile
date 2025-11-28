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
  Platform
} from 'react-native';

import { createCollection } from '../services/wasteCollectionService';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: { area: string; weight: number }) => void;
}

export default function oWasteInput({ visible, onClose, onSave }: Props) {
  const [area, setArea] = useState('');
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setError(null);
    }
  }, [visible]);

  const onChangeWeight = (raw: string) => {
    const digits = raw.replace(/\D/g, '');
    setWeight(digits);
    if (error) setError(null);
  };

  const handleSave = async () => {
    if (!area.trim()) {
      setError('Please enter an area.');
      return;
    }
    if (!weight || !/^\d+$/.test(weight)) {
      setError('Weight must be an integer (kg).');
      return;
    }
    setError(null);

    const numericWeight = parseInt(weight, 10);

    try {
      // submit to backend (area can be id or name)
      await createCollection(area.trim(), numericWeight);

      // notify parent and close
      if (onSave) onSave({ area: area.trim(), weight: numericWeight });
      onClose();
    } catch (err: any) {
      console.error('Failed to submit waste input', err);
      setError(err?.message || 'Failed to submit waste input');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback >
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.centered}
            >
              <View style={styles.card}>
                <Text style={styles.heading}>Collect waste near you</Text>

                <Text style={styles.label}>Area</Text>
                <TextInput
                  value={area}
                  onChangeText={setArea}
                  placeholder="Petunia St."
                  placeholderTextColor="#9aa89a"
                  style={styles.input}
                  returnKeyType="done"
                />

                <Text style={[styles.label, { marginTop: 14 }]}>Weight collected</Text>
                <View style={styles.rowInput}>
                  <TextInput
                    value={weight}
                    onChangeText={onChangeWeight}
                    placeholder="35"
                    placeholderTextColor="#9aa89a"
                    keyboardType="number-pad"
                    style={[styles.input, { flex: 1, paddingRight: 44 }]}
                    maxLength={6}
                  />
                  <View style={styles.unit}>
                    <Text style={styles.unitText}>kg</Text>
                  </View>
                </View>

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                  <Text style={styles.saveText}>Save</Text>
                </TouchableOpacity>
              </View>
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
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  centered: {
    width: '100%',
    alignItems: 'center',
  },
  card: {
    width: '92%',
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    borderColor: '#e6efe6',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  heading: {
    textAlign: 'center',
    fontSize: 18,
    color: '#2f6b3f',
    marginBottom: 12,
    fontWeight: '600',
  },
  label: {
    color: '#2f6b3f',
    marginBottom: 6,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f7fbf7',
    borderColor: '#dfece0',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#153915',
  },
  rowInput: {
    position: 'relative',
  },
  unit: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unitText: {
    color: '#2f6b3f',
    fontWeight: '600',
  },
  saveBtn: {
    marginTop: 18,
    backgroundColor: '#2f6b3f',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
  },
  error: {
    color: '#cc3b3b',
    marginTop: 8,
    textAlign: 'center',
  },
});
