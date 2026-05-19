import { apiDelete, apiGet, apiPost, apiPut } from './http';
import type { Device } from '@/types';

export function getDevices(params?: { tier?: string; conditionStatus?: string; page?: number; limit?: number }) {
  return apiGet<{ total: number; page: number; totalPages: number; data: Device[] }>('/equipment', { params });
}

export function getDeviceById(id: string) {
  return apiGet<Device>(`/equipment/${id}`);
}

export function createDevice(payload: Omit<Device, 'id'>) {
  return apiPost<Device>('/equipment', payload);
}

export function updateDevice(id: string, payload: Partial<Device>) {
  return apiPut<Device>(`/equipment/${id}`, payload);
}

export function deleteDevice(id: string) {
  return apiDelete<{ success: boolean }>(`/equipment/${id}`);
}