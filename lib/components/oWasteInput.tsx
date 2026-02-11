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
  FlatList,
  ActivityIndicator,
} from 'react-native';

import { createCollection, NormalizedArea } from '../services/wasteCollectionService';
import { listWasteContainers, WasteContainer } from '../services/wasteContainerService';
import Snackbar from './commons/Snackbar';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: { area: string | number; weight: number }) => void;
}

export default function oWasteInput({ visible, onClose, onSave }: Props) {
  const [area, setArea] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState<number | null>(null);
  const [weight, setWeight] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [snack, setSnack] = useState({ visible: false, message: '', type: 'error' as 'error' | 'success' | 'info' });
  const [currentSensorKg, setCurrentSensorKg] = useState<number | null>(null);

  // suggestions
  const [areasList, setAreasList] = useState<NormalizedArea[]>([]);
  const [suggestions, setSuggestions] = useState<NormalizedArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const SUGGESTION_LIMIT = 6;

  useEffect(() => {
    if (!visible) {
      setError(null);
      setArea('');
      setWeight('');
      setSuggestions([]);
      setSelectedAreaId(null);
    }
  }, [visible]);

  // load areas list from waste containers
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoadingAreas(true);
      try {
        const containers = await listWasteContainers();
        const list = normalizeContainersToAreas(containers);
        if (!mounted) return;
        setAreasList(list);
        console.debug('[oWasteInput] loaded areas count:', list.length, 'sample:', list.slice(0,10).map(i => ({ id: i.id, label: i.label })));
        if (list.length > 0) {
          try {
            const sampleRaw = list[0].raw;
            console.debug('[oWasteInput] sample area raw keys:', sampleRaw ? Object.keys(sampleRaw).slice(0,20) : 'no raw', sampleRaw && typeof sampleRaw === 'object' ? sampleRaw : undefined);
          } catch (e) {
            // ignore logging errors
          }
        }
      } catch (e) {
        console.error('[oWasteInput] failed to load areas', e);
      } finally {
        setLoadingAreas(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [visible]);

  const onChangeArea = (text: string) => {
    setArea(text);
    setSelectedAreaId(null); // typing clears selection
    setWeight('');
    setCurrentSensorKg(null);
    setError(null);

    const q = text.trim().toLowerCase();
    if (!q) {
      setSuggestions(areasList.slice(0, SUGGESTION_LIMIT));
      setShowSuggestions(true);
      return;
    }

    // prefix match on normalized label first
    let matches = areasList.filter(a => a.label.toLowerCase().startsWith(q));

    // substring fallback
    if (matches.length === 0) {
      matches = areasList.filter(a => a.label.toLowerCase().includes(q));
    }

    setSuggestions(matches.slice(0, SUGGESTION_LIMIT));
    setShowSuggestions(true);
  };

  const selectSuggestion = (s: NormalizedArea) => {
    setArea(s.label);
    setSelectedAreaId(Number(s.id));
    setSuggestions([]);
    setShowSuggestions(false);
    setError(null);
    // try to auto-fill weight from the area's raw container data (with debug)
    try {
      const raw = (s as any).raw;
      const { value: found, key: matchedKey } = extractWeightFromRaw(raw, { debug: true });
      console.debug('[oWasteInput] selectSuggestion raw matchedKey:', matchedKey, 'found:', found, 'areaId:', s.id);
      if (found !== null && found !== undefined) {
        const num = Number(found);
        if (!Number.isNaN(num)) {
          // keep at most 2 decimals
          const formatted = Math.round(num * 100) / 100;
          setWeight(String(formatted));
          setCurrentSensorKg(Number(formatted));
        }
      } else {
        // container has no explicit current weight — leave field empty for manual entry
        setWeight('');
        setCurrentSensorKg(null);
      }
    } catch (e) {
      console.error('[oWasteInput] selectSuggestion: error extracting weight', e);
    }
  };

  // When the user leaves the Area input, if it matches an existing area label exactly,
  // select it and auto-fill weight from its raw data.
  const onAreaBlur = () => {
    const q = area.trim().toLowerCase();
    if (!q) return;
    const exact = areasList.find(a => a.label.trim().toLowerCase() === q);
    if (exact) selectSuggestion(exact);
  };

  // Try to extract a numeric weight value from a container's raw data.
  // Returns an object with `{ value, key }` so callers can log which key matched.
  // By default only explicit `current_weight_kg` (and close variants) are checked.
  function extractWeightFromRaw(raw: any, opts?: { debug?: boolean }): { value: number | null; key: string | null } {
    if (!raw) return { value: null, key: null };
    const candidates: [string, any][] = [
      // backend alias uses `current_kg`
      ['current_kg', raw.current_kg],
      ['currentKg', raw.currentKg],
      // older/other variants
      ['current_weight_kg', raw.current_weight_kg],
      ['current_weightkg', raw.current_weightkg],
      ['currentWeightKg', raw.currentWeightKg],
    ];

    for (const [key, val] of candidates) {
      if (val === undefined || val === null) continue;
      const n = Number(val);
      if (!Number.isNaN(n)) return { value: n, key };
    }

    return { value: null, key: null };
  }

  // allow decimals: digits and one dot, limit 2 decimals
  const onChangeWeight = (raw: string) => {
    let cleaned = raw.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
    if (cleaned.includes('.')) {
      const [intPart, decPart] = cleaned.split('.');
      cleaned = intPart + '.' + decPart.slice(0, 2);
    }
    setWeight(cleaned);
    if (error) setError(null);
  };

  const handleSave = async () => {
    setError(null);

    if (!area || !area.toString().trim()) {
      setError('Please enter/select an area.');
      return;
    }

    // accept decimals
    if (!weight || !/^\d+(\.\d{1,2})?$/.test(weight)) {
      setError('Weight must be a number (kg), up to two decimals.');
      return;
    }

    const numericWeight = parseFloat(weight);
    if (Number.isNaN(numericWeight) || numericWeight <= 0) {
      setError('Weight must be a positive number.');
      return;
    }

    try {
      // If user selected a suggestion, submit the numeric id; otherwise submit the typed area (service will resolve)
      const areaPayload: string | number = selectedAreaId ?? area.trim();

      // Prevent manual save when container has no weight data:
      // find the normalized area entry (by id or label)
      let matchedArea: NormalizedArea | undefined;
      if (typeof areaPayload === 'number') matchedArea = areasList.find(a => a.id === areaPayload);
      else matchedArea = areasList.find(a => a.label.trim().toLowerCase() === String(areaPayload).trim().toLowerCase());

      if (matchedArea) {
        const hasSensor = !!(matchedArea.raw && (matchedArea.raw.has_weight_data === true || matchedArea.raw.current_kg !== undefined));
        if (!hasSensor) {
          // operator entering manual weight while container has no sensor data — show snackbar and block
          setSnack({ visible: true, message: 'Container has no weight sensor data — cannot submit manual measurement.', type: 'error' });
          return;
        }

        // If sensor exists, deny submissions greater than the sensor reading.
        const sensorVal = matchedArea.raw && (matchedArea.raw.current_kg !== undefined ? Number(matchedArea.raw.current_kg) : null);
        if (sensorVal !== null && !Number.isNaN(sensorVal)) {
          if (numericWeight > sensorVal) {
            setSnack({ visible: true, message: `Entered weight exceeds current sensor reading (${sensorVal} kg). Submission blocked.`, type: 'error' });
            return;
          }
        }
      }
      await createCollection(areaPayload, numericWeight);

      if (onSave) onSave({ area: areaPayload, weight: numericWeight });
      onClose();
      // reset
      setArea('');
      setSelectedAreaId(null);
      setWeight('');
    } catch (err: any) {
      console.error('Failed to submit waste input', err);
      setError(err?.message || 'Failed to submit waste input');
    }
  };

  // whether the Save button should be enabled
  const canSave = () => {
    if (!area || !area.toString().trim()) return false;
    if (!weight) return false;
    const numeric = Number(weight);
    if (Number.isNaN(numeric)) return false;
    // Disallow submitting a value greater than current sensor reading when present
    if (currentSensorKg !== null && numeric > currentSensorKg) return false;

    // allow zero if there's a sensor reading (explicit 0 kg)
    if (numeric > 0) return true;
    if (numeric === 0 && currentSensorKg !== null) return true;
    return false;
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
              <View style={styles.card}>
                <Text style={styles.heading}>Collect waste near you</Text>

                <Text style={styles.label}>Area</Text>
                <TextInput
                  value={area}
                  onChangeText={onChangeArea}
                  placeholder="Petunia St."
                  placeholderTextColor="#9aa89a"
                  style={styles.input}
                  returnKeyType="done"
                  autoCorrect={false}
                  autoCapitalize="words"
                  onFocus={() => {
                    setShowSuggestions(true);
                    if (!area.trim()) {
                      setSuggestions(areasList.slice(0, SUGGESTION_LIMIT));
                    }
                  }}
                  onBlur={onAreaBlur}
                />

                {loadingAreas ? (
                  <ActivityIndicator size="small" style={{ marginTop: 8 }} />
                ) : showSuggestions && suggestions.length > 0 ? (
                  <View style={{ maxHeight: 160, borderWidth: 1, borderColor: '#e6efe6', borderRadius: 8, marginTop: 8 }}>
                    <FlatList
                      data={suggestions}
                      keyExtractor={(item) => String(item.id ?? item.label)}
                      renderItem={({ item }) => {
                        const label = item.label;
                        return (
                          <TouchableOpacity onPress={() => selectSuggestion(item)} style={{ padding: 10 }}>
                            <Text style={{ color: '#153915' }}>{label}</Text>
                          </TouchableOpacity>
                        );
                      }}
                    />
                  </View>
                ) : null}

                <Text style={[styles.label, { marginTop: 14 }]}>Weight collected</Text>
                <View style={styles.rowInput}>
                  <TextInput
                    value={weight}
                    onChangeText={onChangeWeight}
                    placeholder="35.5"
                    placeholderTextColor="#9aa89a"
                    keyboardType="decimal-pad"
                    style={[styles.input, { flex: 1, paddingRight: 64 }]}
                    maxLength={10}
                  />
                  <View style={styles.unit}>
                    <Text style={styles.unitText}>kg</Text>
                  </View>
                </View>

                {currentSensorKg !== null ? (
                  <Text style={styles.sensorInfo}>Sensor reading: {currentSensorKg} kg</Text>
                ) : null}

                {error ? <Text style={styles.error}>{error}</Text> : null}

                <Snackbar visible={snack.visible} message={snack.message} type={snack.type} onDismiss={() => setSnack(s => ({ ...s, visible: false }))} />

                <TouchableOpacity
                  style={[styles.saveBtn, !canSave() ? styles.saveBtnDisabled : null]}
                  onPress={handleSave}
                  activeOpacity={0.8}
                  disabled={!canSave()}
                >
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

function normalizeContainersToAreas(containers: WasteContainer[]): NormalizedArea[] {
  const map = new Map<number, NormalizedArea>();
  containers.forEach((c) => {
    const areaId = Number(c?.raw?.area_id ?? c?.raw?.Area_id);
    const label = String(c.areaName || c.name || '').trim();
    if (!label) return;
    if (Number.isFinite(areaId)) {
      if (!map.has(areaId)) {
        // include sensor flags/values into raw so UI can access them
        const rawWithFlags = Object.assign({}, c.raw ?? {});
        // backend-normalized fields on the WasteContainer
        if ((c as any).currentKg !== undefined) rawWithFlags.current_kg = (c as any).currentKg;
        if ((c as any).hasWeightData !== undefined) rawWithFlags.has_weight_data = (c as any).hasWeightData;
        map.set(areaId, { id: areaId, label, raw: rawWithFlags });
      }
    }
  });

  const items = Array.from(map.values());
  if (items.length) return items;

  return containers
    .map((c, idx) => ({
      id: c.id ?? idx,
      label: String(c.areaName || c.name || `Area ${idx + 1}`),
      raw: Object.assign({}, c.raw ?? {}, { current_kg: (c as any).currentKg, has_weight_data: (c as any).hasWeightData }),
    }));
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
    paddingVertical: 12,
    color: '#153915',
  },
  rowInput: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
  },
  unit: {
    position: 'absolute',
    right: 12,
    top: 0,
    bottom: 0,
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
  saveBtnDisabled: {
    backgroundColor: '#9aa89a',
    opacity: 0.7,
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
  sensorInfo: {
    color: '#2f6b3f',
    marginTop: 8,
    textAlign: 'left',
    fontSize: 13,
    opacity: 0.9,
  },
});
