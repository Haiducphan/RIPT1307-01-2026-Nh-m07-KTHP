import { apiDelete, apiGet, apiPost, apiPut } from './http';
import type { Device, DeviceStatus } from '@/types';

interface EquipmentImageResponse {
  imageUrl?: string;
  isPrimary?: boolean;
}

interface EquipmentResponse {
  id: Device['id'];
  name?: string;
  description?: string | null;
  category?: string;
  categoryName?: string;
  categoryId?: number;
  totalQuantity?: number;
  availableQuantity?: number;
  conditionStatus?: string;
  status?: string;
  isActive?: boolean;
  images?: EquipmentImageResponse[];
}

interface EquipmentListResponse {
  data?: EquipmentResponse[] | { rows?: EquipmentResponse[]; items?: EquipmentResponse[] };
  rows?: EquipmentResponse[];
  items?: EquipmentResponse[];
}

const CATEGORY_BY_ID: Record<number, string> = {
  1: 'Máy tính',
  2: 'Trình chiếu',
  3: 'Hình ảnh',
  4: 'Nội thất',
  5: 'Âm thanh',
  6: 'Mạng',
  7: 'Dụng cụ',
  9: 'In ấn',
  10: 'Tương tác'
};

function getDeviceStatus(raw: EquipmentResponse): DeviceStatus {
  if (raw.status === 'available' || raw.status === 'unavailable' || raw.status === 'maintenance') {
    return raw.status;
  }

  const condition = raw.conditionStatus?.toLowerCase() ?? '';
  if (condition.includes('maintenance') || condition.includes('repair') || condition.includes('broken')) {
    return 'maintenance';
  }
  if (raw.isActive === false || (raw.availableQuantity ?? 0) <= 0) {
    return 'unavailable';
  }
  return 'available';
}

export function normalizeDevice(raw: EquipmentResponse): Device {
  const images = (raw.images ?? [])
    .map((image) => image.imageUrl)
    .filter((imageUrl): imageUrl is string => Boolean(imageUrl));
  const image = raw.images?.find((item) => item.isPrimary && item.imageUrl)?.imageUrl ?? images[0];

  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? '',
    description: raw.description ?? '',
    category: raw.category ?? raw.categoryName ?? CATEGORY_BY_ID[raw.categoryId ?? -1] ?? 'Khác',
    totalQuantity: raw.totalQuantity ?? 0,
    availableQuantity: raw.availableQuantity ?? 0,
    status: getDeviceStatus(raw),
    image,
    images
  };
}

function extractEquipmentArray(response: EquipmentResponse[] | EquipmentListResponse): EquipmentResponse[] {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (response.data && !Array.isArray(response.data)) {
    if (Array.isArray(response.data.rows)) return response.data.rows;
    if (Array.isArray(response.data.items)) return response.data.items;
  }
  if (Array.isArray(response.rows)) return response.rows;
  if (Array.isArray(response.items)) return response.items;
  return [];
}

export function getDevices() {
  return apiGet<EquipmentResponse[] | EquipmentListResponse>('/equipment').then((response) => {
    const devices = extractEquipmentArray(response);
    return devices.map(normalizeDevice);
  });
}

export function getDeviceById(id: string) {
  return apiGet<EquipmentResponse | { data: EquipmentResponse }>(`/equipment/${id}`).then((response) =>
    normalizeDevice('data' in response ? response.data : response)
  );
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
