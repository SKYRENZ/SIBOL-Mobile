import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { ChevronDown, X } from 'lucide-react-native';
import Button from './commons/Button';
import { fetchAdditiveTypes, AdditiveType } from '../services/additivesService';
import tw from 'twrnc'; // ✅ match RequestForm

interface AdditiveInputProps {
  visible: boolean;
  onClose: () => void;
  onSave?: (payload: {
    additiveId: number;
    additiveName: string; // ✅ add
    unit: string;
    value: string;
  }) => Promise<void> | void;
}

export default function AdditiveInput({ visible, onClose, onSave }: AdditiveInputProps) {
  const [additiveOptions, setAdditiveOptions] = useState<AdditiveType[]>([]);
  const [additive, setAdditive] = useState('');
  const [additiveId, setAdditiveId] = useState<number | null>(null);
  const [additiveDropdownOpen, setAdditiveDropdownOpen] = useState(false);
  const [unit, setUnit] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);

  // ✅ same keyboard handling approach as RequestForm
  const [kavKey, setKavKey] = useState(0);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      if (Platform.OS === 'android') {
        setTimeout(() => setKavKey((k) => k + 1), 220);
      }
    });
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (visible) {
      fetchAdditiveTypes()
        .then(setAdditiveOptions)
        .catch(() => setAdditiveOptions([]));
    }
  }, [visible]);

  useEffect(() => {
    if (!visible) {
      setAdditive('');
      setAdditiveId(null);
      setUnit('');
      setValue('');
      setError(null);
      setAdditiveDropdownOpen(false);
      setSaving(false);
    }
  }, [visible]);

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

  const validateAndSave = async () => {
    if (saving) return;

    setError(null);
    if (!additiveId) return setError('Please select an additive');
    if (!unit || !unit.trim()) return setError('Please select a unit');
    if (!value || !/^\d+(\.\d{1,2})?$/.test(value)) return setError('Please enter a valid numeric value');

    try {
      setSaving(true);
      await onSave?.({
        additiveId,
        additiveName: additive, // ✅ add
        unit,
        value,
      });
      onClose();
    } catch {
      setError('Failed to add additive. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={() => !saving && onClose()}>
        <View style={tw`flex-1 bg-black/35 justify-center items-center p-4`}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              key={kavKey}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 0}
              style={tw`flex-1 w-full`}
            >
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  tw`px-0 py-4`,
                  { flexGrow: 1, justifyContent: keyboardVisible ? 'flex-start' : 'center' },
                ]}
              >
                <View
                  style={[
                    tw`w-full max-w-[345px] bg-white rounded-[14px] p-5 pb-6 relative`,
                    { alignSelf: 'center' },
                    {
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowOffset: { width: 0, height: 4 },
                      shadowRadius: 4,
                      elevation: 8,
                    },
                  ]}
                >
                  <View style={tw`flex-row justify-between items-center mb-4 relative`}>
                    <Text style={tw`flex-1 text-center text-[18px] font-bold text-[#6C8770]`}>
                      Input an Additive
                    </Text>

                    <TouchableOpacity
                      onPress={onClose}
                      style={tw`absolute right-0 p-1`}
                      activeOpacity={0.7}
                      disabled={saving}
                    >
                      <X color="#88AB8E" size={20} strokeWidth={2.5} />
                    </TouchableOpacity>
                  </View>

                  <View style={tw`mb-4`}>
                    <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Additive:</Text>

                    <TouchableOpacity
                      style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 min-h-[40px] flex-row items-center justify-between`}
                      onPress={() => setAdditiveDropdownOpen((v) => !v)}
                      disabled={saving}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={
                          additive
                            ? tw`text-[12px] text-[#2E523A] font-medium`
                            : tw`text-[12px] text-[#B0C4B0] font-medium`
                        }
                      >
                        {additive || 'Select additive'}
                      </Text>
                      <ChevronDown color="#88AB8E" size={18} />
                    </TouchableOpacity>

                    {additiveDropdownOpen && (
                      <View style={tw`mt-2 bg-white border border-[#88AB8E] rounded-[10px] max-h-[180px] overflow-hidden`}>
                        <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
                          {additiveOptions.map((item) => (
                            <TouchableOpacity
                              key={String(item.id)}
                              style={tw`px-3 py-3 border-b border-[#E6F0E9]`}
                              onPress={() => handleSelectAdditive(item)}
                              disabled={saving}
                            >
                              <Text style={tw`text-[12px] text-[#2E523A] font-medium`}>{item.name}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  <View style={tw`flex-row gap-3 mb-4`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Unit:</Text>
                      <TextInput
                        style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                        placeholder="e.g. liters"
                        placeholderTextColor="#B0C4B0"
                        value={unit}
                        onChangeText={handleChangeUnit}
                        editable={!saving}
                      />
                    </View>

                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Value:</Text>
                      <TextInput
                        style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                        placeholder="0.00"
                        placeholderTextColor="#B0C4B0"
                        value={value}
                        keyboardType="numeric"
                        onChangeText={handleChangeValue}
                        editable={!saving}
                      />
                    </View>
                  </View>

                  <View style={tw`flex-row gap-3 mb-4`}>
                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Date:</Text>
                      <TextInput
                        style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                        value={new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        editable={false}
                      />
                    </View>

                    <View style={tw`flex-1`}>
                      <Text style={tw`text-[13px] font-semibold text-[#88AB8E] mb-1.5`}>Time:</Text>
                      <TextInput
                        style={tw`bg-white border border-[#88AB8E] rounded-[10px] px-3 py-2.5 text-[12px] text-[#2E523A] font-medium min-h-[40px]`}
                        value={new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        editable={false}
                      />
                    </View>
                  </View>

                  {error ? (
                    <Text style={tw`text-[#C65C5C] text-[12px] mb-3 text-center font-medium`}>
                      {error}
                    </Text>
                  ) : null}

                  <View style={tw`mt-2`}>
                    <Button
                      title={saving ? 'Adding...' : 'Add'}
                      onPress={validateAndSave}
                      variant="primary"
                      style={tw`min-h-[44px]`}
                      disabled={saving}
                    />
                  </View>

                  {saving && (
                    <View style={tw`absolute inset-0 bg-white/80 justify-center items-center rounded-[14px]`}>
                      <ActivityIndicator size="large" color="#2E523A" />
                    </View>
                  )}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
