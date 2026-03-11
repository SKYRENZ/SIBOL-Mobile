import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { TourGuideZone } from 'rn-tourguide';
import tw from '../utils/tailwind';

interface HistoryCardProps {
  title: string;
  date: string;
  type: 'QR_SCAN' | 'REWARD_CLAIM';
  pointsDelta: number;
  kgDelta?: number;
  code?: string | null;
  status?: string | null; // NEW
  onViewCode?: (code: string) => void;
  isFirstCard?: boolean;
}

export default function HistoryCard({
  title,
  date,
  type,
  pointsDelta,
  kgDelta = 0,
  code = null,
  status = null,
  onViewCode,
  isFirstCard = false,
}: HistoryCardProps) {
  const isEarned = pointsDelta >= 0;

  const renderViewButton = () => {
    const button = (
      <TouchableOpacity
        onPress={() => onViewCode?.(code!)}
        style={styles.codeBtn}
        activeOpacity={0.8}
      >
        <Text style={styles.codeBtnText}>View</Text>
      </TouchableOpacity>
    );

    if (isFirstCard && code) {
      return (
        <TourGuideZone
          zone={23}
          text="Tap 'View' to see the code you used to claim your reward."
          shape="rectangle"
          borderRadius={8}
        >
          {button}
        </TourGuideZone>
      );
    }

    return button;
  };
  const isClaimed = String(status ?? '').toLowerCase() === 'claimed';

  return (
    <View style={tw`bg-white rounded-xl p-4 mb-2 mx-4 border border-gray-200 border-l-4 border-l-[#2E523A] shadow-md`}>
      <View style={tw`flex-row justify-between items-center`}>
        <Text style={tw`text-sm font-semibold text-[#6B7280]`}>{type === 'REWARD_CLAIM' ? 'Reward Claim' : title}</Text>
        {type === 'REWARD_CLAIM' && (
          <View style={tw`${isClaimed ? 'bg-[#D1FAE5]' : 'bg-[#F3F4F6]'} px-2 py-1 rounded-full`}>
            <Text style={tw`text-[#064E3B] font-medium text-xs`}>{isClaimed ? 'Claimed' : 'Unclaimed'}</Text>
          </View>
        )}
      </View>

      <Text style={tw`text-sm text-[#9CA3AF] mb-6`}>{date}</Text>

      <View style={tw`flex-row justify-between mb-3 items-center`}>
        <Text style={tw`text-sm text-[#6B7280] font-medium`}>{isEarned ? 'Points Earned' : 'Points Deducted'}</Text>
        <Text style={tw`${isEarned ? 'text-[#2E523A]' : 'text-[#B91C1C]'} text-sm font-semibold max-w-[60%] text-right`}>
          {isEarned ? `+${pointsDelta}` : `${pointsDelta}`} pts
        </Text>
      </View>

      {type === 'QR_SCAN' ? (
        <View style={tw`flex-row justify-between mb-3 items-center`}>
          <Text style={tw`text-sm text-[#6B7280] font-medium`}>Contribution Added</Text>
          <Text style={tw`text-sm font-semibold text-[#111827] max-w-[60%] text-right`}>{kgDelta} kg</Text>
        </View>
      ) : null}

      {type === 'REWARD_CLAIM' ? (
        <View style={tw`flex-row justify-between mb-3 items-center`}>
          <Text style={tw`text-sm text-[#6B7280] font-medium`}>Item Obtained</Text>
          <Text style={tw`text-sm font-semibold text-[#111827] max-w-[60%] text-right`} numberOfLines={1}>
            {title}
          </Text>
        </View>
      ) : null}

      {type === 'REWARD_CLAIM' && code ? (
        <View style={tw`flex-row justify-between items-center`}>
          <Text style={tw`text-sm text-[#6B7280] font-medium`}>Code</Text>
          <TouchableOpacity
            onPress={() => onViewCode?.(code)}
            style={tw`px-3 py-2 bg-[#2E523A] rounded-md`}
            activeOpacity={0.8}
          >
            <Text style={tw`text-white text-xs font-semibold px-6`}>View</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}
