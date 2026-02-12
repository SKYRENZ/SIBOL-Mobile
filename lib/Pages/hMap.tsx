import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Platform, Alert, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import * as Location from 'expo-location';
import tw from '../utils/tailwind';
import { MapPin, Menu, MessageCircle, Home, Bell, ArrowLeft, RefreshCcw } from 'lucide-react-native';
import HWasteCollectionMap from '../components/HWasteCollectionMap';
import { listWasteContainers, WasteContainer } from '../services/wasteContainerService';
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
  const [userLocation, setUserLocation] = useState<LatLng | null>(null);
  const [locationGranted, setLocationGranted] = useState<boolean>(false);
  const [userAccuracy, setUserAccuracy] = useState<number | null>(null);
  const [recenterKey, setRecenterKey] = useState(0);
  const [routePath, setRoutePath] = useState<LatLng[] | null>(null);
  const [focusedContainerId, setFocusedContainerId] = useState<string | number | null>(null);
  const [showContainerModal, setShowContainerModal] = useState(false);
  const [focusCoords, setFocusCoords] = useState<LatLng | null>(null);

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

  const focusedContainer = useMemo(() => {
    if (!focusedContainerId) return null;
    return containers.find((c) => String(c.id ?? c.container_id) === String(focusedContainerId)) ?? null;
  }, [containers, focusedContainerId]);

  const activeContainer = focusedContainer ?? nearestContainer;

  const nearestDistanceKm = useMemo(() => {
    if (!activeContainer || !userLocation) return null;
    return distanceKm(userLocation, {
      latitude: activeContainer.latitude,
      longitude: activeContainer.longitude,
    });
  }, [activeContainer, userLocation]);

  const pathStatus = routePath && routePath.length >= 2 ? 'On' : 'Off';

  const accuracyLabel = userAccuracy !== null ? Math.round(userAccuracy) : null;
  const accuracyLow = userAccuracy !== null && userAccuracy > 200;

  const handleRecenter = () => {
    if (!userLocation) {
      Alert.alert('Location', 'Waiting for your location. Try again in a moment.');
      return;
    }
    setRecenterKey((v) => v + 1);
  };

  const handleRouteToggle = () => {
    if (routePath && routePath.length >= 2) {
      setRoutePath(null);
      return;
    }
    if (!userLocation || !activeContainer) {
      Alert.alert('Route', 'Unable to build route. Check your location and nearest container.');
      return;
    }
    const dest = { latitude: Number(activeContainer.latitude), longitude: Number(activeContainer.longitude) };
    if (!Number.isFinite(dest.latitude) || !Number.isFinite(dest.longitude)) {
      Alert.alert('Route', 'Nearest container location is invalid.');
      return;
    }
    setRoutePath([userLocation, dest]);
  };

  const handleFocusContainer = (c: WasteContainer) => {
    const id = c.id ?? c.container_id ?? `${c.latitude}-${c.longitude}`;
    setFocusedContainerId(id);
    setRoutePath(null);
    const lat = Number(c.latitude);
    const lon = Number(c.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      setFocusCoords({ latitude: lat, longitude: lon });
    }
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']} // ✅ don't add bottom safe-area padding (bot nav already handles it)
      style={tw`flex-1 bg-white`}
    >
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
              routePath={routePath}
              focusCoords={focusCoords}
            />

            {/* Nearest Container Info */}
            {activeContainer && (
              <View
                style={tw`absolute bottom-10 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-md p-4 w-11/12`}
              >
                <View style={tw`flex-row items-center justify-between`}>
                  <View style={tw`flex-1 mr-3`}>
                    <Text style={tw`text-sm text-gray-500`}>Nearest Container</Text>
                    <Text style={tw`text-lg font-semibold text-primary`} numberOfLines={1}>
                      {activeContainer.name}
                    </Text>
                  </View>
                  <View style={tw`flex-row items-center gap-2`}>
                    <TouchableOpacity
                      onPress={() => setShowContainerModal(true)}
                      style={tw`p-2 rounded-lg bg-gray-100 border border-gray-200`}
                      activeOpacity={0.8}
                    >
                      <RefreshCcw size={16} color="#2E523A" />
                    </TouchableOpacity>
                    <View
                      style={tw`w-12 h-12 rounded-full bg-cover bg-center`}
                      testID="nearest-container-image"
                      accessibilityLabel="Nearest container image"
                    >
                      {activeContainer.raw?.imageUrl ? (
                        <Image
                          source={{ uri: activeContainer.raw.imageUrl }}
                          style={tw`w-full h-full rounded-full`}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={tw`w-full h-full rounded-full bg-gray-200`} />
                      )}
                    </View>
                  </View>
                </View>

                <View style={tw`mt-2`}>
                  <Text style={tw`text-sm text-gray-500`}>
                    Path:{' '}
                    <TouchableOpacity
                      onPress={handleRouteToggle}
                      activeOpacity={0.85}
                      style={tw`${pathStatus === 'On' ? 'bg-green-500' : 'bg-red-500'} px-2 py-0.5 rounded-md`}
                    >
                      <Text style={tw`text-white text-xs font-semibold`}>{pathStatus}</Text>
                    </TouchableOpacity>
                  </Text>
                  {nearestDistanceKm !== null && (
                    <Text style={tw`text-sm text-gray-500`}>
                      Distance: <Text style={tw`font-semibold text-gray-800`}>{nearestDistanceKm.toFixed(2)} km</Text>
                    </Text>
                  )}
                </View>

              </View>
            )}
          </>
        )}
      </View>

      <Modal transparent visible={showContainerModal} animationType="fade" onRequestClose={() => setShowContainerModal(false)}>
        <View style={tw`flex-1 bg-black/30 justify-center p-5`}>
          <View style={tw`bg-white rounded-2xl p-4 max-h-[75%]`}>
            <View style={tw`flex-row items-center justify-between mb-3`}>
              <Text style={tw`text-base font-bold text-primary`}>Select container</Text>
              <TouchableOpacity onPress={() => setShowContainerModal(false)}>
                <Text style={tw`text-primary font-semibold`}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {containers.map((c, idx) => {
                const label = c.name || `Container ${idx + 1}`;
                return (
                  <View key={String(c.id ?? c.container_id ?? idx)} style={tw`flex-row items-center py-3 border-b border-gray-100`}> 
                    <View style={tw`flex-1 pr-2`}>
                      <Text style={tw`text-sm font-semibold text-primary`}>{label}</Text>
                      {!!c.fullAddress && <Text style={tw`text-[11px] text-gray-500 mt-1`}>{c.fullAddress}</Text>}
                    </View>
                    <TouchableOpacity
                      style={tw`px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50`}
                      onPress={() => {
                        handleFocusContainer(c);
                        setShowContainerModal(false);
                      }}
                    >
                      <Text style={tw`text-xs font-semibold text-primary`}>Focus</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={tw`ml-2 px-3 py-1.5 rounded-lg bg-primary`}
                      onPress={() => {
                        const lat = Number(c.latitude);
                        const lon = Number(c.longitude);
                        if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
                          Alert.alert('Redirect', 'Container location is invalid.');
                          return;
                        }
                        handleFocusContainer(c);
                        setShowContainerModal(false);
                        if (!userLocation) {
                          Alert.alert('Redirect', 'Location not available. Focusing on container only.');
                          return;
                        }
                        setRoutePath([
                          userLocation,
                          { latitude: lat, longitude: lon },
                        ]);
                      }}
                    >
                      <Text style={tw`text-xs font-semibold text-white`}>Redirect</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

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
