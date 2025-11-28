import { get, post } from './apiClient';

export type Area = {
  area_id?: number;
  Area_id?: number;
  id?: number;
  name?: string;
  AreaName?: string;
  AreaName_en?: string;
  [k: string]: any;
};

/**
 * Fetch all areas (tries several response shapes)
 */
export async function listAreas(): Promise<Area[]> {
  const res = await get('/api/areas');
  if (Array.isArray(res)) return res;
  if (res && Array.isArray((res as any).data)) return (res as any).data;
  if (res && Array.isArray((res as any).areas)) return (res as any).areas;
  return [];
}

/**
 * Resolve an area identifier from a numeric id or a display name.
 * Throws if no matching area is found.
 */
async function resolveAreaId(area: string | number): Promise<number> {
  if (typeof area === 'number') return area;
  const n = Number(area);
  if (!Number.isNaN(n) && Number.isFinite(n)) return n;

  const areas = await listAreas();
  const target = area.toString().trim().toLowerCase();
  const match = areas.find(a => {
    const names = [
      a.AreaName,
      a.AreaName_en,
      a.name,
      a.area_name,
      a.Area_name,
      a.Area_id && String(a.Area_id)
    ].filter(Boolean).map(String);
    return names.some(x => x.toLowerCase() === target);
  });

  if (!match) throw new Error(`Area not found: ${area}`);
  return Number(match.Area_id ?? match.area_id ?? match.id);
}

/**
 * Create a waste collection record.
 * @param area Area id (number) or area name (string)
 * @param weight numeric weight (kg)
 */
export async function createCollection(area: string | number, weight: number) {
  const area_id = await resolveAreaId(area);
  const payload = { area_id, weight };
  const data = await post('/api/waste-collections', payload);
  return data;
}