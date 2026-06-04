import { apiDelete, apiGet, apiPost, apiPut } from './http';
import type { Device, DeviceImage, DeviceStatus } from '@/types';

interface EquipmentImageResponse {
  id?: string | number;
  imageUrl?: string;
  image_url?: string;
  isPrimary?: boolean;
  is_primary?: boolean;
  sortOrder?: number;
  sort_order?: number;
}

interface EquipmentResponse {
  id: Device['id'];
  code?: string;
  name?: string;
  description?: string | null;
  category?: string | { name?: string };
  categoryName?: string;
  categoryId?: number;
  imageUrl?: string;
  image_url?: string;
  image?: string;
  tier?: string;
  totalQuantity?: number;
  availableQuantity?: number;
  borrowingQuantity?: number;
  brokenQuantity?: number;
  damagedQuantity?: number;
  damaged_quantity?: number;
  broken_quantity?: number;
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

function getApiOrigin() {
  const apiBaseUrl = process.env.API_BASE_URL || '/api';
  if (apiBaseUrl.startsWith('http://') || apiBaseUrl.startsWith('https://')) {
    try {
      return new URL(apiBaseUrl).origin;
    } catch {
      return '';
    }
  }

  return '';
}

function normalizeImageUrl(value?: string | null) {
  const rawUrl = value?.trim();
  if (!rawUrl) return undefined;

  if (/^(https?:|data:)/i.test(rawUrl)) return rawUrl;

  const normalizedPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
  const apiOrigin = getApiOrigin();

  if (normalizedPath.startsWith('/uploads/')) {
    return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
  }

  if (normalizedPath.startsWith('/api/uploads/')) {
    const uploadPath = normalizedPath.replace(/^\/api/, '');
    return apiOrigin ? `${apiOrigin}${uploadPath}` : uploadPath;
  }

  return apiOrigin ? `${apiOrigin}${normalizedPath}` : normalizedPath;
}

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

function getCategoryName(raw: EquipmentResponse) {
  if (typeof raw.category === 'string') return raw.category;
  return raw.category?.name ?? raw.categoryName ?? CATEGORY_BY_ID[raw.categoryId ?? -1] ?? 'Khác';
}

function normalizeDeviceImage(raw: EquipmentImageResponse): DeviceImage | undefined {
  const url = normalizeImageUrl(raw.imageUrl ?? raw.image_url);
  if (!url) return undefined;

  return {
    id: raw.id === undefined || raw.id === null ? undefined : String(raw.id),
    url,
    isPrimary: raw.isPrimary ?? raw.is_primary,
    sortOrder: raw.sortOrder ?? raw.sort_order
  };
}

export function normalizeDevice(raw: EquipmentResponse): Device {
  const imageItems = (raw.images ?? [])
    .slice()
    .sort((left, right) => {
      const leftPrimary = (left.isPrimary ?? left.is_primary) ? 0 : 1;
      const rightPrimary = (right.isPrimary ?? right.is_primary) ? 0 : 1;
      if (leftPrimary !== rightPrimary) return leftPrimary - rightPrimary;
      return (left.sortOrder ?? left.sort_order ?? 0) - (right.sortOrder ?? right.sort_order ?? 0);
    })
    .map(normalizeDeviceImage)
    .filter((image): image is DeviceImage => Boolean(image));
  const images = imageItems.map((item) => item.url);
  const primaryImage = imageItems.find((item) => item.isPrimary);
  const image = normalizeImageUrl(raw.image ?? raw.imageUrl ?? raw.image_url) ?? primaryImage?.url ?? images[0];

  return {
    id: String(raw.id ?? ''),
    code: raw.code,
    name: raw.name ?? '',
    description: raw.description ?? '',
    categoryId: raw.categoryId,
    category: getCategoryName(raw),
    tier: raw.tier,
    totalQuantity: raw.totalQuantity ?? 0,
    availableQuantity: raw.availableQuantity ?? 0,
    borrowingQuantity: raw.borrowingQuantity ?? 0,
    brokenQuantity: raw.brokenQuantity ?? raw.broken_quantity ?? raw.damagedQuantity ?? raw.damaged_quantity ?? 0,
    conditionStatus: raw.conditionStatus,
    isActive: raw.isActive ?? true,
    status: getDeviceStatus(raw),
    image,
    images,
    imageItems
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
    return devices.filter((device) => device.isActive !== false).map(normalizeDevice);
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
