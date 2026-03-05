import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import tw from '../utils/tailwind';
import { Gift, Mail, Medal } from 'lucide-react-native';

export interface NotificationData {
  id: string;
  type: 'schedule' | 'reward_claimed' | 'reward_processing' | 'leaderboard' | 'points';
  title: string;
  message: string;
  time: string;
  isRead: boolean;
  // optional raw timestamp passed from service
  timestampISO?: string;
}

interface NotificationCardProps {
  notification: NotificationData;
  onPress: () => void;
}

export default function NotificationCard({ notification, onPress }: NotificationCardProps) {
  const getIcon = () => {
    // try to detect more specific reward/leaderboard events from title/message
    const text = `${notification.title ?? ''} ${notification.message ?? ''}`.toUpperCase();

    // Gift for claimed / unclaimed
    if (text.includes('REWARD_CLAIMED') || text.includes('REWARD_UNCLAIMED')) {
      return <Gift color="#6C8770" size={20} />;
    }

    // Mail for restocked / updated / eligible notifications
    if (text.includes('REWARD_RESTOCKED') || text.includes('REWARD_UPDATED') || text.includes('REWARD_ELIGIBLE')) {
      return <Mail color="#6C8770" size={20} />;
    }

    // Medal for leaderboard events
    if (notification.type === 'leaderboard' || text.includes('LEADERBOARD')) {
      return <Medal color="#6C8770" size={20} />;
    }

    // fallback: gift for reward_claimed, mail for reward_processing, simple dot otherwise
    if (notification.type === 'reward_claimed') return <Gift color="#6C8770" size={20} />;
    if (notification.type === 'reward_processing') return <Mail color="#6C8770" size={20} />;

    return null;
  };

  const icon = getIcon();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={tw`bg-white border-b border-[#CAD3CA] px-4 py-4 flex-row items-start`}
      activeOpacity={0.7}
    >
      {icon && (
        <View style={tw`mr-3 mt-1 w-8 h-8 items-center justify-center`}>
          {icon}
        </View>
      )}
      
      <View style={tw`flex-1 flex-row justify-between items-start`}>
        <View style={tw`flex-1 pr-4`}>
          <Text style={tw`text-[13px] font-semibold text-[#6C8770] mb-1`}>
            {notification.title}
          </Text>
          <Text style={tw`text-[10px] text-[#88AB8E] leading-4`}>
            {notification.message}
          </Text>
        </View>
        
        <Text style={tw`text-[12px] text-[#6C8770] font-medium`}>
          {notification.time}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
