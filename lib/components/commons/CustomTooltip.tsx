import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
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
  ...rest
}: TooltipProps) {
  if (!currentStep) return null;

  // Provide default no-op functions if handlers are not passed
  const onNext = handleNext ?? (() => {});
  const onPrev = handlePrev ?? (() => {});
  const onStop = handleStop ?? (() => {});

  return (
    <View style={tw`bg-white px-4 py-1 rounded-xl max-w-[240px] shadow-lg`}>
      <Text style={tw`text-sm text-gray-800`}>
        {currentStep.text}
      </Text>

        <View style={tw`flex-row justify-between mt-3`}>
          {!isFirstStep && (
            <TouchableOpacity onPress={onPrev}>
              <Text style={tw`text-xs text-gray-500`}>{labels?.back ?? 'Previous'}</Text>
            </TouchableOpacity>
          )}

        <View style={tw`flex-row ml-auto`}>
          <TouchableOpacity onPress={onStop}>
            <Text style={tw`text-xs text-gray-400 mr-4`}>
              {labels?.skip ?? 'Skip'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={isLastStep ? onStop : onNext}
          >
            <Text style={tw`text-xs text-green-700 font-semibold`}>
              {isLastStep ? (labels?.finish ?? 'Finish') : (labels?.next ?? 'Next')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}