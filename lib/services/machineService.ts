import { get } from './apiClient';

export interface Machine {
  machine_id: number;
  Name: string;
  Status?: string; // Optional status field
  IsOnline?: boolean; // Optional online status
  operator_id?: number; // ID of the operator this machine is assigned to
}

export const fetchMachines = async (): Promise<Machine[]> => {
  const data = await get('/api/machines');
  return (data?.data ?? data ?? []) as Machine[];
};

export const fetchOperatorMachines = async (operatorId: number): Promise<Machine[]> => {
  // Fetch all machines and filter by operator_id on client side
  const allMachines = await fetchMachines();
  return allMachines.filter(machine => machine.operator_id === operatorId);
};