import React, { useEffect, useMemo, useRef } from 'react';
import { View, Image } from 'react-native';
import tw from '../utils/tailwind';
import type { WasteContainer } from '../services/wasteContainerService';

type Props = {
  containers: WasteContainer[];
  interactive?: boolean;
  showsUserLocation?: boolean;
  onUserLocationChange?: (coords: { latitude: number; longitude: number; accuracy?: number }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  recenterKey?: number;
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

export default function HWasteCollectionMap({
  containers,
  interactive = true,
  userLocation,
  recenterKey = 0,
}: Props) {
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
        L.marker([userLocation.latitude, userLocation.longitude], { icon: youIcon }).addTo(map);
      }

      if (userLocation) {
        map.setView([userLocation.latitude, userLocation.longitude], 16);
      } else if (bounds.isValid()) {
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
  }, [containers, interactive, iconUrl, userLocation, recenterKey]);

  return (
    <View style={tw`flex-1 bg-white`}>
      <View ref={mapHostRef} style={[tw`flex-1 w-full h-full`, { minHeight: 0 }]} />
    </View>
  );
}