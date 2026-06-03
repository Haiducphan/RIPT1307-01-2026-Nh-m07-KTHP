import { apiDelete, apiGet, apiPatch, apiPostForm, apiPutForm } from './http';
import { normalizeDevice } from './devices';
import type { Device } from '@/types';

export interface EquipmentMutationPayload {
  code: string;
  name: string;
  categoryId: number;
  tier: string;
  totalQuantity: number;
  description?: string;
  conditionStatus?: string;
  images?: File[];
  deletedImageIds?: string[];
}

type EquipmentResponse = Device | { data?: unknown; equipment?: unknown; message?: string };
type EquipmentActionResponse = { success?: boolean; message?: string; data?: unknown; equipment?: unknown };

type EquipmentListResponse =
  | unknown[]
  | {
      data?: unknown[] | { rows?: unknown[]; items?: unknown[] };
      rows?: unknown[];
      items?: unknown[];
    };

function buildQuery(params?: { tier?: string; conditionStatus?: string; page?: number; limit?: number; includeInactive?: boolean }) {
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

export function getDevices(params?: { tier?: string; conditionStatus?: string; page?: number; limit?: number; includeInactive?: boolean }) {
  return apiGet<EquipmentListResponse>(`/equipment${buildQuery(params)}`).then((response) =>
    extractEquipmentArray(response).map((item) => normalizeDevice(item as Parameters<typeof normalizeDevice>[0]))
  );
}

export function getDeviceById(id: string) {
  return apiGet<Device | { data: Device }>(`/equipment/${id}`).then((response) => normalizeDevice('data' in response ? response.data : response));
}

function toFormData(payload: EquipmentMutationPayload) {
  const formData = new FormData();
  formData.append('code', payload.code);
  formData.append('name', payload.name);
  formData.append('categoryId', String(payload.categoryId));
  formData.append('tier', payload.tier);
  formData.append('totalQuantity', String(payload.totalQuantity));
  formData.append('conditionStatus', payload.conditionStatus || 'good');

  if (payload.description !== undefined) formData.append('description', payload.description);
  if (payload.deletedImageIds?.length) formData.append('deletedImageIds', payload.deletedImageIds.join(','));
  (payload.images ?? []).forEach((file) => formData.append('images', file));

  return formData;
}

function normalizeMutationResponse(response: EquipmentResponse) {
  if (response && typeof response === 'object' && 'data' in response && response.data) {
    return normalizeDevice(response.data as Parameters<typeof normalizeDevice>[0]);
  }
  if (response && typeof response === 'object' && 'equipment' in response && response.equipment) {
    return normalizeDevice(response.equipment as Parameters<typeof normalizeDevice>[0]);
  }
  return normalizeDevice(response as Parameters<typeof normalizeDevice>[0]);
}

export function createDevice(payload: EquipmentMutationPayload) {
  return apiPostForm<EquipmentResponse>('/equipment', toFormData(payload)).then(normalizeMutationResponse);
}

export function updateDevice(id: string, payload: EquipmentMutationPayload) {
  return apiPutForm<EquipmentResponse>(`/equipment/${id}`, toFormData(payload)).then(normalizeMutationResponse);
}

export function updateDeviceStock(id: string, totalQuantity: number) {
  return apiPatch<EquipmentActionResponse>(`/equipment/${id}/stock`, { totalQuantity }).then((response) => ({
    message: response.message,
    device: response.data || response.equipment ? normalizeDevice((response.data ?? response.equipment) as Parameters<typeof normalizeDevice>[0]) : undefined
  }));
}

export function toggleDeviceStatus(id: string) {
  return apiPatch<EquipmentActionResponse>(`/equipment/${id}/toggle-status`).then((response) => ({
    message: response.message,
    device: response.data || response.equipment ? normalizeDevice((response.data ?? response.equipment) as Parameters<typeof normalizeDevice>[0]) : undefined
  }));
}

export function deleteDevice(id: string) {
  return apiDelete<{ success: boolean; message?: string }>(`/equipment/${id}`);
}
