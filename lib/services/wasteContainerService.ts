import { get } from './apiClient';

export type WasteContainer = {
  id: number;
  name: string;
  areaName: string;
  fullAddress?: string;
  status?: string;
  statusLabel?: string;
  currentKg?: number | null;
  hasWeightData?: boolean;
  latitude: number;
  longitude: number;
  raw: any;
};

function pickFirst(...vals: any[]) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return null;
}

function toNumber(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeContainer(r: any): WasteContainer | null {
  const idRaw = pickFirst(r?.container_id, r?.id);
  const id = toNumber(idRaw);
  if (id === null) return null;

  const latitude = toNumber(pickFirst(r?.latitude, r?.Latitude));
  const longitude = toNumber(pickFirst(r?.longitude, r?.Longitude));
  if (latitude === null || longitude === null) return null;

  const name = String(pickFirst(r?.container_name, r?.name, `Container ${id}`)).trim();
  const areaName = String(pickFirst(r?.area_name, r?.Area_Name, r?.AreaName, 'Area')).trim();
  const fullAddress = pickFirst(r?.full_address, r?.Full_Address) ?? undefined;
  const statusLabel = pickFirst(r?.status_label, r?.statusLabel) ?? undefined;
  const status = statusLabel ?? (pickFirst(r?.status) ?? undefined);
  const currentKg = (() => {
    const n = toNumber(pickFirst(r?.current_kg, r?.currentKg));
    return n === null ? null : n;
  })();
  const hasWeightData = (() => {
    const v = pickFirst(r?.has_weight_data, r?.hasWeightData);
    if (typeof v === 'boolean') return v;
    const n = toNumber(v);
    return n === null ? false : n === 1;
  })();

  return { id, name, areaName, fullAddress, status, statusLabel, currentKg, hasWeightData, latitude, longitude, raw: r };
}

export async function listWasteContainers(): Promise<WasteContainer[]> {
  const res = await get('/api/waste-containers');

  let items: any[] = [];
  if (Array.isArray(res)) items = res;
  else if (res && Array.isArray((res as any).data)) items = (res as any).data;
  else if (res && Array.isArray((res as any).rows)) items = (res as any).rows;

  return items.map(normalizeContainer).filter(Boolean) as WasteContainer[];
}