import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MapView, { Marker, Callout, UrlTile, Region } from 'react-native-maps';
import type { WasteContainer } from '../services/wasteContainerService';

type Props = {
  containers: WasteContainer[];
  interactive?: boolean;
  showsUserLocation?: boolean;
  onUserLocationChange?: (coords: { latitude: number; longitude: number; accuracy?: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  recenterKey?: number;
};

export default function OWasteCollectionMap({
  containers,
  interactive = true,
  showsUserLocation = false,
  onUserLocationChange,
  userLocation,
  recenterKey = 0,
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
  }, [userLocation, recenterKey]);

  return (
    <View style={styles.wrap}>
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
                if (coord) onUserLocationChange({ latitude: coord.latitude, longitude: coord.longitude, accuracy: coord.accuracy });
              }
            : undefined
        }
      >
        <UrlTile
          urlTemplate="https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maximumZ={19}
        />

        {containers.map((c) => (
          <Marker
            key={String(c.id)}
            coordinate={{ latitude: c.latitude, longitude: c.longitude }}
            tracksViewChanges={false}
          >
            <Image source={require('../../assets/trashcan.png')} style={styles.markerIcon} />
            <Callout>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{c.areaName}</Text>
                <Text style={styles.calloutSub}>{c.name}</Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {userLocation && (
          <Marker coordinate={userLocation} tracksViewChanges={false}>
            <View style={styles.youWrap}>
              <View style={styles.youDot} />
              <View style={styles.youLabel}>
                <Text style={styles.youText}>You</Text>
              </View>
            </View>
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  markerIcon: {
    width: 28,
    height: 28,
  },
  callout: {
    minWidth: 160,
    paddingVertical: 2,
  },
  calloutTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2E523A',
  },
  calloutSub: {
    fontSize: 12,
    color: '#2E523A',
  },
  youWrap: {
    alignItems: 'center',
  },
  youDot: {
    width: 10,
    height: 10,
    backgroundColor: '#2E523A',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: '#fff',
  },
  youLabel: {
    marginTop: 4,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  youText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
  },
});