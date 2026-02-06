import { get } from './apiClient';

export interface Machine {
  machine_id: number;
  Name: string;
}

export const fetchMachines = async (): Promise<Machine[]> => {
  const data = await get('/api/machines');
  return (data?.data ?? data ?? []) as Machine[];
};