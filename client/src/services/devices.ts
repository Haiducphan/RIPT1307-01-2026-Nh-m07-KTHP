import { apiDelete, apiGet, apiPost, apiPut } from './http';
import type { Device } from '@/types';

export function getDevices() {
  return apiGet<Device[]>('/devices');
}

export function getDeviceById(id: string) {
  return apiGet<Device>(`/devices/${id}`);
}

export function createDevice(payload: Omit<Device, 'id'>) {
  return apiPost<Device>('/devices', payload);
}

export function updateDevice(id: string, payload: Partial<Device>) {
  return apiPut<Device>(`/devices/${id}`, payload);
}

export function deleteDevice(id: string) {
  return apiDelete<{ success: boolean }>(`/devices/${id}`);
}
