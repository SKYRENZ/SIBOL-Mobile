import React, { useEffect, useMemo, useState } from 'react';
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
import { listWasteContainers, WasteContainer } from '../services/wasteContainerService';
import { fetchMyCollections } from '../services/wasteCollectionService';

export default function OSchedule({ navigation }: any) {
  const [selectedTab, setSelectedTab] = useState<string>('Schedule');
  const [containers, setContainers] = useState<WasteContainer[]>([]);
  const [collections, setCollections] = useState<any[]>([]);

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (value === 'Map') {
      navigation.navigate('OMap');
    } else if (value === 'Waste Input') {
      navigation.navigate('OWasteRecord');
    }
  };

  const today = new Date();
  const nextPickup = nextEveryTwoDays(today);
  const scheduleItems = useMemo(() => {
    if (!containers.length) return [] as Array<{ location: string; status: string; lastCollected: string }>;
    const lastCollectedByArea = new Map<number, string>();

    collections.forEach((row) => {
      const areaId = Number(row?.area_id ?? row?.Area_id);
      if (!Number.isFinite(areaId)) return;
      const label = formatCollectedDate(row?.collected_at ?? row?.date);
      if (!lastCollectedByArea.has(areaId) && label) {
        lastCollectedByArea.set(areaId, label);
      }
    });

    return containers.map((c) => {
      const areaId = Number(c?.raw?.area_id ?? c?.raw?.Area_id);
      const lastCollected = Number.isFinite(areaId)
        ? lastCollectedByArea.get(areaId) ?? 'No record'
        : 'No record';
      return {
        location: c.areaName || c.name,
        status: c.status ?? 'Unknown',
        lastCollected,
      };
    });
  }, [containers, collections]);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const [containerRows, collectionRows] = await Promise.all([
          listWasteContainers(),
          fetchMyCollections(200, 0),
        ]);
        if (!mounted) return;
        setContainers(containerRows || []);
        setCollections(collectionRows || []);
      } catch {
        if (!mounted) return;
        setContainers([]);
        setCollections([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

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
              Your next schedule is on {formatScheduleDate(nextPickup)}
            </Text>
          </View>

          <Calendar
            initialSelectedDate={nextPickup}
            initialCurrentDate={today}
          />

          <Text style={styles.scheduleLabel}>Schedule today:</Text>

          {scheduleItems.map((item, index) => (
            <View key={index} style={styles.scheduleCard}>
              <View style={styles.scheduleColorBar} />
              <MapPin size={12} color="#000" style={tw`ml-12`} />
              <View style={styles.scheduleInfo}>
                <Text style={styles.scheduleLocation}>{item.location}</Text>
                <Text style={styles.scheduleDate}>Status: {item.status}</Text>
                <Text style={styles.scheduleDate}>Last collected: {item.lastCollected}</Text>
              </View>
              <TouchableOpacity
                style={styles.viewMapButton}
                onPress={() => navigation.navigate('OMap')}
              >
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

function buildEveryTwoDaysSchedule(start: Date, count: number) {
  const items: { dateLabel: string }[] = [];
  const base = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(d.getDate() + i * 2);
    items.push({
      dateLabel: formatScheduleDate(d),
    });
  }
  return items;
}

function nextEveryTwoDays(from: Date): Date {
  const base = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  base.setDate(base.getDate() + 2);
  return base;
}

function formatScheduleDate(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = d.getDate();
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}

function formatCollectedDate(input: string | Date | undefined): string {
  if (!input) return '';
  if (typeof input === 'string' && input.includes(',')) return input;
  const d = new Date(input);
  if (!Number.isFinite(d.getTime())) return '';
  return formatScheduleDate(d);
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

  scheduleLocation: {
    flex: 1,
    fontSize: 13,
    color: '#2E523A',
    fontWeight: '700',
  },
  scheduleInfo: {
    flex: 1,
    marginLeft: 8,
  },
  scheduleDate: {
    fontSize: 11,
    color: '#6b7280',
    fontWeight: '600',
    marginTop: 2,
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
