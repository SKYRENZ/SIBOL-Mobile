import { get, post } from './apiClient';

export interface AdditiveType {
  id: number;
  name: string;
}

export interface AdditiveRow {
  id: number;
  machine_id: number;
  additive_name?: string | null;
  additive_input: string;
  value: number;
  units: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  operator_username?: string | null;
}

export const fetchAdditiveTypes = async (): Promise<AdditiveType[]> => {
  return get<AdditiveType[]>('/api/additives/types');
};

export const fetchAdditives = async (machine_id?: number): Promise<AdditiveRow[]> => {
  const query = machine_id ? `?machine_id=${machine_id}` : '';
  return get<AdditiveRow[]>(`/api/additives${query}`);
};

export const createAdditive = async (payload: {
  machine_id: number;
  additive_type_id: number;
  stage?: string;
  value: number;
  units: string;
}) => {
  return post('/api/additives', payload);
};