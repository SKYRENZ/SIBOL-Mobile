import React from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import tw from 'twrnc';

interface TooltipProps {
  isFirstStep?: boolean;
  isLastStep?: boolean;
  currentStep: any;
  labels?: any;
  handleNext?: () => void;
  handlePrev?: () => void;
  handleStop?: () => void;
}

export default function CustomTooltip({
  isFirstStep = false,
  isLastStep = false,
  currentStep,
  labels,
  handleNext,
  handlePrev,
  handleStop,
}: TooltipProps) {
  if (!currentStep) return null;

  const onNext = handleNext ?? (() => {});
  const onPrev = handlePrev ?? (() => {});
  const onStop = handleStop ?? (() => {});

  return (
    <Modal
      transparent={true}
      visible={true}
      animationType="fade"
      onRequestClose={onStop}
    >
      {/* Dark overlay */}
      <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}>
        {/* Highlight ring */}
        <View style={tw`absolute w-20 h-20 bg-green-500 bg-opacity-20 rounded-full border-4 border-green-500`} />
        
        {/* Tooltip content */}
        <View style={tw`bg-white rounded-2xl p-5 m-4 shadow-2xl max-w-sm`}>
          {/* Header */}
          <View style={tw`flex-row items-center mb-3`}>
            <View style={tw`w-7 h-7 bg-green-100 rounded-full items-center justify-center mr-3`}>
              <Text style={tw`text-green-600 font-bold`}>✨</Text>
            </View>
            <Text style={tw`text-sm text-gray-600 font-medium`}>
              Step {currentStep?.order || 1} of {currentStep?.totalSteps || 6}
            </Text>
          </View>

          {/* Message */}
          <Text style={tw`text-base text-gray-800 mb-4 leading-6`}>
            {currentStep.text}
          </Text>

          {/* Buttons */}
          <View style={tw`flex-row justify-between`}>
            {!isFirstStep && (
              <TouchableOpacity
                style={tw`bg-gray-100 px-4 py-2 rounded-lg flex-row items-center`}
                onPress={onPrev}
              >
                <Text style={tw`text-sm text-gray-600 font-medium mr-1`}>←</Text>
                <Text style={tw`text-sm text-gray-600 font-medium`}>
                  {labels?.back ?? 'Previous'}
                </Text>
              </TouchableOpacity>
            )}

            <View style={tw`flex-row items-center`}>
              <TouchableOpacity
                style={tw`bg-gray-50 px-4 py-2 rounded-lg mr-2`}
                onPress={onStop}
              >
                <Text style={tw`text-sm text-gray-500 font-medium`}>
                  {labels?.skip ?? 'Skip'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={tw`bg-green-600 px-4 py-2 rounded-lg flex-row items-center shadow-lg`}
                onPress={isLastStep ? onStop : onNext}
              >
                <Text style={tw`text-sm text-white font-semibold mr-1`}>
                  {isLastStep ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
                </Text>
                {!isLastStep && <Text style={tw`text-sm text-white font-semibold`}>→</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
