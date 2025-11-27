import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BottomNavbar from '../components/oBotNav';
import OWasteInput from '../components/oWasteInput';
import Tabs from '../components/commons/Tabs'; 

export default function oMap({ navigation }: any) {
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('Map'); 

  const handleTabChange = (value: string) => {
    setSelectedTab(value);
    if (value === 'Waste Input') {
      //waste input page
    } else if (value === 'Schedule') {
        //schedule page
    }
  };

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

      {/* Map content area */}
      <View style={styles.mapArea}>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowWasteModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      <View style={styles.bottomNavWrapper}>
        <BottomNavbar />
      </View>

      {/* Waste input modal */}
      <OWasteInput visible={showWasteModal} onClose={() => setShowWasteModal(false)} />
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
  bottomNavWrapper: {
  },
});
