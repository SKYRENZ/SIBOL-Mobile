import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import * as Location from 'expo-location';
import { MapPin } from 'lucide-react-native';
import BottomNavbar from '../components/oBotNav';
import OWasteInput from '../components/oWasteInput';
import Tabs from '../components/commons/Tabs';
import OWasteCollectionMap from '../components/OWasteCollectionMap';
import { listWasteContainers, WasteContainer } from '../services/wasteContainerService';
import { listSchedules, Schedule } from '../services/scheduleService';

type LatLng = { latitude: number; longitude: number };

export default function oMap({ navigation }: any) {
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<string>('Map');

  const [containers, setContainers] = useState<WasteContainer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string>('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean>(false);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);

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

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const rows = await listSchedules();
        if (!mounted) return;
        setSchedules(rows);
      } catch {
        if (!mounted) return;
        setSchedules([]);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    let locationSubscription: any = null;

    (async () => {
      if (Platform.OS === 'web') {
        if (!navigator?.geolocation) {
          setLocationGranted(false);
          Alert.alert('Location Unavailable', 'Browser location is not supported.');
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!mounted) return;
            const { latitude, longitude, accuracy } = pos.coords;
            setLocationGranted(true);
            setUserLocation({ latitude, longitude });
            setUserAccuracy(typeof accuracy === 'number' ? accuracy : null);
          },
          () => {
            if (!mounted) return;
            setLocationGranted(false);
            Alert.alert('Location Permission', 'Allow location access to show your position.');
          },
          { enableHighAccuracy: true }
        );

        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!mounted) return;
            const { latitude, longitude, accuracy } = pos.coords;
            setUserLocation({ latitude, longitude });
            setUserAccuracy(typeof accuracy === 'number' ? accuracy : null);
          },
          () => {
            if (!mounted) return;
            setLocationGranted(false);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        return () => {
          mounted = false;
          if (watchId !== null && navigator?.geolocation?.clearWatch) {
            navigator.geolocation.clearWatch(watchId);
          }
        };
      }

      // Mobile: prefer Expo Location API (works in Expo builds). Fallback to react-native-permissions.
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const granted = status === 'granted';
        if (!mounted) return;
        setLocationGranted(granted);
        if (!granted) {
          Alert.alert(
            'Location Permission',
            'Location permission is needed to show your distance from the nearest container.'
          );
          return;
        }

        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
        if (!mounted) return;
        setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setUserAccuracy(typeof pos.coords.accuracy === 'number' ? pos.coords.accuracy : null);

        locationSubscription = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.Highest, timeInterval: 5000, distanceInterval: 1 },
          (p: Location.LocationObject) => {
            if (!mounted) return;
            setUserLocation({ latitude: p.coords.latitude, longitude: p.coords.longitude });
            setUserAccuracy(typeof p.coords.accuracy === 'number' ? p.coords.accuracy : null);
          }
        );
      } catch (err) {
        // Fallback: use react-native-permissions request if expo-location isn't available or fails
        try {
          const permission =
            Platform.OS === 'android'
              ? PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION
              : PERMISSIONS.IOS.LOCATION_WHEN_IN_USE;
          const result = await request(permission);
          if (!mounted) return;
          const granted = result === RESULTS.GRANTED;
          setLocationGranted(granted);
          if (!granted) {
            Alert.alert(
              'Location Permission',
              'Location permission is needed to show your distance from the nearest container.'
            );
          }
        } catch {
          // ignore
        }
      }
    })();

    return () => {
      mounted = false;
      try { locationSubscription?.remove?.(); } catch {}
    };
  }, []);

  const nearestContainer = useMemo(() => {
    if (!containers.length) return null;
    if (!userLocation) return containers[0];

    let best = containers[0];
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const c of containers) {
      const d = distanceKm(userLocation, { latitude: c.latitude, longitude: c.longitude });
      if (d < bestDistance) {
        bestDistance = d;
        best = c;
      }
    }

    return best;
  }, [containers, userLocation]);

  const nearestDistanceKm = useMemo(() => {
    if (!nearestContainer || !userLocation) return null;
    return distanceKm(userLocation, {
      latitude: nearestContainer.latitude,
      longitude: nearestContainer.longitude,
    });
  }, [nearestContainer, userLocation]);

  const nextPickupLabel = useMemo(() => {
    if (!nearestContainer) return 'No schedule';
    return findNextPickupLabel(nearestContainer, schedules);
  }, [nearestContainer, schedules]);

  const statusText = nearestContainer?.status ?? 'Unknown';
  const statusColor =
    statusText.toLowerCase().includes('available')
      ? '#10B981'
      : statusText.toLowerCase().includes('full')
      ? '#F59E0B'
      : '#6B7280';

  const accuracyLabel = userAccuracy !== null ? Math.round(userAccuracy) : null;
  const accuracyLow = userAccuracy !== null && userAccuracy > 200;

  const handleRecenter = () => {
    if (!userLocation) {
      Alert.alert('Location', 'Waiting for your location. Try again in a moment.');
      return;
    }
    setRecenterKey((v) => v + 1);
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

        {accuracyLabel !== null && (
          <View style={styles.accuracyPill}>
            <Text style={[styles.accuracyText, accuracyLow && styles.accuracyLow]}>
              {accuracyLow ? `Accuracy low (~${accuracyLabel} m)` : `Accuracy ~${accuracyLabel} m`}
            </Text>
          </View>
        )}
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
          <>
            <OWasteCollectionMap
              containers={containers}
              showsUserLocation={locationGranted}
              onUserLocationChange={(coords) => {
                setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
                if (typeof coords.accuracy === 'number') {
                  setUserAccuracy(coords.accuracy);
                }
              }}
              userLocation={userLocation}
              recenterKey={recenterKey}
            />

            <TouchableOpacity style={styles.recenterBtn} onPress={handleRecenter} activeOpacity={0.85}>
              <MapPin size={16} color="#2E523A" style={{ marginRight: 6 }} />
              <Text style={styles.recenterText}>Recenter</Text>
            </TouchableOpacity>

            {nearestContainer && (
              <View style={styles.nearestCard}>
                <View style={styles.nearestHeader}>
                  <View style={styles.nearestIconWrap}>
                    <Image source={require('../../assets/waste-truck.png')} style={styles.nearestIcon} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.nearestSub}>Nearest waste container is in</Text>
                    <Text style={styles.nearestTitle}>
                      {nearestContainer.areaName || nearestContainer.name}
                    </Text>
                  </View>
                </View>

                <View style={styles.nearestRow}>
                  <View style={styles.nearestCol}>
                    <Text style={styles.nearestLabel}>Distance</Text>
                    <Text style={styles.nearestValue}>
                      {nearestDistanceKm === null ? '—' : `${nearestDistanceKm.toFixed(1)} km away`}
                    </Text>
                  </View>
                  <View style={styles.nearestCol}>
                    <Text style={styles.nearestLabel}>Status</Text>
                    <Text style={[styles.nearestValueBold, { color: statusColor }]}>{statusText}</Text>
                  </View>
                  <View style={styles.nearestCol}>
                    <Text style={styles.nearestLabel}>Next Pickup</Text>
                    <Text style={styles.nearestValue}>{nextPickupLabel}</Text>
                  </View>
                </View>
              </View>
            )}
          </>
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
        <BottomNavbar />
      </View>

      <OWasteInput visible={showWasteModal} onClose={() => setShowWasteModal(false)} />
    </SafeAreaView>
  );
}

