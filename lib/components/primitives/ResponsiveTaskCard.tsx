import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import tw from '../../utils/tailwind';

export interface TaskCardProps {
  title: string;
  description: string;
  dueDate: string;
  onViewPress?: () => void;
}

export default function ResponsiveTaskCard({
  title,
  description,
  dueDate,
  onViewPress,
}: TaskCardProps) {
  const viewDisabled = !onViewPress;

  const Row = ({ label, value }: { label: string; value: string }) => (
    <View style={tw`flex-row items-start mt-1`}>
      <Text style={tw`text-gray-600 text-xs font-semibold w-20`}>{label}:</Text>
      <Text style={tw`text-[#2E523A] text-xs flex-1`} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );

  return (
    <View style={tw`bg-white rounded-xl p-4 mr-4 w-72`}>
      <Row label="Title" value={title} />
      <Row label="Description" value={description} />

      <View style={tw`flex-row items-start mt-1`}>
        <Text style={tw`text-gray-600 text-xs font-semibold w-20`}>Due Date:</Text>
        <Text style={tw`text-gray-600 text-xs flex-1`} numberOfLines={1}>
          {dueDate}
        </Text>
      </View>

      {/* ✅ Stretch button full width and center text */}
      <View style={tw`mt-3`}>
        <TouchableOpacity
          onPress={onViewPress}
          disabled={viewDisabled}
          activeOpacity={0.85}
          style={[
            tw`w-full py-2 rounded-md items-center justify-center`,
            viewDisabled ? tw`bg-gray-300` : tw`bg-[#2f6b3f]`,
          ]}
        >
          <Text
            style={viewDisabled ? tw`text-gray-600 text-xs font-semibold` : tw`text-white text-xs font-semibold`}
          >
            View Details
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
