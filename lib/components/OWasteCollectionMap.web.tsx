import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
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

const ensureLeafletCss = () => {
  if (typeof document === 'undefined') return;
  const id = 'leaflet-css';
  if (document.getElementById(id)) return;

  const link = document.createElement('link');
  link.id = id;
  link.rel = 'stylesheet';
  link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
  document.head.appendChild(link);
};

export default function OWasteCollectionMap({
  containers,
  interactive = true,
  userLocation,
  recenterKey = 0,
  routePath = null,
}: Props) {
  const mapHostRef = useRef<any>(null);
  const mapInstanceRef = useRef<any>(null);
  const leafletRef = useRef<any>(null);
  const boundaryLayersRef = useRef<any[]>([]);
  const markerLayersRef = useRef<any[]>([]);
  const youLayerRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const skipBoundaryFitRef = useRef(false);

  const iconUrl = useMemo(() => {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none">
        <path fill="#355842" d="M9 2L8 3H4V5H20V3H16L15 2H9ZM5 7V21C5 22.1 5.9 23 7 23H17C18.1 23 19 22.1 19 21V7H5ZM9 9H11V21H9V9ZM13 9H15V21H13V9Z"/>
      </svg>
    `;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }, []);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    let cancelled = false;
    let map: any;
    let mountEl: HTMLDivElement | null = null;

    const mount = async () => {
      ensureLeafletCss();

      const hostEl = mapHostRef.current as any;
      if (!hostEl || typeof hostEl.appendChild !== 'function') return;

      hostEl.innerHTML = '';
      mountEl = document.createElement('div');
      mountEl.style.width = '100%';
      mountEl.style.height = '100%';
      hostEl.appendChild(mountEl);

      const Lmod: any = await import('leaflet');
      const L = Lmod?.default ?? Lmod;
      if (cancelled) return;
      leafletRef.current = L;

      const mapOptions: any = {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
        zoomAnimation: false,
        fadeAnimation: false,
        markerZoomAnimation: false,
        inertia: false,
      };

      map = L.map(mountEl, mapOptions);
      mapInstanceRef.current = map;
      // Ensure map has a base view before any interactions
      map.setView([14.5995, 120.9842], 12, { animate: false });

      const icon =
        iconUrl
          ? L.icon({
              iconUrl,
              iconSize: [28, 28],
              iconAnchor: [14, 28],
              popupAnchor: [0, -28],
            })
          : undefined;

      const BARANGAY_176_QUERIES = [
        { key: '176-e', label: 'Barangay 176-E', query: 'Barangay 176-E, Caloocan, Metro Manila, Philippines', color: '#1B5E20', fillColor: '#A5D6A7' },
        { key: '176-a', label: 'Barangay 176-A', query: 'Barangay 176-A, Caloocan, Metro Manila, Philippines', color: '#2E7D32', fillColor: '#B7E1B0' },
        { key: '176-b', label: 'Barangay 176-B', query: 'Barangay 176-B, Caloocan, Metro Manila, Philippines', color: '#388E3C', fillColor: '#C8E6C9' },
        { key: '176-c', label: 'Barangay 176-C', query: 'Barangay 176-C, Caloocan, Metro Manila, Philippines', color: '#43A047', fillColor: '#D1EFD0' },
        { key: '176-d', label: 'Barangay 176-D', query: 'Barangay 176-D, Caloocan, Metro Manila, Philippines', color: '#4CAF50', fillColor: '#DDF5D8' },
        { key: '176-f', label: 'Barangay 176-F', query: 'Barangay 176-F, Caloocan, Metro Manila, Philippines', color: '#5FBF5B', fillColor: '#E6F7E3' },
      ];

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

      const clearBoundaryLayers = () => {
        boundaryLayersRef.current.forEach((layer) => {
          try { layer.remove(); } catch {}
        });
        boundaryLayersRef.current = [];
      };

      const renderBoundaries = async () => {
        clearBoundaryLayers();
        let fitTarget: any = null;
        for (const b of BARANGAY_176_QUERIES) {
          if (cancelled || !map || !map._container) return;
          const feature = await fetchBoundary(b.query);
          if (cancelled || !map || !map._container) return;
          if (!feature?.geometry) continue;

          if (!map.getPane || !map.getPane('overlayPane')) return;

          const layer = L.geoJSON(feature, {
            style: {
              color: b.color,
              weight: b.key === '176-e' ? 3 : 2,
              opacity: 0.9,
              fillColor: b.fillColor,
              fillOpacity: b.key === '176-e' ? 0.45 : 0.3,
            },
          });
          if (!map || !map._container) return;
          layer.addTo(map);
          boundaryLayersRef.current.push(layer);
          if (b.key === '176-e') fitTarget = layer;
        }

        if (fitTarget && !skipBoundaryFitRef.current && map && map._container && map._loaded) {
          const fitBounds = fitTarget.getBounds();
          const size = map.getSize ? map.getSize() : null;
          if (fitBounds?.isValid() && size && size.x > 0 && size.y > 0) {
            try {
              map.fitBounds(fitBounds, { padding: [24, 24], maxZoom: 16, animate: false });
            } catch {
              // ignore
            }
          }
        }
      };

      map.whenReady(async () => {
        if (!map || !map._container) return;

        try {
          map.invalidateSize();
        } catch {
          // ignore
        }

        L.tileLayer(`${API_BASE.replace(/\/$/, '')}/api/map/tiles/{z}/{x}/{y}.png`, {
          maxZoom: 19,
          attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        await renderBoundaries();
      });
    };

    mount();

    return () => {
      cancelled = true;
      try {
        if (map) {
          try { map.stop(); } catch {}
          try { map.off(); } catch {}
          map.remove();
        }
      } catch {
        // ignore
      }
      mapInstanceRef.current = null;
      leafletRef.current = null;
      markerLayersRef.current = [];
      youLayerRef.current = null;
      routeLayerRef.current = null;
      try {
        if (mountEl && mountEl.parentElement) mountEl.parentElement.removeChild(mountEl);
      } catch {
        // ignore
      }
    };
  }, [interactive, iconUrl]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !map._container || !map._loaded) return;

    // clear existing markers
    markerLayersRef.current.forEach((layer) => {
      try { layer.remove(); } catch {}
    });
    markerLayersRef.current = [];

    (containers || []).forEach((c, i) => {
      const lat = Number(c.latitude);
      const lon = Number(c.longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

      const marker = L.marker(
        [lat, lon],
        iconUrl
          ? {
              icon: L.icon({
                iconUrl,
                iconSize: [28, 28],
                iconAnchor: [14, 28],
                popupAnchor: [0, -28],
              }),
            }
          : undefined
      ).addTo(map);

      marker.bindPopup(`<div style="font-size:12px">
          <div style="font-weight:700">${c.areaName ?? ''}</div>
          <div>${c.name ?? ''}</div>
        </div>`);
      markerLayersRef.current.push(marker);
    });

    if (youLayerRef.current) {
      try { youLayerRef.current.remove(); } catch {}
      youLayerRef.current = null;
    }

    if (userLocation) {
      const youIcon = L.divIcon({
        className: 'you-marker',
        html: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="width:10px;height:10px;background:#2E523A;border:2px solid #fff;border-radius:999px;"></div>
            <div style="margin-top:4px;background:rgba(255,255,255,.9);padding:2px 6px;border-radius:999px;border:1px solid #e5e7eb;font-size:10px;font-weight:600;color:#374151;">
              You
            </div>
          </div>
        `,
      });
      youLayerRef.current = L.marker([userLocation.latitude, userLocation.longitude], { icon: youIcon }).addTo(map);
      if (recenterKey > 0) {
        map.setView([userLocation.latitude, userLocation.longitude], 16, { animate: false });
      }
    }
  }, [containers, userLocation, recenterKey, iconUrl]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    const L = leafletRef.current;
    if (!map || !L || !map._container || !map._loaded) return;

    if (routeLayerRef.current) {
      try { routeLayerRef.current.remove(); } catch {}
      routeLayerRef.current = null;
    }

    if (!routePath || routePath.length < 2) return;

    const latLngs = routePath.map((p) => [p.latitude, p.longitude]);
    const polyline = L.polyline(latLngs, { color: '#2E523A', weight: 4, opacity: 0.9 });
    polyline.addTo(map);
    routeLayerRef.current = polyline;

    const bounds = polyline.getBounds?.();
    if (bounds?.isValid?.()) {
      try {
        map.fitBounds(bounds, { padding: [30, 30], maxZoom: 17, animate: false });
      } catch {
        // ignore
      }
    }
  }, [routePath]);

  useEffect(() => {
    if (recenterKey > 0) skipBoundaryFitRef.current = true;
  }, [recenterKey]);

  return (
    <View style={styles.wrap}>
      <View ref={mapHostRef} style={styles.mapHost} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    borderRadius: 0,
    overflow: 'hidden',
    backgroundColor: '#fff',
    width: '100%',
    height: '100%',
  },
  mapHost: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 0,
  },
});