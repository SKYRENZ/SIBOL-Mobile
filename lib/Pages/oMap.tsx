import React, { useEffect, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavbar from '../components/oBotNav';
import OWasteInput from '../components/oWasteInput';
import Tabs from '../components/commons/Tabs';
import OMenu from '../components/oMenu';
import OWasteCollectionMap from '../components/OWasteCollectionMap';
import { listWasteContainers, WasteContainer } from '../services/wasteContainerService';

export default function oMap({ navigation }: any) {
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('Map');

  const [containers, setContainers] = useState<WasteContainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string>('');

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (value === 'Waste Input') {
      navigation.navigate('OWasteRecord');
    } else if (value === 'Schedule') {
      navigation.navigate('OSchedule');
    }
  };

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setErrorText('');
      try {
        const rows = await listWasteContainers();
        if (!mounted) return;
        setContainers(rows);
      } catch (e: any) {
        if (!mounted) return;
        setContainers([]);
        setErrorText(e?.message || 'Failed to load map data.');
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Map for Collecting</Text>

        <View style={styles.tabsWrap}>
          <Tabs
            tabs={['Waste Input', 'Map', 'Schedule']}
            activeTab={selectedTab}
            onTabChange={handleTabChange}
          />
        </View>
      </View>

      <View style={styles.mapArea}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#2E523A" />
          </View>
        ) : errorText ? (
          <View style={styles.center}>
            <Text style={styles.error}>{errorText}</Text>
          </View>
        ) : containers.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.empty}>No waste containers found.</Text>
          </View>
        ) : (
          <OWasteCollectionMap containers={containers} />
        )}
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowWasteModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.bottomNavWrapper}>
        <BottomNavbar onMenuPress={() => setMenuVisible(true)} />
      </View>

      <OWasteInput visible={showWasteModal} onClose={() => setShowWasteModal(false)} />

      <OMenu
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onNavigate={() => setMenuVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
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
  mapArea: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 0,
    paddingBottom: 0,
    width: '100%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  error: {
    color: '#B00020',
    textAlign: 'center',
    fontWeight: '600',
  },
  empty: {
    color: '#2E523A',
    textAlign: 'center',
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 140,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2f6b3f',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  bottomNavWrapper: {},
});
