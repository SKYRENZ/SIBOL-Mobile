import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import MapView, { Marker, Callout, UrlTile, Region } from 'react-native-maps';
import type { WasteContainer } from '../services/wasteContainerService';

type Props = {
  containers: WasteContainer[];
  interactive?: boolean;
};

export default function OWasteCollectionMap({ containers, interactive = true }: Props) {
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

    // Fallback region (only used when there are no containers)
    return {
      latitude: 14.5995,
      longitude: 120.9842,
      latitudeDelta: 0.2,
      longitudeDelta: 0.2,
    };
  }, [containers]);

  return (
    <View style={styles.wrap}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
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
});