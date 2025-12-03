import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { Bell } from 'lucide-react-native';

export default function Notification() {
  return (
    <View pointerEvents="box-none" style={styles.container}>
      <TouchableOpacity
        accessibilityLabel="Notifications"
        style={styles.button}
        onPress={() => { /* navigation handler */ }}
      >
        <Bell color="#2E523A" size={20} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>3</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 63 : 41,
    right: 12,
    zIndex: 9999,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: '#e11d48',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
});
