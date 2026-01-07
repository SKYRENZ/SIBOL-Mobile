import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import type { WasteContainer } from '../services/wasteContainerService';

type Props = {
  containers: WasteContainer[];
  interactive?: boolean;
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

export default function OWasteCollectionMap({ containers, interactive = true }: Props) {
  const mapHostRef = useRef<any>(null);

  const iconUrl = useMemo(() => {
    try {
      return Image.resolveAssetSource(require('../../assets/trashcan.png')).uri;
    } catch {
      return undefined;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let map: any;

    const mount = async () => {
      ensureLeafletCss();

      const hostEl = mapHostRef.current as any;
      if (!hostEl) return;

      // Clear previous map DOM (in case of hot reload / rerenders)
      hostEl.innerHTML = '';

      const Lmod: any = await import('leaflet');
      const L = Lmod?.default ?? Lmod;
      if (cancelled) return;

      const mapOptions: any = {
        zoomControl: interactive,
        dragging: interactive,
        scrollWheelZoom: interactive,
        doubleClickZoom: interactive,
        touchZoom: interactive,
      };

      map = L.map(hostEl, mapOptions);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);

      const icon =
        iconUrl
          ? L.icon({
              iconUrl,
              iconSize: [28, 28],
              iconAnchor: [14, 28],
              popupAnchor: [0, -28],
            })
          : undefined;

      const bounds = L.latLngBounds([]);

      (containers || []).forEach((c) => {
        const lat = Number(c.latitude);
        const lon = Number(c.longitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;

        const latLng = L.latLng(lat, lon);
        bounds.extend(latLng);

        const marker = L.marker(latLng, icon ? { icon } : undefined).addTo(map);
        marker.bindPopup(`<div style="font-size:12px">
            <div style="font-weight:700">${c.areaName ?? ''}</div>
            <div>${c.name ?? ''}</div>
          </div>`);
      });

      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 17 });
      } else {
        map.setView([14.5995, 120.9842], 12);
      }
    };

    mount();

    return () => {
      cancelled = true;
      try {
        if (map) map.remove();
      } catch {
        // ignore
      }
    };
  }, [containers, interactive, iconUrl]);

  return (
    <View style={styles.wrap}>
      {/* On web, RN <View> renders to a div; Leaflet mounts into it */}
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