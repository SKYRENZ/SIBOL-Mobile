import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  StyleSheet,
  Image,
} from 'react-native';
import { MapPin } from 'lucide-react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import Tabs from '../components/commons/Tabs';
import Calendar from '../components/commons/Calendar';

export default function OSchedule({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<string>('Schedule');

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (value === 'Map') {
      navigation.navigate('OMap');
    } else if (value === 'Waste Input') {
      navigation.navigate('OWasteRecord');
    }
  };

  const scheduleItems = [
    { location: 'Petunia St.' },
    { location: 'Petunia St.' },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Schedule</Text>

          <View style={styles.tabsWrap}>
            <Tabs
              tabs={['Waste Input', 'Map', 'Schedule']}
              activeTab={selectedTab}
              onTabChange={handleTabChange}
            />
          </View>
        </View>

        <View style={styles.contentWrap}>
          <View style={styles.alertBanner}>
            <View style={styles.warningIcon}>
              <Image 
                source={require('../../assets/exclamation.png')} 
                style={styles.exclamationImage} 
                resizeMode="contain"
              />
            </View>
            <Text style={styles.alertText}>
              Your next schedule is on Tuesday, October 17
            </Text>
          </View>

          <Calendar />

          <Text style={styles.scheduleLabel}>Schedule today:</Text>

          {scheduleItems.map((item, index) => (
            <View key={index} style={styles.scheduleCard}>
              <View style={styles.scheduleColorBar} />
              <View style={styles.scheduleCheckbox} />
              <MapPin size={12} color="#000" style={tw`ml-3`} />
              <Text style={styles.scheduleLocation}>{item.location}</Text>
              <TouchableOpacity style={styles.viewMapButton}>
                <Text style={styles.viewMapText}>View map</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={tw`h-24`} />
        </View>
      </ScrollView>

      <BottomNavbar 
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 44,
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  title: {
    textAlign: 'center',
    fontSize: 16,
    color: '#2b6b2b',
    fontWeight: '600',
    marginBottom: 18,
  },
  tabsWrap: {
    width: '86%',
    alignSelf: 'center',
    marginBottom: 14,
  },
  contentWrap: {
    width: '84%',
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  alertBanner: {
    backgroundColor: 'rgba(175, 200, 173, 0.61)',
    borderRadius: 15,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    zIndex: 0, 
    elevation: 1,   
  },
  warningIcon: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exclamationImage: {
    width: 32,
    height: 32,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#2E523A',
    fontWeight: '700',
  },

  scheduleLabel: {
    fontSize: 14,
    color: '#2E523A',
    fontWeight: '700',
    marginBottom: 12,
  },
  scheduleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#CAD3CA',
    paddingVertical: 14,
    paddingRight: 16,
    marginBottom: 12,
    position: 'relative',
  },
  scheduleColorBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 36,
    backgroundColor: '#AFC8AD',
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
  },
  scheduleCheckbox: {
    width: 14,
    height: 13,
    borderWidth: 1,
    borderColor: '#fff',
    backgroundColor: '#AFC8AD',
    marginLeft: 11,
    marginRight: 8,
  },
  scheduleLocation: {
    flex: 1,
    fontSize: 13,
    color: '#2E523A',
    fontWeight: '700',
    marginLeft: 8,
  },
  viewMapButton: {
    backgroundColor: '#2E523A',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  viewMapText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
});
