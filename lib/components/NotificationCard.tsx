import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import tw from '../utils/tailwind';

export interface NotificationData {
  id: string;
  // extended types to support backend system notifications
  type: 'schedule' | 'reward_claimed' | 'reward_processing' | 'points' | 'reward_redeemed' | 'reward_success';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

interface NotificationCardProps {
  notification: NotificationData;
  onPress: () => void;
}

export default function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const getIcon = () => {
    switch (notification.type) {
      case 'reward_claimed':
      case 'reward_processing':
        return require('../../assets/reward.png');
      case 'schedule':
      default:
        return null;
    }
  };

  const icon = getIcon();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`bg-white border-b border-[#CAD3CA] px-4 py-4 flex-row items-start`}
      activeOpacity={0.7}
    >
      {/* Icon for reward notifications */}
      {icon && (
        <View style={tw`mr-3 mt-1`}>
          <Image
            source={icon}
            style={tw`w-8 h-8`}
            resizeMode="contain"
          />
        </View>
      )}
      
      {/* Content */}
      <View style={tw`flex-1 flex-row justify-between items-start`}>
        <View style={tw`flex-1 pr-4`}>
          <Text style={tw`text-[13px] font-semibold text-[#6C8770] mb-1`}>
            {notification.title}
          </Text>
          <Text style={tw`text-[10px] text-[#88AB8E] leading-4`}>
            {notification.message}
          </Text>
        </View>
        
        {/* Time */}
        <Text style={tw`text-[12px] text-[#6C8770] font-medium`}>
          {notification.time}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
