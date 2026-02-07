import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, post } from './apiClient';

export async function createWasteInput(machineId: number | string, weight: number, accountId?: number | string) {
  let resolvedAccountId: number | undefined;

  if (accountId !== undefined && accountId !== null && String(accountId).trim() !== '') {
    const n = Number(accountId);
    if (Number.isFinite(n)) resolvedAccountId = n;
  } else {
    try {
      const rawUser = await AsyncStorage.getItem('user');
      if (rawUser) {
        const user = JSON.parse(rawUser);
        const id = Number(user?.Account_id ?? user?.AccountId ?? user?.id);
        if (Number.isFinite(id)) resolvedAccountId = id;
      }
    } catch {
      // ignore
    }
  }

  const payload: any = {
    machineId: Number(machineId),
    weight: Number(Number(weight).toFixed(2)),
  };

  if (resolvedAccountId !== undefined) {
    payload.accountId = resolvedAccountId;
  }

  const data = await post('/api/waste-inputs', payload);
  return data;
}

export async function getWasteInputsByMachineId(machineId: number | string) {
  const id = Number(machineId);
  if (!Number.isFinite(id)) return [];
  const data = await get(`/api/waste-inputs/machine/${id}`);
  if (data && Array.isArray((data as any).data)) return (data as any).data;
  if (Array.isArray(data)) return data;
  return [];
}
