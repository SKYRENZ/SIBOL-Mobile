import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import tw from '../../utils/tailwind';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export interface FAQItem {
  question: string;
  answer: string;
}

interface FAQsProps {
  items: FAQItem[];
}

export default function FAQs({ items }: FAQsProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <View style={tw`w-full px-6`}>
      <Text style={tw`text-[20px] font-bold text-green-light mb-2 font-inter`}>
        Frequently Asked Questions:
      </Text>
      
      <View style={tw`gap-3`}>
        {items.map((item, index) => (
          <TouchableOpacity
            key={index}
            activeOpacity={0.7}
            onPress={() => toggleExpand(index)}
            style={tw`bg-white rounded-[5px] border border-green-light shadow-sm overflow-hidden`}
          >
            <View style={tw`flex-row items-center justify-between px-4 py-3 min-h-[39px]`}>
              <Text style={tw`flex-1 text-[11px] font-bold text-[#88AB8E] font-inter pr-2`}>
                {item.question}
              </Text>
              <ChevronRight 
                size={16} 
                color="#88AB8E" 
                style={{
                  transform: [{ rotate: expandedIndex === index ? '90deg' : '0deg' }],
                }}
              />
            </View>
            
            {expandedIndex === index && (
              <View style={tw`px-4 pb-3 pt-1 border-t border-green-light/30`}>
                <Text style={tw`text-[10px] text-[#6C8770] font-inter leading-4`}>
                  {item.answer}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
