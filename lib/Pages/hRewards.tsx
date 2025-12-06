import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Menu, MessageCircle, Bell, Home } from 'lucide-react-native';

type RootStackParamList = {
  HDashboard: undefined;
  // Add other screen names here as needed
};

type RewardsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'HDashboard'>;

export default function RewardsScreen() {
  const navigation = useNavigation<RewardsScreenNavigationProp>();
  
  // Sample rewards data
  const rewards = [
    { id: 1, name: 'Grocery Package', points: '200', image: 'https://via.placeholder.com/150/193827/ffffff?text=Grocery' },
    { id: 2, name: 'Rice (5kg)', points: '150', image: 'https://via.placeholder.com/150/193827/ffffff?text=Rice' },
    { id: 3, name: 'Canned Goods Pack', points: '100', image: 'https://via.placeholder.com/150/193827/ffffff?text=Canned' },
    { id: 4, name: 'Noodles Pack', points: '80', image: 'https://via.placeholder.com/150/193827/ffffff?text=Noodles' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft color="#193827" size={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rewards</Text>
          <View style={{ width: 24 }} />
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

        {/* Rewards Grid */}
        <View style={styles.rewardsGrid}>
          {rewards.map((reward) => (
            <View key={reward.id} style={styles.rewardCard}>
              <Image 
                source={{ uri: reward.image }} 
                style={styles.rewardImage} 
                resizeMode="cover"
              />
              <Text style={styles.rewardName}>{reward.name}</Text>
              <Text style={styles.rewardPoints}>{reward.points} Reward Points</Text>
              <TouchableOpacity style={styles.claimButton}>
                <Text style={styles.claimButtonText}>Claim</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('HDashboard')}>
          <Menu color="#E6F0E9" size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <MessageCircle color="#E6F0E9" size={24} />
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.navButton, styles.homeButton]}
          onPress={() => navigation.navigate('HDashboard')}
        >
          <Home color="#193827" size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <Bell color="#E6F0E9" size={24} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton} onPress={() => navigation.goBack()}>
          <ArrowLeft color="#E6F0E9" size={24} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const styles = StyleSheet.create({
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
  rewardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
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
  rewardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  rewardPoints: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  claimButton: {
    backgroundColor: '#193827',
    paddingVertical: 8,
    borderRadius: 20,
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