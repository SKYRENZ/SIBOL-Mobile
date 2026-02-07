import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Image,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view'; // ✅ add
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import BottomNavbar from '../components/hBotNav';
import { Edit, Award } from 'lucide-react-native';
import { getMyProfile, getMyPoints, updateMyProfile } from '../services/profileService';
import { HProfileEditForm, type HProfileEditData } from '../components/hProfile/hProfileEdit';
import HProfileContributions from '../components/hProfile/hProfileContributions';

type TabType = 'contributions' | 'profile';

type HProfileRouteParams = {
  updatedData?: {
    username: string;
    firstName?: string;
    lastName?: string;
    contact?: string;
    email?: string;
    barangay?: string;
  };
};

type UserDataState = {
  username: string;
  firstName?: string;
  lastName?: string;
  address: string;
  contact?: string;
  email?: string;
  barangay?: string;
  totalContributions: number;
  points: number;

  contributions: Array<{
    id: string;
    date: string;
    points: number;
    totalContribution: number;
    area: string;
  }>;
};

const MOCK_CONTRIBUTIONS: UserDataState['contributions'] = [
  {
    id: '1',
    date: 'November 11, 2025',
    points: 30,
    totalContribution: 6,
    area: 'Waste Bin 12 - Petunia St.',
  },
];

