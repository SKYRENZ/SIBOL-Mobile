import React from 'react';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
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
  Alert,
  Share,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Gift } from 'lucide-react-native';
import useRewards from '../hooks/useRewards';
import RedemptionModal from '../components/RedemptionModal';
import { getMyPoints } from '../services/profileService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

interface Reward {
  id: number;
  title: string;
  points: number;
  image?: string;
  description?: string;
  raw?: any;
}

export default function HRewards() {
  const navigation = useNavigation();
  const [availablePoints, setAvailablePoints] = React.useState(82);
  const [showClaimModal, setShowClaimModal] = React.useState(false);
  const [selectedReward, setSelectedReward] = React.useState<Reward | null>(null);
  const [claimCode, setClaimCode] = React.useState('');
  const [redeeming, setRedeeming] = React.useState(false);

  const { rewards, loading, error, refresh, redeem } = useRewards();

  // ✅ load points on mount
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        try {
          const pts = await getMyPoints();
          if (mounted) setAvailablePoints(Number(pts.points ?? 0));
        } catch (e) {
          console.error('[HRewards] getMyPoints', e);
        }
      })();
      return () => { mounted = false; };
    }, [])
  );

  const isRewardAvailable = (points: number) => availablePoints >= points;

  const handleClaimPress = async (reward: Reward) => {
    if (!isRewardAvailable(reward.points || 0)) {
      Alert.alert('Not Enough Points', `You need ${Math.max(0, (reward.points || 0) - availablePoints)} more points to claim this reward.`, [{ text: 'OK' }]);
      return;
    }

    try {
      setRedeeming(true);
      const res = await redeem(reward.id, 1);

      const code =
        (res && (res.data?.redemption_code ?? res.redemption_code ?? res.data?.redemption_code)) ||
        (res && (res.redemption_code ?? res.data?.redemption_code)) ||
        `SIBOL${Math.floor(10000 + Math.random() * 90000)}`;

      setSelectedReward(reward);
      setClaimCode(String(code));
      setShowClaimModal(true);

      // ✅ refresh points from backend after redeem
      try {
        const pts = await getMyPoints();
        setAvailablePoints(Number(pts.points ?? 0));
      } catch (e) {
        console.error('[HRewards] failed to refresh points after redeem', e);
      }

      await refresh();
    } catch (err: any) {
      console.error('Redeem failed', err);
      Alert.alert('Redeem failed', err?.message || 'Unable to redeem reward');
    } finally {
      setRedeeming(false);
    }
  };

  const closeModal = async () => {
    setShowClaimModal(false);
    setSelectedReward(null);
    setClaimCode('');

    // optional: refresh points when modal closes
    try {
      const pts = await getMyPoints();
      setAvailablePoints(Number(pts.points ?? 0));
    } catch {}
  };

  const handleDownload = async () => {
    try {
      const message = `SIBOL Reward\n\nReward: ${selectedReward?.title}\nCode: ${claimCode}\nPoints used: ${selectedReward?.points}\n\nShow this code to barangay staff to collect your reward.`;
      await Share.share({ message });
      setShowClaimModal(false);
    } catch (err) {
      console.error('Share error', err);
      Alert.alert('Download failed', 'Unable to download/share code.');
    }
  };

  const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#FFFFFF' },
    scrollView: { flex: 1 },
    scrollViewContent: { paddingBottom: 40 },
    container: { flex: 1, backgroundColor: '#FFFFFF' },
    header: { flexDirection: 'row', alignItems: 'center', padding: 20, paddingBottom: 0, backgroundColor: 'transparent', position: 'relative', zIndex: 10 },
    backButton: { padding: 4, marginRight: 12 },
    headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', color: '#111827', textAlign: 'center', marginRight: 40 },
    pointsContainer: { marginHorizontal: 20, marginTop: 16, marginBottom: 32, backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 5, borderWidth: 1, borderColor: '#E5E7EB' },
    pointsContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    pointsInfo: { flex: 1 },
    pointsLabel: { fontSize: 14, color: '#6B7280', fontWeight: '500', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
    pointsValue: { fontSize: 32, fontWeight: '700', color: '#2E523A', marginBottom: 4 },
    pointsText: { fontSize: 14, color: '#6B7280' },
    pointsIcon: { width: 60, height: 60, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginLeft: 16 },
    content: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 40, position: 'relative', zIndex: 5 },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 8 },
    sectionSubtitle: { fontSize: 14, color: '#6B7280', marginBottom: 24 },
    rewardsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingBottom: 24 },
    rewardCard: { width: CARD_WIDTH, backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', marginBottom: CARD_GAP, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5, borderWidth: 1, borderColor: '#E5E7EB', opacity: 1 },
    rewardCardUnavailable: { opacity: 0.6 },
    rewardImage: { width: '100%', height: CARD_WIDTH * 0.8, backgroundColor: '#F3F4F6' },
    rewardContent: { padding: 16, paddingTop: 12 },
    rewardTitle: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 6 },
    rewardPoints: { fontSize: 14, fontWeight: '700', color: '#2E523A', marginBottom: 16 },
    claimButton: { backgroundColor: '#2E523A', borderRadius: 8, paddingVertical: 8, alignItems: 'center' },
    claimButtonUnavailable: { backgroundColor: '#E5E7EB' },
    claimButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
    unavailableText: { fontSize: 11, color: '#EF4444', textAlign: 'center', marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'center', padding: 20 },
    modalContent: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', maxWidth: 320, alignSelf: 'center' },
    modalIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FEF3C7', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 20, fontWeight: '600', color: '#111827', marginBottom: 16, textAlign: 'center' },
    modalCode: { fontSize: 32, fontWeight: '700', color: '#2E523A', marginBottom: 8, letterSpacing: 2 },
    modalText: { fontSize: 16, color: '#4B5563', textAlign: 'center', marginBottom: 8, lineHeight: 24 },
    modalSubtext: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
    downloadButton: { backgroundColor: '#2E523A', borderRadius: 8, paddingVertical: 12, width: '100%', alignItems: 'center' },
    downloadButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  });

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#2E523A" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <Text style={{ color: 'red' }}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color="#2E523A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rewards</Text>
        </View>

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

        <View style={styles.content}>
          <Text style={styles.sectionTitle}>Claim your rewards</Text>
          <Text style={styles.sectionSubtitle}>Exchange your reward points for amazing items</Text>

          <View style={styles.rewardsGrid}>
            {rewards.map((reward) => {
              const isAvailable = isRewardAvailable(reward.points || 0);
              return (
                <View key={reward.id} style={[styles.rewardCard, !isAvailable && styles.rewardCardUnavailable]}>
                  <Image source={{ uri: reward.image || 'https://via.placeholder.com/300/2E523A/FFFFFF?text=No+Image' }} style={styles.rewardImage} resizeMode="cover" />
                  <View style={styles.rewardContent}>
                    <Text style={styles.rewardTitle} numberOfLines={1}>{reward.title}</Text>
                    <Text style={styles.rewardPoints}>{reward.points} Reward Points</Text>
                    <TouchableOpacity style={[styles.claimButton, !isAvailable && styles.claimButtonUnavailable]} onPress={() => handleClaimPress(reward as Reward)}>
                      <Text style={[styles.claimButtonText, !isAvailable && { color: '#6B7280' }]}>{isAvailable ? 'Claim Now' : 'Not Enough Points'}</Text>
                    </TouchableOpacity>
                    {!isAvailable && <Text style={styles.unavailableText}>Insufficient points</Text>}
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {(redeeming) && (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.25)' }}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      )}

      <RedemptionModal visible={showClaimModal} code={claimCode} pointsUsed={selectedReward?.points || 0} onClose={closeModal} />

      {/* download handled inside modal via parent handler -> using Share above */}
      {/* We keep modal's Download button behavior by intercepting onClose and share; RedemptionModal UI contains Download button - to wire it, we can handle share via the modal's OK button or integrate an explicit prop if you want deeper control. */}
    </SafeAreaView>
  );
}
