import { get } from './apiClient';

export type Schedule = {
  Schedule_id: number;
  Account_id?: number;
  Collector?: string;
  Contact?: string;
  Area: string | number | Array<string | number>;
  sched_stat_id?: number;
  Date_of_collection: string;
};

export async function listSchedules(): Promise<Schedule[]> {
  const res = await get('/api/schedules');

  let items: any[] = [];
  if (Array.isArray(res)) items = res;
  else if (res && Array.isArray((res as any).data)) items = (res as any).data;
  else if (res && Array.isArray((res as any).rows)) items = (res as any).rows;

  return items as Schedule[];
}