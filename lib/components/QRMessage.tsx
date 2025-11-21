import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image } from 'react-native';
import tw from '../utils/tailwind';
import { CheckCircle, XCircle } from 'lucide-react-native';

interface QRMessageProps {
  visible: boolean;
  type: 'success' | 'error';
  points?: number;
  total?: number;
  message?: string;
  onClose: () => void;
}

export default function QRMessage({ visible, type, points, total, message, onClose }: QRMessageProps) {
  const isSuccess = type === 'success';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center px-6`}>
        <View style={tw`bg-white rounded-3xl p-8 w-full max-w-sm items-center shadow-lg`}>
          {/* Icon */}
          <View style={[
            tw`w-20 h-20 rounded-full items-center justify-center mb-6`,
            isSuccess ? tw`bg-green-100` : tw`bg-red-100`
          ]}>
            {isSuccess ? (
              <CheckCircle size={48} color="#22c55e" />
            ) : (
              <XCircle size={48} color="#ef4444" />
            )}
          </View>

          {/* Title */}
          <Text style={[
            tw`text-2xl font-bold mb-2`,
            isSuccess ? tw`text-green-600` : tw`text-red-600`
          ]}>
            {isSuccess ? 'Success!' : 'Error'}
          </Text>

          {/* Content */}
          {isSuccess ? (
            <>
              <Text style={tw`text-6xl font-bold text-[#2E523A] mb-2`}>
                +{points?.toFixed(2) || '0.00'}
              </Text>
              <Text style={tw`text-lg text-gray-600 mb-4`}>
                points awarded
              </Text>
              <View style={tw`bg-gray-100 rounded-xl px-6 py-3 mb-6`}>
                <Text style={tw`text-sm text-gray-500`}>Total Points</Text>
                <Text style={tw`text-2xl font-bold text-[#2E523A]`}>
                  {total?.toFixed(2) || '0.00'}
                </Text>
              </View>
            </>
          ) : (
            <Text style={tw`text-base text-gray-600 text-center mb-6 px-4`}>
              {message || 'An error occurred'}
            </Text>
          )}

          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={[
              tw`w-full py-4 rounded-xl`,
              isSuccess ? tw`bg-[#2E523A]` : tw`bg-red-500`
            ]}
          >
            <Text style={tw`text-white text-center font-semibold text-lg`}>
              {isSuccess ? 'Continue' : 'Try Again'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}