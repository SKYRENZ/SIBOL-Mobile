import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from '../../utils/tailwind';

interface TaskCardProps {
  title: string;
  description: string;
  dueDate: string;
  onView?: () => void; // ✅ add
}

export default function ResponsiveTaskCard({ title, description, dueDate, onView }: TaskCardProps) {
  return (
    <View style={tw`bg-white rounded-xl p-4 mr-3 w-[260px]`}>
      <View style={tw`flex-row items-center`}>
        <View style={tw`flex-1`}>
          <Text style={tw`text-[#2E523A] font-bold text-sm`} numberOfLines={1}>
            {title}
          </Text>
          <Text style={tw`text-gray-600 text-xs mt-1`} numberOfLines={2}>
            {description}
          </Text>
          <Text style={tw`text-gray-500 text-[11px] mt-2`}>
            {dueDate}
          </Text>
        </View>
      </View>
      <View style={tw`mt-3 flex-row justify-end`}>
        <TouchableOpacity
          onPress={onView}
          disabled={!onView}
          style={tw`bg-primary px-3 py-1.5 rounded-md ${onView ? '' : 'opacity-50'}`}
        >
          <Text style={tw`text-white text-[11px] font-bold`}>View</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
