import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import * as Location from 'expo-location';
import tw from '../utils/tailwind';
import { MapPin, Menu, MessageCircle, Home, Bell, ArrowLeft } from 'lucide-react-native';
import HWasteCollectionMap from '../components/HWasteCollectionMap';
import { listWasteContainers, WasteContainer } from '../services/wasteContainerService';
import { listSchedules, Schedule } from '../services/scheduleService';
import BottomNavbar from '../components/hBotNav';

type RootStackParamList = {
  HDashboard: undefined;
  HMap: undefined;
  ChatSupport: undefined;
  // Add other screen params as needed
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

type LatLng = { latitude: number; longitude: number };

const HMap = () => {
  const navigation = useNavigation<NavigationProp>();

  const [containers, setContainers] = useState<WasteContainer[]>([]);
  const [loadingContainers, setLoadingContainers] = useState<boolean>(true);
  const [errorText, setErrorText] = useState<string>('');
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean>(false);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoadingContainers(true);
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
        setLoadingContainers(false);
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
          Alert.alert('Location Permission', 'Location permission is needed to show your distance from the nearest container.');
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
        // Fallback to react-native-permissions
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
            Alert.alert('Location Permission', 'Location permission is needed to show your distance from the nearest container.');
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
    <SafeAreaView style={tw`flex-1 bg-white`}>
      {/* Header */}
      <View style={tw`px-5 pt-2 pb-3 border-b border-gray-200`}>
        <View style={tw`flex-row items-center justify-between mb-2`}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={tw`p-2 -ml-2`}>
            <ArrowLeft size={24} color="#2E523A" />
          </TouchableOpacity>
          <Text style={tw`text-xl font-bold text-primary`}>Map Routes</Text>
          <View style={tw`w-8`} />
        </View>

        {/* Search/Address Bar */}
        <View style={tw`flex-row items-center bg-gray-100 rounded-lg px-3 py-2`}>
          <MapPin size={18} color="#6B7280" style={tw`mr-2`} />
          <Text style={tw`text-gray-700 flex-1`}>Cadena De Amor St.</Text>
        </View>

        {accuracyLabel !== null && (
          <View style={tw`mt-2 self-start bg-gray-100 rounded-full px-3 py-1`}>
            <Text style={tw`text-[11px] ${accuracyLow ? 'text-amber-600' : 'text-gray-600'}`}>
              {accuracyLow
                ? `Accuracy low (~${accuracyLabel} m)`
                : `Accuracy ~${accuracyLabel} m`}
            </Text>
          </View>
        )}
      </View>

      {/* Map Area */}
      <View style={tw`flex-1 bg-white relative`}>
        {loadingContainers ? (
          <View style={tw`flex-1 items-center justify-center px-6`}>
            <ActivityIndicator size="large" color="#2E523A" />
          </View>
        ) : errorText ? (
          <View style={tw`flex-1 items-center justify-center px-6`}>
            <Text style={tw`text-red-600 font-semibold text-center`}>{errorText}</Text>
          </View>
        ) : containers.length === 0 ? (
          <View style={tw`flex-1 items-center justify-center px-6`}>
            <Text style={tw`text-primary font-semibold text-center`}>No waste containers found.</Text>
          </View>
        ) : (
          <>
            <HWasteCollectionMap
              containers={containers}
              showsUserLocation={locationGranted}
              onUserLocationChange={(coords) => {
                setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
                if (userAccuracy !== null) {
                  setUserAccuracy(userAccuracy);
                }
              }}
              userLocation={userLocation}
              recenterKey={recenterKey}
            />

            {/* Nearest Container Info */}
            {nearestContainer && (
              <View
                style={tw`absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md p-4 w-11/12`}
              >
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 mr-3`}>
                    <Text style={tw`text-sm text-gray-500`}>Nearest Container</Text>
                    <Text style={tw`text-lg font-semibold text-primary`} numberOfLines={1}>
                      {nearestContainer.name}
                    </Text>
                  </View>
                  <View
                    style={tw`w-12 h-12 rounded-full bg-cover bg-center`}
                    testID="nearest-container-image"
                    accessibilityLabel="Nearest container image"
                  >
                    {nearestContainer.raw?.imageUrl ? (
                      <Image
                        source={{ uri: nearestContainer.raw.imageUrl }}
                        style={tw`w-full h-full rounded-full`}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={tw`w-full h-full rounded-full bg-gray-200`} />
                    )}
                  </View>
                </View>

                <View style={tw`mt-2`}>
                  <Text style={tw`text-sm text-gray-500`}>
                    Status:{' '}
                    <Text style={{ color: statusColor, fontWeight: '500' }}>{statusText}</Text>
                  </Text>
                  <Text style={tw`text-sm text-gray-500`}>
                    Next Pickup:{' '}
                    <Text style={tw`font-semibold text-gray-800`}>{nextPickupLabel}</Text>
                  </Text>
                  {nearestDistanceKm !== null && (
                    <Text style={tw`text-sm text-gray-500`}>
                      Distance: <Text style={tw`font-semibold text-gray-800`}>{nearestDistanceKm.toFixed(2)} km</Text>
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  onPress={() => {
                    // ChatSupport has no route params in the navigator type — navigate without params
                    navigation.navigate('ChatSupport');
                  }}
                  style={tw`mt-3 bg-primary rounded-lg px-4 py-2 flex-row items-center justify-center`}
                  activeOpacity={0.8}
                >
                  <MessageCircle size={18} color="#fff" style={tw`mr-2`} />
                  <Text style={tw`text-white font-semibold text-center`}>Request Pickup</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </View>

      {/* Bottom Navbar */}
      <BottomNavbar />
    </SafeAreaView>
  );
};

export default HMap;

// helper: haversine distance (km)
function toRad(v: number) {
  return (v * Math.PI) / 180;
}
function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371; // km
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const A = sinDLat * sinDLat + sinDLon * sinDLon * Math.cos(lat1) * Math.cos(lat2);
  const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A));
  return R * C;
}

// minimal fallback for schedule label (safe when Schedule shape is unknown)
function findNextPickupLabel(container: WasteContainer, schedules: Schedule[]): string {
  if (!schedules || schedules.length === 0) return 'No schedule';
  // try to find schedule matching container area/name (best-effort)
  const match = schedules.find((s: any) => {
    const areaVals: string[] = [];
    if (s?.area) areaVals.push(String(s.area));
    if (s?.Area) areaVals.push(String(s.Area));
    if (s?.area_name) areaVals.push(String(s.area_name));
    if (container.areaName) areaVals.push(String(container.areaName));
    return areaVals.some((v: string) =>
      String(container.areaName || container.name || '').toLowerCase().includes(v.toLowerCase())
    );
  });
  if (!match) {
    // If schedule objects have a date or label, try to show it; otherwise generic text
    const maybeLabel = (schedules[0] as any)?.label ?? (schedules[0] as any)?.nextPickup ?? (schedules[0] as any)?.date;
    return maybeLabel ? String(maybeLabel) : 'See schedule';
  }
  const mLabel = (match as any)?.label ?? (match as any)?.nextPickup ?? (match as any)?.date;
  return mLabel ? String(mLabel) : 'See schedule';
}