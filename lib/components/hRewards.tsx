import React from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { useResponsiveStyle, useResponsiveSpacing, useResponsiveFontSize } from '../utils/responsiveStyles';

interface Reward {
  id: number;
  title: string;
  description: string;
  image: any;
}

interface HRewardsProps {
  rewards: Reward[];
}

export default function HRewards({ rewards }: HRewardsProps) {
  const styles = useResponsiveStyle(({ isSm, isMd, isLg }) => ({
    rewardsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      gap: useResponsiveSpacing('md'),
      alignSelf: 'center',
      width: '100%',
      paddingHorizontal: isSm ? useResponsiveSpacing('sm') : useResponsiveSpacing('md'),
    },
    rewardCard: {
      width: isSm ? 160 : isMd ? 180 : 220,
      backgroundColor: 'white',
      borderRadius: 15,
      overflow: 'visible',
      padding: isSm ? 12 : 14,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2,
      alignItems: 'center',
    },
    rewardImageContainer: {
      width: '100%',
      height: isSm ? 110 : 140,
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: isSm ? 10 : 12,
    },
    rewardImage: {
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(217,217,217,0.3)',
    },
    rewardInfo: {
      width: '100%',
      alignItems: 'center',
    },
    rewardTitle: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('sm'),
      fontWeight: '600',
      color: '#2E523A',
      marginBottom: isSm ? 8 : 10,
      textAlign: 'center',
    },
    divider: {
      width: '70%',
      height: 1,
      backgroundColor: 'rgba(175,200,173,0.5)',
      marginBottom: isSm ? 8 : 10,
    },
    rewardDescription: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('xs'),
      color: '#6C8770',
      marginBottom: isSm ? 10 : 12,
      textAlign: 'center',
    },
    claimButton: {
      backgroundColor: '#2E523A',
      borderRadius: 20,
      paddingVertical: isSm ? 6 : 8,
      paddingHorizontal: isSm ? 16 : 20,
      alignItems: 'center',
      width: '70%',
    },
    claimButtonText: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('xs'),
      fontWeight: 'semibold',
      color: 'white',
    },
  }));

  return (
    <View style={styles.rewardsContainer}>
      {rewards.map((reward) => (
        <View key={reward.id} style={styles.rewardCard}>
          <View style={styles.rewardImageContainer}>
            <Image
              source={reward.image}
              style={styles.rewardImage}
              resizeMode="cover"
            />
          </View>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardTitle}>{reward.title}</Text>
            <View style={styles.divider} />
            <Text style={styles.rewardDescription}>{reward.description}</Text>
            <TouchableOpacity style={styles.claimButton}>
              <Text style={styles.claimButtonText}>Claim</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
