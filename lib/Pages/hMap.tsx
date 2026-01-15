import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, Image, ActivityIndicator, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import tw from '../utils/tailwind';
import { MapPin, Menu, MessageCircle, Home, Bell, ArrowLeft } from 'lucide-react-native';
import HWasteCollectionMap from '../components/HWasteCollectionMap';
import { listWasteContainers, WasteContainer } from '../services/wasteContainerService';
import { listSchedules, Schedule } from '../services/scheduleService';

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
    let watchId: number | null = null;

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
            const { latitude, longitude } = pos.coords;
            setLocationGranted(true);
            setUserLocation({ latitude, longitude });
          },
          () => {
            if (!mounted) return;
            setLocationGranted(false);
            Alert.alert('Location Permission', 'Allow location access to show your position.');
          },
          { enableHighAccuracy: true }
        );

        watchId = navigator.geolocation.watchPosition(
          (pos) => {
            if (!mounted) return;
            const { latitude, longitude } = pos.coords;
            setUserLocation({ latitude, longitude });
          },
          () => {
            if (!mounted) return;
            setLocationGranted(false);
          },
          { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
        );

        return;
      }

      if (Platform.OS !== 'android' && Platform.OS !== 'ios') return;

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
    })();

    return () => {
      mounted = false;
      if (watchId !== null && navigator?.geolocation?.clearWatch) {
        navigator.geolocation.clearWatch(watchId);
      }
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
              onUserLocationChange={setUserLocation}
              userLocation={userLocation}
            />

            {nearestContainer && (
              <View style={tw`absolute left-4 right-4 bottom-8 bg-white rounded-2xl border border-gray-100 p-4`}>
                <View style={tw`flex-row items-center mb-3`}>
                  <View style={tw`bg-blue-100 p-2 rounded-lg mr-3`}>
                    <Image
                      source={require('../../assets/waste-truck.png')}
                      style={tw`w-6 h-6`}
                      resizeMode="contain"
                    />
                  </View>
                  <View style={tw`flex-1`}>
                    <Text style={tw`text-xs text-gray-500`}>Nearest waste container is in</Text>
                    <Text style={tw`text-base font-bold text-primary`}>
                      {nearestContainer.areaName || nearestContainer.name}
                    </Text>
                  </View>
                </View>

                <View style={tw`flex-row justify-between mt-1`}>
                  <View style={tw`items-center flex-1`}>
                    <Text style={tw`text-[11px] text-gray-500`}>Distance</Text>
                    <Text style={tw`text-xs font-semibold`}>
                      {nearestDistanceKm === null ? '—' : `${nearestDistanceKm.toFixed(1)} km away`}
                    </Text>
                  </View>
                  <View style={tw`items-center flex-1`}>
                    <Text style={tw`text-[11px] text-gray-500`}>Status</Text>
                    <Text style={[tw`text-xs font-bold`, { color: statusColor }]}>{statusText}</Text>
                  </View>
                  <View style={tw`items-center flex-1`}>
                    <Text style={tw`text-[11px] text-gray-500`}>Next Pickup</Text>
                    <Text style={tw`text-xs font-semibold`}>{nextPickupLabel}</Text>
                  </View>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Bottom Navigation */}
      <View style={tw`flex-row justify-around items-center py-3 bg-primary`}>
        <TouchableOpacity style={tw`items-center`}>
          <Menu size={24} color="#FFFFFF" />
          <Text style={tw`text-xs text-white mt-1`}>Menu</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`} onPress={() => navigation.navigate('ChatSupport')}>
          <MessageCircle size={24} color="#FFFFFF" />
          <Text style={tw`text-xs text-white mt-1`}>Chat Support</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`} onPress={() => navigation.navigate('HDashboard')}>
          <View style={tw`bg-[#1F4F2A] rounded-full p-3 -mt-8`}>
            <Home size={24} color="white" />
          </View>
          <Text style={tw`text-xs text-white font-bold mt-1`}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`}>
          <Bell size={24} color="#FFFFFF" />
          <Text style={tw`text-xs text-white mt-1`}>Notifications</Text>
        </TouchableOpacity>
        <TouchableOpacity style={tw`items-center`} onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color="#FFFFFF" />
          <Text style={tw`text-xs text-white mt-1`}>Back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

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

export default HMap;