import React, { useRef, useState } from 'react';
import { View, TextInput } from 'react-native';
import tw from '../utils/tailwind';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export default function OTPInput({ 
  length = 6, 
  value, 
  onChange, 
  disabled = false,
  error = false 
}: OTPInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // Split value into array of digits (pad with empty strings if needed)
  const digits = value.split('').concat(Array(length).fill('')).slice(0, length);

  const handleChange = (text: string, index: number) => {
    // Only allow digits
    const digit = text.replace(/[^0-9]/g, '');
    
    if (digit.length === 0) {
      // Handle backspace/delete
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      
      // Move to previous input
      if (index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    } else {
      // Handle digit input
      const newDigits = [...digits];
      newDigits[index] = digit[digit.length - 1]; // Take last character if multiple
      onChange(newDigits.join(''));
      
      // Move to next input if not last
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    // Handle backspace when input is empty
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleFocus = (index: number) => {
    setFocusedIndex(index);
  };

  const handleBlur = () => {
    setFocusedIndex(null);
  };

  return (
    <View style={tw`flex-row justify-center gap-2`}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => {
            inputRefs.current[index] = ref;
          }}
          style={[
            tw`w-12 h-14 border rounded-md text-center text-xl font-semibold`,
            tw`${
              error 
                ? 'border-red-500 bg-red-50' 
                : focusedIndex === index
                ? 'border-primary bg-primary/5'
                : 'border-[#CBCAD7] bg-white'
            }`,
            { color: '#686677' },
          ]}
          value={digit}
          onChangeText={(text) => handleChange(text, index)}
          onKeyPress={(e) => handleKeyPress(e, index)}
          onFocus={() => handleFocus(index)}
          onBlur={handleBlur}
          keyboardType="number-pad"
          maxLength={1}
          editable={!disabled}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}