function distanceKm(a: LatLng, b: LatLng) {
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

function toRad(v: number) {
  return (v * Math.PI) / 180;
}

function findNextPickupLabel(container: WasteContainer, schedules: Schedule[]) {
  if (!schedules?.length) return 'No schedule';

  const areaKey = (container.areaName ?? '').toLowerCase();
  const addressKey = (container.fullAddress ?? '').toLowerCase();

  const matches = schedules.filter((s) => {
    const areas = normalizeAreaValues(s.Area);
    return (
      areas.some((a) => a.includes(areaKey) || areaKey.includes(a)) ||
      (addressKey && areas.some((a) => a.includes(addressKey)))
    );
  });

  const now = new Date();
  const upcoming = matches
    .map((s) => parseScheduleDate(s.Date_of_collection))
    .filter((d): d is Date => !!d && d.getTime() >= now.getTime())
    .sort((a, b) => a.getTime() - b.getTime());

  if (!upcoming.length) return 'No schedule';

  return formatScheduleDate(upcoming[0]);
}

function normalizeAreaValues(area: Schedule['Area']): string[] {
  if (Array.isArray(area)) return area.map((a) => String(a).toLowerCase());
  if (area === null || area === undefined) return [];
  return [String(area).toLowerCase()];
}

function parseScheduleDate(value?: string) {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatScheduleDate(d: Date) {
  const now = new Date();
  const isSameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  const hasTime = d.getHours() !== 0 || d.getMinutes() !== 0;
  const timePart = hasTime
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : '';

  if (isSameDay) return timePart ? `Today, ${timePart}` : 'Today';
  if (isTomorrow) return timePart ? `Tomorrow, ${timePart}` : 'Tomorrow';

  const datePart = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  return timePart ? `${datePart}, ${timePart}` : datePart;
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
    marginBottom: 8,
  },
  accuracyPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginTop: 8,
  },
  accuracyText: {
    fontSize: 11,
    color: '#4B5563',
  },
  accuracyLow: {
    color: '#D97706',
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
  recenterBtn: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: '#fff',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  recenterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2E523A',
  },
  nearestCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 32,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    padding: 12,
  },
  nearestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  nearestIconWrap: {
    backgroundColor: '#DBEAFE',
    padding: 8,
    borderRadius: 10,
    marginRight: 12,
  },
  nearestIcon: { width: 24, height: 24 },
  nearestSub: { fontSize: 11, color: '#6B7280' },
  nearestTitle: { fontSize: 14, fontWeight: '700', color: '#2E523A' },
  nearestRow: { flexDirection: 'row', justifyContent: 'space-between' },
  nearestCol: { alignItems: 'center', flex: 1 },
  nearestLabel: { fontSize: 11, color: '#6B7280' },
  nearestValue: { fontSize: 12, fontWeight: '600' },
  nearestValueBold: { fontSize: 12, fontWeight: '700' },
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