export default function HProfile() {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<{ HProfile: HProfileRouteParams }, 'HProfile'>>();

  const [activeTab, setActiveTab] = useState<TabType>('contributions');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Profile tab save state
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<string | null>(null);

  const [userData, setUserData] = useState<UserDataState>({
    username: '—',
    firstName: undefined,
    lastName: undefined,
    address: '—',
    contact: undefined,
    email: '—',
    barangay: undefined,
    totalContributions: 0,
    points: 0,
    contributions: MOCK_CONTRIBUTIONS,
  });

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const loadFromBackend = useCallback(async () => {
    try {
      setLoadError(null);

      const [profile, points] = await Promise.all([getMyProfile(), getMyPoints()]);

      setUserData((prev) => ({
        ...prev,
        username: profile.username || prev.username,
        firstName: profile.firstName ?? prev.firstName,
        lastName: profile.lastName ?? prev.lastName,
        contact: profile.contact ?? prev.contact,
        email: profile.email || prev.email,
        address: profile.fullAddress || profile.areaName || prev.address,
        barangay: profile.barangayName ?? prev.barangay,
        points: Number(points.points ?? 0),
        totalContributions: Number(points.totalContributions ?? 0),
      }));
    } catch (e: any) {
      setLoadError(e?.message ?? 'Failed to load profile');
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      (async () => {
        setLoading(true);
        try {
          await loadFromBackend();
        } finally {
          if (mounted) setLoading(false);
        }
      })();

      return () => {
        mounted = false;
      };
    }, [loadFromBackend])
  );

  // keep compatibility if some code still navigates back with updatedData
  useEffect(() => {
    const updated = route.params?.updatedData;
    if (updated) {
      setUserData((prev) => ({
        ...prev,
        username: updated.username ?? prev.username,
        firstName: updated.firstName ?? prev.firstName,
        lastName: updated.lastName ?? prev.lastName,
        contact: updated.contact ?? prev.contact,
        email: updated.email ?? prev.email,
        barangay: updated.barangay ?? prev.barangay,
      }));
      navigation.setParams?.({ updatedData: undefined } as never);
    }
  }, [route.params?.updatedData, navigation]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadFromBackend();
    } finally {
      setRefreshing(false);
    }
  };

  const handleSaveProfile = async (data: HProfileEditData) => {
    setProfileSaveError(null);
    setProfileSaveSuccess(null);
    setSavingProfile(true);

    try {
      // Backend supports: username/firstName/lastName/contact/email/password/area
      // It does NOT support barangay updates (keep barangay UI local-only for now)
      await updateMyProfile({
        username: data.username,
        firstName: data.firstName,
        lastName: data.lastName,
        contact: data.contact,
        email: data.email,
      });

      setProfileSaveSuccess('Profile updated successfully.');
      // Refresh to ensure we show server truth + updated Profile_last_updated restriction timing
      await loadFromBackend();
    } catch (e: any) {
      // apiClient attaches status/payload for axios responses
      if (e?.status === 429) {
        const retryAt = e?.payload?.retryAt;
        setProfileSaveError(
          retryAt
            ? `You can update your profile again after: ${new Date(retryAt).toLocaleString()}`
            : (e?.message ?? 'You can’t update your profile yet.')
        );
      } else {
        setProfileSaveError(e?.message ?? 'Failed to update profile');
      }
    } finally {
      setSavingProfile(false);
    }
  };

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.headerContent}>
        <View style={styles.profileImageWrapper}>
          <View style={styles.profileImageBox}>
            <Image
              source={require('../../assets/profile.png')}
              style={styles.profileImage}
              resizeMode="cover"
            />
          </View>
        </View>

        <View style={styles.userInfo}>
          <Text style={styles.username}>{userData.username}</Text>
        </View>
      </View>

      {loadError ? (
        <View style={{ marginTop: 10 }}>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12 }}>{loadError}</Text>
        </View>
      ) : null}
    </Animated.View>
  );

  const renderTabContent = () => {
    if (loading) {
      return (
        <View style={{ padding: 18, alignItems: 'center' }}>
          <ActivityIndicator />
          <Text style={{ marginTop: 10, color: '#6C8770' }}>Loading profile…</Text>
        </View>
      );
    }

    if (activeTab === 'profile') {
      return (
        <View style={{ paddingHorizontal: 16, paddingTop: 8 }}>
          <HProfileEditForm
            initialData={{
              username: userData.username,
              firstName: userData.firstName ?? '',
              lastName: userData.lastName ?? '',
              contact: userData.contact ?? '',
              email: userData.email ?? '',
              barangay: userData.barangay ?? '',
            }}
            loading={savingProfile}
            error={profileSaveError}
            success={profileSaveSuccess}
            onSave={handleSaveProfile}
            onEditingChange={setProfileEditing} // ✅ add
          />
        </View>
      );
    }

    // ✅ Contributions tab extracted to component
    return (
      <HProfileContributions
        fadeAnim={fadeAnim}
        points={userData.points}
        totalContributions={userData.totalContributions}
        currentUsername={userData.username}
      />
    );
  };

  const [profileEditing, setProfileEditing] = useState(false); // ✅ add

  return (
    <SafeAreaView style={styles.container}>
      {/* ✅ Keyboard behavior like SignIn: affect scroll/content only, NOT bottom nav */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <KeyboardAwareScrollView
          enableOnAndroid
          extraScrollHeight={Platform.OS === 'ios' ? 20 : 120}
          keyboardOpeningTime={0}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {renderHeader()}

          {/* Tabs */}
          <Animated.View
            style={[
              styles.tabsContainer,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
                marginTop: -12,
              },
            ]}
            pointerEvents={profileEditing ? 'none' : 'auto'} // ✅ disable tab touches entirely
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === 'contributions' && styles.activeTab]}
              onPress={() => setActiveTab('contributions')}
              activeOpacity={0.7}
              disabled={profileEditing} // ✅ add
            >
              <Award
                size={20}
                color={activeTab === 'contributions' ? '#2E523A' : '#9E9E9E'}
                fill={activeTab === 'contributions' ? '#2E523A' : 'none'}
              />
              <Text style={[styles.tabText, activeTab === 'contributions' && styles.activeTabText]}>
                Contributions
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'profile' && styles.activeTab]}
              onPress={() => setActiveTab('profile')}
              activeOpacity={0.7}
              disabled={profileEditing} // ✅ add
            >
              <Edit size={20} color={activeTab === 'profile' ? '#2E523A' : '#9E9E9E'} />
              <Text style={[styles.tabText, activeTab === 'profile' && styles.activeTabText]}>
                Profile
              </Text>
            </TouchableOpacity>
          </Animated.View>

          {/* Content */}
          <View style={styles.content}>{renderTabContent()}</View>
        </KeyboardAwareScrollView>
      </KeyboardAvoidingView>

      {/* ✅ Bottom nav stays fixed, but disabled during edit */}
      <View
        style={styles.bottomNav}
        pointerEvents={profileEditing ? 'none' : 'auto'} // ✅ disables clicks
      >
        <BottomNavbar currentPage="Back" onRefresh={handleRefresh} />
        {refreshing ? (
          <View style={{ position: 'absolute', right: 12, bottom: 72 }}>
            <ActivityIndicator />
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAF8',
  },
  tabContent: {
    flex: 1,
    padding: 16,
  },
  header: {
    backgroundColor: '#2E523A',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageWrapper: {
    marginRight: 18,
  },
  profileImageBox: {
    width: 118,
    height: 107,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    marginHorizontal: 16,
    marginTop: -12,
    borderRadius: 12,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: 'transparent',
  },
  activeTab: {
    backgroundColor: 'rgba(46, 82, 58, 0.1)',
    borderRadius: 8,
  },
  tabText: {
    marginLeft: 6,
    color: '#6C8770',
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    letterSpacing: 0.2,
  },
  activeTabText: {
    color: '#2E523A',
    fontFamily: 'Inter-SemiBold',
  },
  content: {
    flex: 1,
    padding: 16,
    paddingTop: 8,
    marginBottom: 80, // Add margin to account for bottom navigation
  },
  leaderboardContainer: {
    marginTop: 10,
  },
  contributionsContainer: {
    flex: 1,
  },
  leaderboardTitle: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: '#2E523A',
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  leaderboardSubtitle: {
    color: '#6C8770',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 16,
    opacity: 0.9,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F7F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rankText: {
    color: '#2E523A',
    fontFamily: 'Inter-Bold',
    fontSize: 16,
  },
  leaderboardInfo: {
    flex: 1,
  },
  leaderboardName: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
    color: '#2E523A',
    letterSpacing: 0.2,
  },
  leaderboardPoints: {
    color: '#6C8770',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    opacity: 0.9,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flex: 0.48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderTopWidth: 3,
    borderTopColor: '#2E523A',
  },
  statValue: {
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    color: '#2E523A',
    marginBottom: 5,
  },
  statLabel: {
    color: '#6C8770',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter-Bold',
    color: '#2E523A',
  },
  contributionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    borderLeftWidth: 4,
    borderLeftColor: '#2E523A',
  },
  contributionDate: {
    color: '#6C8770',
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    marginBottom: 10,
  },
  contributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  contributionValue: {
    fontFamily: 'Inter-SemiBold',
    color: '#2E523A',
  },
  rewardsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  noRewardsText: {
    color: '#6C8770',
    fontFamily: 'Inter-Regular',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 24,
    fontSize: 15,
    maxWidth: '80%',
    alignSelf: 'center',
  },
  contributionLabel: {
    color: '#6C8770',
    fontSize: 14,
    fontFamily: 'Inter-Regular',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
});
