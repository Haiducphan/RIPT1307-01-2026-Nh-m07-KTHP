import { apiGet } from './http';
import type { StatisticItem } from '@/types';

export function getTopBorrowedDevices(month: string) {
  return apiGet<StatisticItem[]>(`/statistics/top-devices?month=${month}`);
}
