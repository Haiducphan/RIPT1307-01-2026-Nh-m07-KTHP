import { apiDelete, apiGet, apiPost, apiPut } from './http';

export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  sortOrder: number;
}

export interface CategoryPayload {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

type RawCategory = {
  id?: string | number;
  name?: string;
  description?: string | null;
  icon?: string | null;
  sortOrder?: number;
  sort_order?: number;
};

type CategoryResponse = RawCategory[] | { data?: RawCategory[]; category?: RawCategory; message?: string };

function normalizeCategory(raw: RawCategory): Category {
  return {
    id: String(raw.id ?? ''),
    name: raw.name ?? 'Chưa đặt tên',
    description: raw.description ?? undefined,
    icon: raw.icon ?? undefined,
    sortOrder: raw.sortOrder ?? raw.sort_order ?? 0
  };
}

function extractCategories(response: CategoryResponse) {
  if (Array.isArray(response)) return response;
  return Array.isArray(response.data) ? response.data : [];
}

export function getCategories() {
  return apiGet<CategoryResponse>('/categories').then((response) => extractCategories(response).map(normalizeCategory));
}

export function createCategory(payload: CategoryPayload) {
  return apiPost<{ message?: string; category?: RawCategory }>('/categories', payload).then((response) => ({
    ...response,
    category: response.category ? normalizeCategory(response.category) : undefined
  }));
}

export function updateCategory(id: string, payload: CategoryPayload) {
  return apiPut<{ message?: string; category?: RawCategory }>(`/categories/${id}`, payload).then((response) => ({
    ...response,
    category: response.category ? normalizeCategory(response.category) : undefined
  }));
}

export function deleteCategory(id: string) {
  return apiDelete<{ message?: string }>(`/categories/${id}`);
}
