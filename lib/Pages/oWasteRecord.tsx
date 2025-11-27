import React, { useState } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Filter } from 'lucide-react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import Tabs from '../components/commons/Tabs';
import ListCard from '../components/commons/ListCard';
import OMenu from '../components/oMenu';
import SearchBox from '../components/commons/Search';

export default function OWasteRecord({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<string>('Waste Input');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (value === 'Map') {
      navigation.navigate('OMap');
    } else if (value === 'Schedule') {
    }
  };

  const recentRecords = [
    {
      date: 'Saturday, September 6, 2025',
      area: 'Petunia St.',
      weight: '35 kg',
    },
    {
      date: 'Saturday, September 6, 2025',
      area: 'Petunia St.',
      weight: '35 kg',
    },
    {
      date: 'Saturday, September 6, 2025',
      area: 'Petunia St.',
      weight: '35 kg',
    },
  ];

  const lastWeekRecords = [
    {
      date: 'Saturday, September 6, 2025',
      area: 'Petunia St.',
      weight: '35 kg',
    },
  ];

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <Text style={styles.title}>Waste Input Record</Text>

          <View style={styles.tabsWrap}>
            <Tabs
              tabs={['Waste Input', 'Map', 'Schedule']}
              activeTab={selectedTab}
              onTabChange={handleTabChange}
            />
          </View>
        </View>

        <View style={styles.contentWrap}>
          <View style={tw`mb-4`}>

            <View style={styles.searchWrap}>
              <SearchBox value={searchQuery} onChangeText={setSearchQuery} />
            </View>

            <View style={tw`flex-row justify-between items-center mb-4 mt-4`}>
              <Text style={tw`text-text-gray text-xl font-bold`}>Recent</Text>

              <TouchableOpacity style={styles.filterBtn}>
                <Filter size={14} color="#fff" />
                <Text style={tw`text-white text-[15px] font-semibold ml-2`}>Filter</Text>
              </TouchableOpacity>
            </View>

            {recentRecords.map((record, index) => (
              <ListCard
                key={`recent-${index}`}
                date={record.date}
                area={record.area}
                weight={record.weight}
              />
            ))}

            <Text style={tw`text-text-gray text-xl font-bold mb-4 mt-4`}>
              Last week
            </Text>

            {lastWeekRecords.map((record, index) => (
              <ListCard
                key={`lastweek-${index}`}
                date={record.date}
                area={record.area}
                weight={record.weight}
              />
            ))}

            <View style={tw`h-24`} />
          </View>
        </View>

      </ScrollView>

      <BottomNavbar 
        onMenuPress={() => setMenuVisible(true)}
      />

      <OMenu 
        visible={menuVisible} 
        onClose={() => setMenuVisible(false)} 
        onNavigate={() => setMenuVisible(false)} 
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
    width: '78%',
    alignSelf: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },

  searchWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 6,
  },

  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#88AB8E',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#88AB8E',
  },
});
