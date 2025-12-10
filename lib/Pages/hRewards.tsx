import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  ScrollView, 
  SafeAreaView, 
  StyleSheet, 
  Dimensions, 
  FlatList,
  TextInput,
  ImageSourcePropType
} from 'react-native';
import { ArrowLeft, Menu, MessageCircle, Bell, Home, Gift, Search } from 'lucide-react-native';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import tw from '../utils/tailwind';
import HMenu from '../components/hMenu';

import { RootStackParamList } from '../types/navigation';

type RewardItem = {
  id: string;
  title: string;
  points: number;
  image: ImageSourcePropType;
  description: string;
};

const RewardsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeTab, setActiveTab] = useState('All');
  const [menuVisible, setMenuVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };

  const rewards: RewardItem[] = [
    {
      id: '1',
      title: 'Grocery Package',
      points: 200,
      image: require('../../assets/rewards/grocery.png'),
      description: 'Essential grocery items for your household'
    },
    {
      id: '2',
      title: 'Rice (5kg)',
      points: 150,
      image: require('../../assets/rewards/rice.png'),
      description: 'Premium quality rice'
    },
    {
      id: '3',
      title: 'Canned Goods',
      points: 100,
      image: require('../../assets/rewards/canned.png'),
      description: 'Assorted canned goods'
    },
    {
      id: '4',
      title: 'Noodles Pack',
      points: 80,
      image: require('../../assets/rewards/noodles.png'),
      description: 'Variety pack of instant noodles'
    },
  ];

  const filteredRewards = rewards.filter(reward => 
    reward.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    reward.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderRewardItem = ({ item }: { item: RewardItem }) => (
    <View style={styles.rewardCard}>
      <Image 
        source={item.image} 
        style={styles.rewardImage} 
        resizeMode="cover"
        defaultSource={require('../../assets/placeholder.png')} // Add a placeholder image
      />
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardTitle}>{item.title}</Text>
        <Text style={styles.rewardPoints}>{item.points} points</Text>
        <Text style={styles.rewardDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <TouchableOpacity 
          style={styles.claimButton}
          onPress={() => console.log('Claim', item.id)}
        >
          <Text style={styles.claimButtonText}>Claim</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleNavigate = (route: keyof RootStackParamList) => {
    navigation.navigate(route);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={toggleMenu} 
            style={styles.backButton}
            accessibilityLabel="Open menu"
          >
            <Menu size={24} color="#193827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rewards</Text>
          <TouchableOpacity 
            style={styles.chatButton}
            onPress={() => handleNavigate('HDashboard')}
            accessibilityLabel="Go to chat"
          >
            <MessageCircle size={24} color="#193827" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content */}
      <ScrollView style={styles.content}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Claim your rewards</Text>
          <Text style={styles.sectionSubtitle}>
            Thank you for your contributions! All rewards must be claimed at your barangay hall.
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Search size={20} color="#6B7280" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search rewards..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9CA3AF"
          />
        </View>

        {/* Rewards Grid */}
        <FlatList
          data={filteredRewards}
          renderItem={renderRewardItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.rewardsGrid}
          scrollEnabled={false}
          contentContainerStyle={styles.rewardsList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No rewards found</Text>
            </View>
          }
        />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={toggleMenu}>
          <Menu size={24} color="#E6F0E9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <MessageCircle size={24} color="#E6F0E9" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.homeButton}
          onPress={() => handleNavigate('HDashboard')}
        >
          <Home size={24} color="#193827" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Bell size={24} color="#E6F0E9" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#E6F0E9" />
        </TouchableOpacity>
      </View>

      {/* Side Menu */}
      <HMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={(route) => {
          handleNavigate(route);
        }}
      />
    </SafeAreaView>
  );
};

export default RewardsScreen;

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#A6BCAF',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  backButton: {
    padding: 8,
  },
  chatButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#193827',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#193827',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 24,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: '#111827',
  },
  rewardsList: {
    paddingBottom: 24,
  },
  rewardsGrid: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  rewardCard: {
    width: (width - 48) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rewardImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    marginBottom: 12,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#193827',
    marginBottom: 4,
  },
  rewardPoints: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 8,
  },
  rewardDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 12,
    lineHeight: 16,
  },
  claimButton: {
    backgroundColor: '#193827',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  claimButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#193827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  navButton: {
    padding: 8,
  },
  homeButton: {
    backgroundColor: '#A6BCAF',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -25,
    borderWidth: 4,
    borderColor: '#193827',
  },
});