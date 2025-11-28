import React, { useState, useEffect } from 'react';
import { 
  SafeAreaView, 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Filter } from 'lucide-react-native';
import tw from '../utils/tailwind';
import BottomNavbar from '../components/oBotNav';
import Tabs from '../components/commons/Tabs';
import ListCard from '../components/commons/ListCard';
import OMenu from '../components/oMenu';
import SearchBox from '../components/commons/Search';

import { fetchMyCollections, listAreas, NormalizedArea } from '../services/wasteCollectionService';

export default function OWasteRecord({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<string>('Waste Input');
  const [searchQuery, setSearchQuery] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);

  const [records, setRecords] = useState<any[]>([]);
  const [areas, setAreas] = useState<NormalizedArea[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (value === 'Map') {
      navigation.navigate('OMap');
    } else if (value === 'Schedule') {
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [aList, myRows] = await Promise.all([listAreas(), fetchMyCollections(200, 0)]);
      setAreas(aList || []);
      const mapped = (myRows || []).map((r: any) => {
        const areaLabel = (() => {
          const match = aList?.find((x: NormalizedArea) => Number(x.id) === Number(r.area_id));
          return match ? match.label : (r.area_name ?? r.AreaName ?? `Area ${r.area_id}`);
        })();

        const dateText = r.date ? `${r.date}${r.time ? ' • ' + r.time : ''}` : (r.collected_at ? new Date(r.collected_at).toLocaleString() : '');
        const weightText = typeof r.weight !== 'undefined' ? `${r.weight} kg` : (r.weight_kg ? `${r.weight_kg} kg` : '');

        return {
          id: r.collection_id ?? r.id,
          date: dateText,
          area: areaLabel,
          weight: weightText,
          raw: r
        };
      });

      setRecords(mapped);
    } catch (err) {
      console.error('Failed to load waste records', err);
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
  };

  return (
    <SafeAreaView style={tw`flex-1 bg-white`}>
      <ScrollView style={tw`flex-1`} showsVerticalScrollIndicator={false} refreshControl={undefined}>
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

              <TouchableOpacity style={styles.filterBtn} onPress={handleRefresh}>
                <Filter size={14} color="#fff" />
                <Text style={tw`text-white text-[15px] font-semibold ml-2`}>Refresh</Text>
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={tw`items-center py-8`}>
                <ActivityIndicator size="large" color="#2E523A" />
              </View>
            ) : records.length === 0 ? (
              <View style={tw`items-center py-8`}>
                <Text style={tw`text-text-gray`}>No records found.</Text>
              </View>
            ) : (
              records
                .filter(r => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return r.area.toLowerCase().includes(q) || r.date.toLowerCase().includes(q) || r.weight.toLowerCase().includes(q);
                })
                .map((record) => (
                  <ListCard
                    key={String(record.id)}
                    date={record.date}
                    area={record.area}
                    weight={record.weight}
                  />
                ))
            )}

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
