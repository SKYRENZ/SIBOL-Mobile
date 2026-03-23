import { get } from './apiClient';

export interface CollectionLog {
  collection_id: number;
  area_id: number;
  operator_id: number;
  container_id?: number;
  weight: number;
  collection_method: 'manual' | 'sensor' | 'qr_scan';
  notes?: string;
  gps_latitude?: number;
  gps_longitude?: number;
  collected_at: string;
  created_at: string;
  Area_Name?: string;
  operator_name?: string;
  container_name?: string;
}

export interface CollectionStats {
  period: string;
  total_collections: number;
  total_weight: number;
  unique_operators: number;
  unique_areas: number;
}

export interface CollectionSummary {
  logs: CollectionLog[];
  summary: {
    total_collections: number;
    total_weight: number;
    unique_areas: number;
    collection_date: string;
  }[];
  pagination: {
    limit: number;
    offset: number;
    total: number;
  };
}

export interface CollectionStatsResponse {
  timeline: CollectionStats[];
  topOperators: Array<{
    operator_name: string;
    total_collections: number;
    total_weight: number;
  }>;
  topAreas: Array<{
    area_name: string;
    total_collections: number;
    total_weight: number;
  }>;
}

export interface LogCollectionRequest {
  area_id: number;
  operator_id: number;
  container_id?: number;
  weight: number;
  collection_method?: 'manual' | 'sensor' | 'qr_scan';
  notes?: string;
  gps_latitude?: number;
  gps_longitude?: number;
}

// Log a new waste collection
export async function logCollection(data: LogCollectionRequest): Promise<CollectionLog> {
  const response = await get('/api/collection-logs/log', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to log collection');
  }
  
  return response.data;
}

// Get collection logs for an operator
export async function getOperatorCollections(
  operatorId: number,
  options?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }
): Promise<CollectionSummary> {
  const params = new URLSearchParams();
  
  if (options?.start_date) params.append('start_date', options.start_date);
  if (options?.end_date) params.append('end_date', options.end_date);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  
  const url = `/api/collection-logs/operator/${operatorId}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await get(url);
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to get operator collections');
  }
  
  return response.data;
}

// Get collection logs for an area
export async function getAreaCollections(
  areaId: number,
  options?: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }
): Promise<{ logs: CollectionLog[]; pagination: any }> {
  const params = new URLSearchParams();
  
  if (options?.start_date) params.append('start_date', options.start_date);
  if (options?.end_date) params.append('end_date', options.end_date);
  if (options?.limit) params.append('limit', options.limit.toString());
  if (options?.offset) params.append('offset', options.offset.toString());
  
  const url = `/api/collection-logs/area/${areaId}${params.toString() ? `?${params.toString()}` : ''}`;
  const response = await get(url);
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to get area collections');
  }
  
  return response.data;
}

// Get collection statistics
export async function getCollectionStats(period: 'day' | 'week' | 'month' | 'year' = 'week'): Promise<CollectionStatsResponse> {
  const response = await get(`/api/collection-logs/stats?period=${period}`);
  
  if (!response.success) {
    throw new Error(response.message || 'Failed to get collection stats');
  }
  
  return response.data;
}
