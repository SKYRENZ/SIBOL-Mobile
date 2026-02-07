import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import WasteIcon from './WasteIcon';
import MapView, { Marker, Callout, UrlTile, Region, Polygon, Polyline } from 'react-native-maps';
import { API_BASE } from '../services/apiClient';
import { getCachedBoundary, setCachedBoundary } from '../utils/boundaryCache';
import type { WasteContainer } from '../services/wasteContainerService';

type Props = {
  containers: WasteContainer[];
  interactive?: boolean;
  showsUserLocation?: boolean;
  onUserLocationChange?: (coords: { latitude: number; longitude: number; accuracy?: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  recenterKey?: number;
  routePath?: { latitude: number; longitude: number }[] | null;
};

const BARANGAY_176_QUERIES = [
  { key: '176-e', label: 'Barangay 176-E', query: 'Barangay 176-E, Caloocan, Metro Manila, Philippines', color: '#1B5E20', fillColor: '#A5D6A7' },
  { key: '176-a', label: 'Barangay 176-A', query: 'Barangay 176-A, Caloocan, Metro Manila, Philippines', color: '#2E7D32', fillColor: '#B7E1B0' },
  { key: '176-b', label: 'Barangay 176-B', query: 'Barangay 176-B, Caloocan, Metro Manila, Philippines', color: '#388E3C', fillColor: '#C8E6C9' },
  { key: '176-c', label: 'Barangay 176-C', query: 'Barangay 176-C, Caloocan, Metro Manila, Philippines', color: '#43A047', fillColor: '#D1EFD0' },
  { key: '176-d', label: 'Barangay 176-D', query: 'Barangay 176-D, Caloocan, Metro Manila, Philippines', color: '#4CAF50', fillColor: '#DDF5D8' },
  { key: '176-f', label: 'Barangay 176-F', query: 'Barangay 176-F, Caloocan, Metro Manila, Philippines', color: '#5FBF5B', fillColor: '#E6F7E3' },
];

type PolygonBoundary = {
  key: string;
  label: string;
  color: string;
  fillColor: string;
  polygons: { latitude: number; longitude: number }[][];
};

export default function OWasteCollectionMap({
  containers,
  interactive = true,
  showsUserLocation = false,
  onUserLocationChange,
  userLocation,
  recenterKey = 0,
  routePath = null,
}: Props) {
  const mapRef = useRef<MapView | null>(null);
  const [useBackendTiles, setUseBackendTiles] = useState<boolean | null>(null);
  const [boundaries, setBoundaries] = useState<PolygonBoundary[]>([]);
  const skipBoundaryFitRef = useRef(false);

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

  useEffect(() => {
    if (!mapRef.current || !routePath || routePath.length < 2) return;
    mapRef.current.fitToCoordinates(routePath, {
      edgePadding: { top: 60, right: 60, bottom: 80, left: 60 },
      animated: true,
    });
  }, [routePath]);

  useEffect(() => {
    if (recenterKey > 0) skipBoundaryFitRef.current = true;
  }, [recenterKey]);

  useEffect(() => {
    let mounted = true;

    const fetchBoundary = async (query: string) => {
      const cached = await getCachedBoundary(query);
      if (cached) return cached;

      const url = `https://nominatim.openstreetmap.org/search?format=geojson&polygon_geojson=1&limit=1&q=${encodeURIComponent(
        query
      )}`;
      const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
      if (!res.ok) return null;
      const data = await res.json();
      const feature = data?.features?.[0] ?? null;
      if (feature) await setCachedBoundary(query, feature);
      return feature;
    };

    const toPolygons = (feature: any): { latitude: number; longitude: number }[][] => {
      if (!feature?.geometry) return [];
      const geom = feature.geometry;
      if (geom.type === 'Polygon') {
        const rings = geom.coordinates as number[][][];
        return rings.map((ring) => ring.map((p) => ({ latitude: p[1], longitude: p[0] })));
      }
      if (geom.type === 'MultiPolygon') {
        const polys = geom.coordinates as number[][][][];
        return polys.flatMap((poly) =>
          poly.map((ring) => ring.map((p) => ({ latitude: p[1], longitude: p[0] })))
        );
      }
      return [];
    };

    const fitToBoundary = (coords: { latitude: number; longitude: number }[]) => {
      if (!mapRef.current || coords.length === 0) return;
      mapRef.current.fitToCoordinates(coords, {
        edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
        animated: true,
      });
    };

    const run = async () => {
      try {
        const results: PolygonBoundary[] = [];
        for (const b of BARANGAY_176_QUERIES) {
          const feature = await fetchBoundary(b.query);
          if (!mounted) return;
          const polygons = toPolygons(feature);
          if (polygons.length) {
            results.push({ key: b.key, label: b.label, color: b.color, fillColor: b.fillColor, polygons });
          }
        }
        if (!mounted) return;
        setBoundaries(results);

        const brgy176e = results.find((r) => r.key === '176-e');
        const flat = brgy176e?.polygons?.flat() ?? [];
        if (flat.length && !skipBoundaryFitRef.current) fitToBoundary(flat);
      } catch {
        if (!mounted) return;
        setBoundaries([]);
      }
    };

    run();
    return () => {
      mounted = false;
    };
  }, []);

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

        {boundaries.map((b) =>
          b.polygons.map((ring, idx) => (
            <Polygon
              key={`${b.key}-${idx}`}
              coordinates={ring}
              strokeColor={b.color}
              strokeWidth={b.key === '176-e' ? 3 : 2}
              fillColor={b.key === '176-e' ? `${b.fillColor}A0` : `${b.fillColor}80`}
            />
          ))
        )}

        {routePath && routePath.length >= 2 && (
          <Polyline
            coordinates={routePath}
            strokeColor="#2E523A"
            strokeWidth={4}
            lineCap="round"
            lineJoin="round"
          />
        )}

        {/* containers */}
        {containers.map((c, i) => {
          const lat = Number(c.latitude);
          const lon = Number(c.longitude);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
          const key = String(c.id ?? c.container_id ?? `${lat}-${lon}-${i}`);
          return (
          <Marker
            key={key}
            coordinate={{ latitude: lat, longitude: lon }}
            title={c.name || c.areaName || 'Container'}
            description={c.fullAddress ?? undefined}
            tracksViewChanges={false}
          >
            <View style={styles.markerWrap}>
              <WasteIcon size={28} />
            </View>
            <Callout tooltip>
              <View style={styles.callout}>
                <Text style={styles.calloutTitle}>{c.areaName ?? c.name}</Text>
                <Text style={styles.calloutSubtitle}>{c.status ?? 'Unknown status'}</Text>
                <Text style={styles.calloutAddr}>{c.fullAddress ?? ''}</Text>
              </View>
            </Callout>
          </Marker>
          );
        })}
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
  markerWrap: { alignItems: 'center', justifyContent: 'center' },
  markerIcon: { width: 32, height: 32, tintColor: '#2E523A' },
  callout: { width: 180, padding: 8, backgroundColor: '#fff', borderRadius: 8, elevation: 3 },
  calloutTitle: { fontWeight: '700', color: '#2E523A', marginBottom: 4 },
  calloutSubtitle: { color: '#6b7280', marginBottom: 4 },
  calloutAddr: { color: '#374151', fontSize: 12 },
  emptyWrap: { position: 'absolute', top: 12, left: 12, right: 12, alignItems: 'center' },
  emptyText: { backgroundColor: '#fff', padding: 8, borderRadius: 8, color: '#2E523A', fontWeight: '600' },
});