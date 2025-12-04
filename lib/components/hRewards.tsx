import React from 'react';
import { View, Image, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useResponsiveStyle, useResponsiveSpacing, useResponsiveFontSize } from '../utils/responsiveStyles';

interface Reward {
  id: number;
  title: string;
  description?: string;  // ✅ Make optional to match MobileReward type
  points?: number;
  image?: any;
  raw?: any;
}

interface HRewardsProps {
  rewards: Reward[];
  loading?: boolean;
  onRedeem?: (id: number, qty: number) => void | Promise<void>;
}

export default function HRewards({ rewards, loading, onRedeem }: HRewardsProps) {
  const [redeeming, setRedeeming] = React.useState<number | null>(null);

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
    pointsText: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('sm'),
      fontWeight: 'bold',
      color: '#2E523A',
      marginBottom: isSm ? 8 : 10,
    },
    claimButton: {
      backgroundColor: '#2E523A',
      borderRadius: 20,
      paddingVertical: isSm ? 6 : 8,
      paddingHorizontal: isSm ? 16 : 20,
      alignItems: 'center',
      width: '70%',
      minHeight: 32,
      justifyContent: 'center',
    },
    claimButtonDisabled: {
      backgroundColor: '#9CA3AF',
    },
    claimButtonText: {
      fontSize: isSm ? useResponsiveFontSize('xs') : useResponsiveFontSize('xs'),
      fontWeight: 'semibold',
      color: 'white',
    },
  }));

  const handleClaim = async (reward: Reward) => {
    if (!onRedeem || redeeming) return;
    
    console.log('[HRewards] Claim button pressed', reward.id);  // ✅ Debug log
    
    setRedeeming(reward.id);
    try {
      await onRedeem(reward.id, 1);
    } catch (err) {
      console.error('[HRewards] redeem failed', err);
    } finally {
      setRedeeming(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.rewardsContainer, { paddingVertical: 40 }]}>
        <ActivityIndicator size="large" color="#2E523A" />
      </View>
    );
  }

  if (!rewards || rewards.length === 0) {
    return (
      <View style={[styles.rewardsContainer, { paddingVertical: 40 }]}>
        <Text style={{ color: '#6B7280', fontSize: 14 }}>No rewards available</Text>
      </View>
    );
  }

  return (
    <View style={styles.rewardsContainer}>
      {rewards.map((reward) => (
        <View key={reward.id} style={styles.rewardCard}>
          <View style={styles.rewardImageContainer}>
            {reward.image ? (
              <Image
                source={reward.image}
                style={styles.rewardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.rewardImage, { backgroundColor: 'rgba(217,217,217,0.5)', justifyContent: 'center', alignItems: 'center' }]}>
                <Text style={{ color: '#9CA3AF', fontSize: 12 }}>No Image</Text>
              </View>
            )}
          </View>
          <View style={styles.rewardInfo}>
            <Text style={styles.rewardTitle}>{reward.title}</Text>
            <View style={styles.divider} />
            {reward.points !== undefined && (
              <Text style={styles.pointsText}>{reward.points} pts</Text>
            )}
            <Text style={styles.rewardDescription}>{reward.description || 'No description'}</Text>
            
            <TouchableOpacity 
              style={[
                styles.claimButton,
                (redeeming === reward.id || !onRedeem) && styles.claimButtonDisabled
              ]}
              onPress={() => handleClaim(reward)}
              disabled={redeeming === reward.id || !onRedeem}
            >
              {redeeming === reward.id ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.claimButtonText}>Claim</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}
