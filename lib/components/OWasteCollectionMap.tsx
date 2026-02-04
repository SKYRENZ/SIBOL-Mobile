import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import MapView, { Marker, Callout, UrlTile, Region } from 'react-native-maps';
import { API_BASE } from '../services/apiClient';
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
  const [useBackendTiles, setUseBackendTiles] = useState<boolean | null>(null);

  // probe backend once (fast timeout) and decide tile source
  useEffect(() => {
    let mounted = true;
    const probe = async () => {
      try {
        const url = `${API_BASE.replace(/\/$/, '')}/api/health`;
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 1500);
        const r = await fetch(url, { method: 'GET', signal: controller.signal });
        clearTimeout(timer);
        if (!mounted) return;

        if (!r.ok) {
          let body: any = null;
          try { body = await r.json(); } catch { body = await r.text().catch(() => null); }
          console.error('[map probe] backend error', r.status, body);
          const bodyMsg =
            body && typeof body === 'object'
              ? (body.message ?? (body.missing_keys ? `missing: ${body.missing_keys.join(',')}` : JSON.stringify(body)))
              : String(body ?? 'no message');
          // non-blocking alert, then fallback to public tiles
          try {
            Alert.alert('Backend error', `API returned ${r.status}: ${bodyMsg}`);
          } catch (e) {
            console.warn('[map probe] Alert failed', e);
          }
          setUseBackendTiles(false);
          return;
        }

        // ok
        setUseBackendTiles(true);
      } catch (err: any) {
        console.error('[map probe] fetch failed', err);
        if (!mounted) return;
        setUseBackendTiles(false);
        const msg = String(err?.message ?? err);
        if (msg.toLowerCase().includes('api') && msg.toLowerCase().includes('key')) {
          try {
            Alert.alert('Configuration required', 'Server reports a missing API key. Check backend .env and logs.');
          } catch {}
        }
      }
    };
    probe();
    return () => { mounted = false; };
  }, []);

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

  const tileUrl = useMemo(() => {
    const backendUrl = `${API_BASE.replace(/\/$/, '')}/api/map/tiles/{z}/{x}/{y}.png`;
    const publicUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    if (useBackendTiles === null) return publicUrl;
    const isLocalBackend = /^https?:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|10\.0\.3\.2|192\.168\.)/i.test(API_BASE);
    return useBackendTiles && isLocalBackend ? backendUrl : publicUrl;
  }, [useBackendTiles]);

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
                if (coord) {
                  onUserLocationChange({
                    latitude: coord.latitude,
                    longitude: coord.longitude,
                    accuracy: coord.accuracy,
                  });
                }
              }
            : undefined
        }
      >
        {/* tiles */}
        <UrlTile
          urlTemplate={tileUrl}
          maximumZ={19}
          flipY={false}
          zIndex={0}
        />

        {/* containers */}
        {containers.map((c) => (
          <Marker
            key={c.id}
            coordinate={{ latitude: c.latitude, longitude: c.longitude }}
            title={c.name || c.areaName || 'Container'}
            description={c.fullAddress ?? undefined}
            tracksViewChanges={false}
          >
            {/* lightweight marker icon (falls back to default pin if asset missing) */}
            <Image
              // marker-waste.png was missing in the bundle — use trashcan.png which exists
              source={require('../../assets/trashcan.png')}
              style={styles.markerIcon}
              resizeMode="contain"
            />
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{c.areaName ?? c.name}</Text>
                <Text style={styles.calloutSubtitle}>{c.status ?? 'Unknown status'}</Text>
                <Text style={styles.calloutAddr}>{c.fullAddress ?? ''}</Text>
              </View>
            </Callout>
          </Marker>
        ))}
      </MapView>

      {containers.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>No containers to display</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#fff' },
  markerIcon: { width: 32, height: 32, tintColor: '#2E523A' },
  callout: { width: 180, padding: 8, backgroundColor: '#fff', borderRadius: 8, elevation: 3 },
  calloutTitle: { fontWeight: '700', color: '#2E523A', marginBottom: 4 },
  calloutSubtitle: { color: '#6b7280', marginBottom: 4 },
  calloutAddr: { color: '#374151', fontSize: 12 },
  emptyWrap: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' },
  emptyText: { backgroundColor: '#fff', padding: 8, borderRadius: 8, color: '#2E523A', fontWeight: '600' },
});