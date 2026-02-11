import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native';
import tw from '../utils/tailwind';
import { X as LucideX } from 'lucide-react-native';
import Constants from 'expo-constants'; // added

/* =========================
   BACKEND API CALL
   ========================= */
// replaced static localhost with environment + platform aware resolver
export async function analyzeWaterAPI(foodWasteKg: number) {
  const isWeb = Platform.OS === 'web';

  // Try process.env first (EXPO_WEB variables set via your .env or build), then Expo manifest extras,
  // then sensible defaults.
  const webBase =
    (process.env.EXPO_PUBLIC_API_BASE_WEB as string) ||
    (process.env.VITE_API_URL as string) ||
    'http://localhost:5000/';

  const mobileBase =
    (process.env.EXPO_PUBLIC_API_BASE_MOBILE as string) ||
    // expo config extras if you injected them
    (Constants.expoConfig?.extra?.EXPO_PUBLIC_API_BASE_MOBILE as string) ||
    (Constants.manifest?.extra?.EXPO_PUBLIC_API_BASE_MOBILE as string) ||
    // common Android emulator host fallback
    (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://192.168.1.114:5000');

  const base = isWeb ? webBase : mobileBase;

  // normalize to avoid double slashes
  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const url = `${normalizedBase}/api/ai/analyze-water`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      food_waste_kg: foodWasteKg,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze water');
  }

  return response.json();
}


interface CreateFeedstockModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CreateFeedstockModal({
  visible,
  onClose,
}: CreateFeedstockModalProps) {
  const [weightKg, setWeightKg] = useState('');
  const [mode, setMode] = useState<'input' | 'result'>('input');
  const [recommendedWater, setRecommendedWater] = useState('');
  const [explanation, setExplanation] = useState('');
  const [loading, setLoading] = useState(false);

  const handleWeightChange = (text: string) => {
    const numericValue = text.replace(/[^0-9.]/g, '');
    const parts = numericValue.split('.');
    if (parts.length > 2) return;
    setWeightKg(numericValue);
  };

  const handleCreate = async () => {
    if (!weightKg || parseFloat(weightKg) <= 0) return;

    try {
      setLoading(true);

      const result = await analyzeWaterAPI(parseFloat(weightKg));

      // ensure the displayed value is a string and includes 'L' (e.g. "4L")
      const rec = result?.recommendedWater ?? '';
      const recStr = String(rec).toUpperCase().endsWith('L') ? String(rec) : `${rec}L`;
      setRecommendedWater(recStr);

      setExplanation(result.explanation);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setMode('result');
    }
  };

  const handleClose = () => {
    setWeightKg('');
    setRecommendedWater('');
    setExplanation('');
    setMode('input');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={handleClose}>
        <View style={tw`flex-1 bg-black/50 items-center justify-center`}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={tw`bg-white rounded-[15px] w-[329px] shadow-lg border border-gray-200/40 relative`}>

              {/* Close Button */}
              <TouchableOpacity
                onPress={handleClose}
                style={tw`absolute top-4 right-4 z-10`}
              >
                <LucideX color="#2E523A" size={24} strokeWidth={2} />
              </TouchableOpacity>

              <View style={tw`px-9 py-10`}>
                {/* Title */}
                <Text style={tw`text-[#2E523A] text-center text-[20px] font-bold mb-6`}>
                  Create Feedstock
                </Text>

                {/* Explanation */}
                <Text style={tw`text-[#88AB8E] text-center text-[14px] mb-8 leading-5`}>
                  {mode === 'input'
                    ? 'Lili will suggest the most optimal amount of water for proper grinding.'
                    : explanation}
                </Text>

                {/* Label */}
                <Text style={tw`text-[#2E523A] text-[14px] font-semibold mb-2`}>
                  {mode === 'input' ? 'Weight Total' : 'Recommended Litres'}
                </Text>

                {/* Input */}
                <View style={tw`border border-[#2E523A] rounded-[10px] bg-white px-4 py-2 mb-10`}>
                  <TextInput
                    style={tw`text-[#88AB8E] text-[16px] ${Platform.OS === 'web' ? 'outline-none' : ''}`}
                    placeholder={mode === 'input' ? 'kg' : 'liters'}
                    placeholderTextColor="#88AB8E"
                    value={mode === 'input' ? weightKg : recommendedWater}
                    editable={mode === 'input'}
                    onChangeText={handleWeightChange}
                    keyboardType={Platform.OS === 'ios' ? 'decimal-pad' : 'numeric'}
                  />
                </View>

                {/* Button */}
                <TouchableOpacity
                  onPress={mode === 'input' ? handleCreate : handleClose}
                  style={tw`
                    rounded-[10px] py-3 items-center
                    ${mode === 'input'
                      ? 'bg-[#2E523A]'
                      : 'bg-[#2E523A]'}
                  `}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color={mode === 'input' ? '#fff' : '#fff'} />
                  ) : (
                    <Text
                      style={tw`
                        text-[18px] font-semibold
                        ${mode === 'input' ? 'text-white' : 'text-white'}
                      `}
                    >
                      {mode === 'input' ? 'Create' : 'Got it!'}
                    </Text>
                  )}
                </TouchableOpacity>

              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
