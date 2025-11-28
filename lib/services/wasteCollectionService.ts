import { get, post } from './apiClient';

export type AreaRaw = {
  area_id?: number;
  Area_id?: number;
  id?: number;
  name?: string;
  AreaName?: string;
  AreaName_en?: string;
  Area_Name?: string;
  areaName?: string;
  area_name?: string;
  Area?: string;
  [k: string]: any;
};

export type NormalizedArea = {
  id: number | null;
  label: string;
  raw: AreaRaw;
};

function pickFirst(...vals: any[]) {
  for (const v of vals) {
    if (v !== undefined && v !== null && String(v).trim() !== '') return v;
  }
  return null;
}

function normalizeItem(a: any): NormalizedArea {
  const idRaw = pickFirst(a?.Area_id, a?.area_id, a?.id);
  const id = idRaw !== null ? Number(idRaw) : null;

  // try many possible name fields used across backends
  const labelRaw = pickFirst(
    a?.AreaName,
    a?.Area_Name,
    a?.AreaName_en,
    a?.areaName,
    a?.area_name,
    a?.name,
    a?.Area,
    a?.label,
    a?.Barangay,
    a?.barangay,
    a?.Purok,
    a?.purok,
    idRaw // fallback to id string
  );

  const label = String(labelRaw ?? '').trim();

  return { id, label, raw: a as AreaRaw };
}

export async function listAreas(): Promise<NormalizedArea[]> {
  const res = await get('/api/areas');
  let items: any[] = [];

  if (Array.isArray(res)) items = res;
  else if (res && Array.isArray((res as any).data)) items = (res as any).data;
  else if (res && Array.isArray((res as any).areas)) items = (res as any).areas;
  else if (res && Array.isArray((res as any).rows)) items = (res as any).rows;
  else if (res && res?.result && Array.isArray(res.result)) items = res.result;

  const normalized = items.map(normalizeItem);

  // debug log to help diagnose missing labels in the app
  try {
    console.debug('[wasteService] normalized areas (first 30):', normalized.slice(0, 30).map(a => ({ id: a.id, label: a.label })));
  } catch (e) { /* ignore */ }

  return normalized;
}

async function resolveAreaId(area: string | number): Promise<number> {
  if (typeof area === 'number') return area;
  const n = Number(area);
  if (!Number.isNaN(n) && Number.isFinite(n)) return n;

  const areas = await listAreas();
  const target = (area ?? '').toString().trim().toLowerCase();

  // exact label match
  let match = areas.find(a => a.label.toLowerCase() === target);
  // numeric id match stored as string
  if (!match) match = areas.find(a => a.id !== null && String(a.id) === target);
  // prefix match
  if (!match) match = areas.find(a => a.label.toLowerCase().startsWith(target));
  // substring fallback
  if (!match) match = areas.find(a => a.label.toLowerCase().includes(target));

  if (!match) throw new Error(`Area not found: "${area}". Please pick from suggestions.`);

  if (match.id === null) throw new Error(`Selected area has no id: "${match.label}"`);

  return Number(match.id);
}

/**
 * Create a waste collection record.
 * Accepts area as id (number) or name (string). Weight may be decimal.
 */
export async function createCollection(area: string | number, weight: number) {
  const area_id = await resolveAreaId(area);
  const payload = { area_id, weight: Number(Number(weight).toFixed(2)) };
  const data = await post('/api/waste-collections', payload);
  return data;
}