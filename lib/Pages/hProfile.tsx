import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Animated,
  Easing,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import BottomNavbar from '../components/hBotNav';
import { User, Edit, Award, Gift } from 'lucide-react-native';

type TabType = 'leaderboard' | 'contributions' | 'rewards';

type HProfileRouteParams = {
  updatedData?: {
    username: string;
    address: string;
    areaCovered?: string;
    firstName?: string;
    lastName?: string;
    contact?: string;
    email?: string;
    barangay?: string;
  };
};

export default function HProfile() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<{ HProfile: HProfileRouteParams }, 'HProfile'>>();
  const [activeTab, setActiveTab] = useState<TabType>('leaderboard');
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(30))[0];

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
      })
    ]).start();
  }, []);
  const [userData, setUserData] = useState({
    username: 'User#39239',
    firstName: 'Juan',
    lastName: 'Dela Cruz',
    address: '1263 Petunia St. Area A, Camarin, Caloocan City',
    areaCovered: 'Camarin Area A',
    contact: '+63 912 345 6789',
    email: 'juan.delacruz@example.com',
    barangay: 'Barangay Camarin',
    totalContributions: 12,
    points: 112,
    contributions: [
      {
        id: '1',
        date: 'November 11, 2025',
        points: 30,
        totalContribution: 6,
        area: 'Waste Bin 12 - Petunia St.'
      }
    ],
    leaderboard: [
      { id: '1', name: 'Joemen Barrios', points: 120, rank: 1 },
      { id: '2', name: 'Laurenz Listangco', points: 100, rank: 2 },
      { id: '3', name: 'Karl Miranda', points: 95, rank: 3 },
    ]
  });
  const handleEdit = () => {
    navigation.navigate('HProfileEdit' as never, {
      initialData: {
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName,
        address: userData.address,
        areaCovered: userData.areaCovered,
        contact: userData.contact,
        email: userData.email,
        barangay: userData.barangay,
      },
    } as never);
  };

  useEffect(() => {
    const updated = route.params?.updatedData;
    if (updated) {
      setUserData(prev => ({
        ...prev,
        username: updated.username,
        address: updated.address,
        areaCovered: updated.areaCovered ?? prev.areaCovered,
        firstName: updated.firstName ?? prev.firstName,
        lastName: updated.lastName ?? prev.lastName,
        contact: updated.contact ?? prev.contact,
        email: updated.email ?? prev.email,
        barangay: updated.barangay ?? prev.barangay,
      }));
      navigation.setParams?.({ updatedData: undefined } as never);
    }
  }, [route.params?.updatedData, navigation]);

  const renderHeader = () => (
    <Animated.View 
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }
      ]}
    >
      <View style={styles.headerContent}>
        <Animated.View style={[
          styles.avatarContainer,
          {
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 3,
          }
        ]}>
          <User size={40} color="#2E523A" />
        </Animated.View>
        <View style={styles.userInfo}>
          <Text style={styles.username}>{userData.username}</Text>
          <View style={styles.addressContainer}>
            <View style={{ flex: 1 }}>
              <Text style={styles.address}>{userData.email}</Text>
              <Text style={[styles.address, { marginTop: 4 }]}>{userData.address}</Text>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleEdit}
              activeOpacity={0.8}
            >
              <Edit size={16} color="#2E523A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Animated.View>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'leaderboard':
        return (
          <Animated.View 
            style={[
              styles.tabContent,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.leaderboardContainer}>
              <Text style={styles.leaderboardTitle}>Leaderboard</Text>
              <Text style={styles.leaderboardSubtitle}>Top 3 Contributors This Month</Text>
              {userData.leaderboard.map((item) => (
                <View key={item.id} style={styles.leaderboardItem}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankText}>{item.rank}</Text>
                  </View>
                  <View style={styles.leaderboardInfo}>
                    <Text style={styles.leaderboardName}>{item.name}</Text>
                    <Text style={styles.leaderboardPoints}>{item.points} points</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        );
      case 'contributions':
        return (
          <Animated.View 
            style={[
              styles.tabContent,
              { opacity: fadeAnim }
            ]}
          >
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userData.points}</Text>
                <Text style={styles.statLabel}>Total Points</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{userData.totalContributions}</Text>
                <Text style={styles.statLabel}>Contributions</Text>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {userData.contributions.map((contribution) => (
              <View key={contribution.id} style={styles.contributionCard}>
                <Text style={styles.contributionDate}>{contribution.date}</Text>
                <View style={styles.contributionRow}>
                  <Text style={styles.contributionLabel}>Points Earned</Text>
                  <Text style={styles.contributionValue}>+{contribution.points} pts</Text>
                </View>
                <View style={styles.contributionRow}>
                  <Text style={styles.contributionLabel}>Total Contribution</Text>
                  <Text style={styles.contributionValue}>{contribution.totalContribution} kg</Text>
                </View>
                <View style={styles.contributionRow}>
                  <Text style={styles.contributionLabel}>Area</Text>
                  <Text style={styles.contributionValue}>{contribution.area}</Text>
                </View>
              </View>
            ))}
          </Animated.View>
        );
      case 'rewards':
        return (
          <Animated.View 
            style={[
              styles.rewardsContainer,
              { opacity: fadeAnim }
            ]}
          >
            <Text style={styles.sectionTitle}>Your Rewards</Text>
            <Text style={styles.noRewardsText}>
              No rewards yet. Keep contributing to earn rewards!
            </Text>
          </Animated.View>
        );
      default:
        return null;
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <SafeAreaView style={styles.container}>
          <ScrollView
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
                  marginTop: -12
                }
              ]}
            >
              <TouchableOpacity
                style={[styles.tab, activeTab === 'leaderboard' && styles.activeTab]}
                onPress={() => setActiveTab('leaderboard')}
                activeOpacity={0.7}
              >
                <Award
                  size={20}
                  color={activeTab === 'leaderboard' ? '#2E523A' : '#9E9E9E'}
                  fill={activeTab === 'leaderboard' ? '#2E523A' : 'none'}
                />
                <Text style={[styles.tabText, activeTab === 'leaderboard' && styles.activeTabText]}>
                  Leaderboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tab, activeTab === 'contributions' && styles.activeTab]}
                onPress={() => setActiveTab('contributions')}
                activeOpacity={0.7}
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
                style={[styles.tab, activeTab === 'rewards' && styles.activeTab]}
                onPress={() => setActiveTab('rewards')}
                activeOpacity={0.7}
              >
                <Gift
                  size={20}
                  color={activeTab === 'rewards' ? '#2E523A' : '#9E9E9E'}
                  fill={activeTab === 'rewards' ? '#2E523A' : 'none'}
                />
                <Text style={[styles.tabText, activeTab === 'rewards' && styles.activeTabText]}>
                  Rewards
                </Text>
              </TouchableOpacity>
            </Animated.View>

          {/* Content */}
          <View style={styles.content}>
            {renderTabContent()}
          </View>
          </ScrollView>

          {/* Bottom Navigation */}
          <View style={styles.bottomNav}>
            <BottomNavbar currentPage="Back" onRefresh={() => {}} />
          </View>
        </SafeAreaView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
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
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  address: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 15,
    fontFamily: 'Inter-Medium',
    marginRight: 10,
    flex: 1,
    lineHeight: 22,
    letterSpacing: 0.2,
  },
  editButton: {
    backgroundColor: '#FFFFFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
