import { apiDelete, apiGet, apiPost, apiPut } from './http';
import { normalizeDevice } from './devices';
import type { Device } from '@/types';

type EquipmentListResponse =
  | unknown[]
  | {
      data?: unknown[] | { rows?: unknown[]; items?: unknown[] };
      rows?: unknown[];
      items?: unknown[];
    };

function buildQuery(params?: { tier?: string; conditionStatus?: string; page?: number; limit?: number }) {
  if (!params) return '';

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function extractEquipmentArray(response: EquipmentListResponse): unknown[] {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== 'object') return [];

  const record = response as {
    data?: unknown[] | { rows?: unknown[]; items?: unknown[] };
    rows?: unknown[];
    items?: unknown[];
  };

  if (Array.isArray(record.data)) return record.data;
  if (record.data && typeof record.data === 'object') {
    if (Array.isArray(record.data.rows)) return record.data.rows;
    if (Array.isArray(record.data.items)) return record.data.items;
  }
  if (Array.isArray(record.rows)) return record.rows;
  if (Array.isArray(record.items)) return record.items;

  return [];
}

export function getDevices(params?: { tier?: string; conditionStatus?: string; page?: number; limit?: number }) {
  return apiGet<EquipmentListResponse>(`/equipment${buildQuery(params)}`).then((response) =>
    extractEquipmentArray(response).map((item) => normalizeDevice(item as Parameters<typeof normalizeDevice>[0]))
  );
}

export function getDeviceById(id: string) {
  return apiGet<Device | { data: Device }>(`/equipment/${id}`).then((response) => normalizeDevice('data' in response ? response.data : response));
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
