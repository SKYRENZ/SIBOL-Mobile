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

/* =========================
   BACKEND API CALL
   ========================= */
export async function analyzeWaterAPI(foodWasteKg: number) {
  const response = await fetch(
    'http://localhost:5000/api/ai/analyze-water',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        food_waste_kg: foodWasteKg,
      }),
    }
  );

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

      setRecommendedWater(result.recommendedWater);
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
                    ? 'Lili will suggest the most optimal amount of water for proper digestion.'
                    : explanation}
                </Text>

                {/* Label */}
                <Text style={tw`text-[#2E523A] text-[14px] font-semibold mb-2`}>
                  {mode === 'input' ? 'Weight Total' : 'Recommended Water'}
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
