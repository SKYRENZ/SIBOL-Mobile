import React from 'react';
import { 
  View, 
  Image, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  Modal, 
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Gift } from 'lucide-react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface Reward {
  id: number;
  title: string;
  points: number;
  image: string;
  description?: string;
}

const rewardsData: Reward[] = [
  {
    id: 1,
    title: 'Grocery Package',
    points: 200,
    image: 'https://via.placeholder.com/300/2E523A/FFFFFF?text=Grocery',
    description: 'Get your grocery package'
  },
  {
    id: 2,
    title: 'Rice (5kg)',
    points: 150,
    image: 'https://via.placeholder.com/300/2E523A/FFFFFF?text=Rice',
    description: 'Premium quality rice'
  },
  {
    id: 3,
    title: 'Cooking Oil (1L)',
    points: 100,
    image: 'https://via.placeholder.com/300/2E523A/FFFFFF?text=Oil',
    description: 'Pure vegetable cooking oil'
  },
  {
    id: 4,
    title: 'Sugar (1kg)',
    points: 80,
    image: 'https://via.placeholder.com/300/2E523A/FFFFFF?text=Sugar',
    description: 'Premium white sugar'
  }
];

export default function HRewards() {
  const navigation = useNavigation();
  const [availablePoints, setAvailablePoints] = React.useState(82);
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [selectedReward, setSelectedReward] = React.useState<Reward | null>(null);
  const [claimCode, setClaimCode] = React.useState('');

  const isRewardAvailable = (points: number) => availablePoints >= points;
  
  const handleClaimPress = (reward: Reward) => {
    if (!isRewardAvailable(reward.points)) {
      // Show alert for insufficient points
      Alert.alert(
        'Not Enough Points',
        `You need ${reward.points - availablePoints} more points to claim this reward.`,
        [{ text: 'OK' }]
      );
      return;
    }
    
    setSelectedReward(reward);
    setClaimCode(`SIBOL${Math.floor(1000 + Math.random() * 9000)}`);
    setShowClaimModal(true);
  };
  
  const closeModal = () => {
    if (selectedReward) {
      setAvailablePoints(prev => prev - selectedReward.points);
    }
    setShowClaimModal(false);
  };

  const styles = StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    scrollView: {
      flex: 1,
    },
    scrollViewContent: {
      paddingBottom: 40, // Extra padding at the bottom
    },
    container: {
      flex: 1,
      backgroundColor: '#FFFFFF',
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 20,
      paddingBottom: 0,
      backgroundColor: 'transparent',
      position: 'relative',
      zIndex: 10,
    },
    backButton: {
      padding: 4,
      marginRight: 12,
    },
    headerTitle: {
      flex: 1,
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      textAlign: 'center',
      marginRight: 40, // Balance the back button space
    },
    pointsContainer: {
      marginHorizontal: 20,
      marginTop: 16,
      marginBottom: 32, // Increased space below points container
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24, // Increased padding
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 }, // Increased shadow offset
      shadowOpacity: 0.15, // 15% opacity
      shadowRadius: 12, // Increased blur radius
      elevation: 5, // Increased elevation for Android
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    pointsContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    pointsInfo: {
      flex: 1,
    },
    pointsLabel: {
      fontSize: 14,
      color: '#6B7280',
      fontWeight: '500',
      marginBottom: 4,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    pointsValue: {
      fontSize: 32,
      fontWeight: '700',
      color: '#2E523A',
      marginBottom: 4,
    },
    pointsText: {
      fontSize: 14,
      color: '#6B7280',
    },
    pointsIcon: {
      width: 60,
      height: 60,
      borderRadius: 12,
      backgroundColor: '#F3F4F6',
      justifyContent: 'center',
      alignItems: 'center',
      marginLeft: 16,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 24,
      paddingBottom: 40, // Extra padding at the bottom
      position: 'relative',
      zIndex: 5,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 8,
    },
    sectionSubtitle: {
      fontSize: 14,
      color: '#6B7280',
      marginBottom: 24,
    },
    rewardsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      paddingBottom: 24, // Extra padding below the grid
    },
    rewardCard: {
      width: CARD_WIDTH,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      overflow: 'hidden',
      marginBottom: CARD_GAP,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15, // 15% opacity
      shadowRadius: 8, // Increased blur radius
      elevation: 5, // Increased elevation for Android
      borderWidth: 1,
      borderColor: '#E5E7EB',
      opacity: 1,
    },
    rewardCardUnavailable: {
      opacity: 0.6,
    },
    rewardImage: {
      width: '100%',
      height: CARD_WIDTH * 0.8,
      backgroundColor: '#F3F4F6',
    },
    rewardContent: {
      padding: 16,
      paddingTop: 12,
    },
    rewardTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 6,
    },
    rewardPoints: {
      fontSize: 14,
      fontWeight: '700',
      color: '#2E523A',
      marginBottom: 16,
    },
    claimButton: {
      backgroundColor: '#2E523A',
      borderRadius: 8,
      paddingVertical: 8,
      alignItems: 'center',
    },
    claimButtonUnavailable: {
      backgroundColor: '#E5E7EB',
    },
    claimButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    unavailableText: {
      fontSize: 11,
      color: '#EF4444',
      textAlign: 'center',
      marginTop: 4,
    },
    // Modal styles
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      padding: 20,
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      width: '100%',
      maxWidth: 320,
      alignSelf: 'center',
    },
    modalIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FEF3C7',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#111827',
      marginBottom: 16,
      textAlign: 'center',
    },
    modalCode: {
      fontSize: 32,
      fontWeight: '700',
      color: '#2E523A',
      marginBottom: 8,
      letterSpacing: 2,
    },
    modalText: {
      fontSize: 16,
      color: '#4B5563',
      textAlign: 'center',
      marginBottom: 8,
      lineHeight: 24,
    },
    modalSubtext: {
      fontSize: 14,
      color: '#6B7280',
      textAlign: 'center',
      marginBottom: 24,
    },
    downloadButton: {
      backgroundColor: '#2E523A',
      borderRadius: 8,
      paddingVertical: 12,
      width: '100%',
      alignItems: 'center',
    },
    downloadButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
  });

  const handleClaim = (reward: Reward) => {
    if (!isRewardAvailable(reward.points)) return;
    
    setSelectedReward(reward);
    // Generate a random claim code (in a real app, this would come from your backend)
    const code = 'SIBOL' + Math.floor(10000 + Math.random() * 90000);
    setClaimCode(code);
    setShowClaimModal(true);
    
    // Deduct points (in a real app, this would be handled by your backend)
    if (reward.points) {
      setAvailablePoints(prev => Math.max(0, prev - (reward.points || 0)));
    }
  };

  const handleDownload = () => {
    // Implement download functionality
    setShowClaimModal(false);
  };

  const [isLoading, setIsLoading] = React.useState(false);

  if (isLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E523A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
          >
            <ArrowLeft size={24} color="#2E523A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rewards</Text>
        </View>

        {/* Points Display */}
        <View style={styles.pointsContainer}>
          <View style={styles.pointsContent}>
            <View style={styles.pointsInfo}>
              <Text style={styles.pointsLabel}>Your Points</Text>
              <Text style={styles.pointsValue}>{availablePoints}</Text>
              <Text style={styles.pointsText}>Available to redeem</Text>
            </View>
            <View style={styles.pointsIcon}>
              <Gift size={32} color="#2E523A" />
            </View>
          </View>
        </View>

        {/* Rewards Grid */}
        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Claim your rewards</Text>
          <Text style={styles.sectionSubtitle}>
            Exchange your reward points for amazing items
          </Text>
          
          <View style={styles.rewardsGrid}>
            {rewardsData.map((reward) => {
              const isAvailable = isRewardAvailable(reward.points);
              return (
                <View 
                  key={reward.id} 
                  style={[
                    styles.rewardCard,
                    !isAvailable && styles.rewardCardUnavailable
                  ]}
                >
                  <Image
                    source={{ uri: reward.image }}
                    style={styles.rewardImage}
                    resizeMode="cover"
                  />
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardTitle} numberOfLines={1}>
                      {reward.title}
                    </Text>
                    <Text style={styles.rewardPoints}>
                      {reward.points} Reward Points
                    </Text>
                    <TouchableOpacity 
                      style={[
                        styles.claimButton,
                        !isAvailable && styles.claimButtonUnavailable
                      ]}
                      onPress={() => handleClaimPress(reward)}
                    >
                      <Text style={[
                        styles.claimButtonText,
                        !isAvailable && { color: '#6B7280' }
                      ]}>
                        {isAvailable ? 'Claim Now' : 'Not Enough Points'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Claim Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showClaimModal}
        onRequestClose={closeModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={closeModal}
        >
          <TouchableOpacity 
            activeOpacity={1}
            style={styles.modalContent}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalIcon}>
              <Gift size={40} color="#D97706" />
            </View>
            <Text style={styles.modalTitle}>Congratulations!</Text>
            <Text style={styles.modalCode}>{claimCode}</Text>
            <Text style={styles.modalText}>
              This code is for one time only and not sharable
            </Text>
            <Text style={styles.modalSubtext}>
              Thank you for your waste contribution!
            </Text>
            <TouchableOpacity 
              style={styles.downloadButton}
              onPress={closeModal}
            >
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}
