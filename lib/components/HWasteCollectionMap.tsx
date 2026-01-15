import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import MapView, { Marker, Callout, UrlTile, Region } from 'react-native-maps';
import tw from '../utils/tailwind';
import type { WasteContainer } from '../services/wasteContainerService';

type Props = {
  containers: WasteContainer[];
  interactive?: boolean;
  showsUserLocation?: boolean;
  onUserLocationChange?: (coords: { latitude: number; longitude: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
};

export default function HWasteCollectionMap({
  containers,
  interactive = true,
  showsUserLocation = false,
  onUserLocationChange,
  userLocation,
}: Props) {
  const mapRef = useRef<MapView | null>(null);

  const initialRegion: Region = useMemo(() => {
    const first = containers.find(c => Number.isFinite(c.latitude) && Number.isFinite(c.longitude));
    if (first) {
      return {
        latitude: first.latitude,
        longitude: first.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    return {
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }, [containers]);

  useEffect(() => {
    if (!mapRef.current || !userLocation) return;

    mapRef.current.animateToRegion(
      {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      500
    );
  }, [userLocation]);

  return (
    <View style={tw`flex-1 bg-white`}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        showsUserLocation={showsUserLocation}
        onUserLocationChange={
          onUserLocationChange
            ? (e: any) => {
                const coord = e?.nativeEvent?.coordinate;
                if (coord) onUserLocationChange({ latitude: coord.latitude, longitude: coord.longitude });
              }
            : undefined
        }
      >
        <UrlTile urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png" maximumZ={19} />

        {containers.map((c) => (
          <Marker
            key={String(c.id)}
            coordinate={{ latitude: c.latitude, longitude: c.longitude }}
            tracksViewChanges={false}
          >
            <Image source={require('../../assets/trashcan.png')} style={tw`w-7 h-7`} />
            <Callout>
              <View style={tw`min-w-40 py-1`}>
                <Text style={tw`text-[13px] font-bold text-primary`}>{c.areaName}</Text>
                <Text style={tw`text-xs text-primary`}>{c.name}</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {userLocation && (
          <Marker coordinate={userLocation} tracksViewChanges={false}>
            <View style={tw`bg-primary px-2 py-1 rounded-full border border-white`}>
              <Text style={tw`text-[11px] text-white font-bold`}>YOU</Text>
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}