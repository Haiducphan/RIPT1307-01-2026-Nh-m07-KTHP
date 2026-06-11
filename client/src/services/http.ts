import axios from 'axios';

const API_BASE_URL = process.env.UMI_APP_API_BASE_URL || '/api';
const AUTH_STORAGE_KEYS = ['borrow_equipment_user', 'auth-storage', 'user'];

type StoredRecord = Record<string, unknown>;

function asRecord(value: unknown): StoredRecord | undefined {
  return value !== null && typeof value === 'object' ? (value as StoredRecord) : undefined;
}

function getTokenFromStoredValue(value: unknown) {
  const parsed = asRecord(value);
  const state = asRecord(parsed?.state);
  const currentUser = asRecord(parsed?.currentUser);
  const stateCurrentUser = asRecord(state?.currentUser);
  const user = asRecord(parsed?.user);
  const candidates = [parsed?.token, stateCurrentUser?.token, currentUser?.token, user?.token];

  return candidates.find((token): token is string => typeof token === 'string' && token.length > 0);
}

function getStoredToken() {
  if (typeof window === 'undefined') return undefined;

  for (const key of AUTH_STORAGE_KEYS) {
    const storedValue = window.localStorage.getItem(key);
    if (!storedValue) continue;

    try {
      const token = getTokenFromStoredValue(JSON.parse(storedValue) as unknown);
      if (token) return token;
    } catch {
      // Ignore malformed legacy storage values and check the next supported key.
    }
  }

  return undefined;
}

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

http.interceptors.request.use((config) => {
  const token = getStoredToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export function apiGet<T>(url: string) {
  return http.get<T>(url).then((response) => response.data);
}

export function apiPost<T>(url: string, data?: unknown) {
  return http.post<T>(url, data).then((response) => response.data);
}

export function apiPostForm<T>(url: string, data: FormData) {
  return http
    .post<T>(url, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((response) => response.data);
}

export function apiPatch<T>(url: string, data?: unknown) {
  return http.patch<T>(url, data).then((response) => response.data);
}

export function apiPatchForm<T>(url: string, data: FormData) {
  return http
    .patch<T>(url, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((response) => response.data);
}

export function apiPut<T>(url: string, data?: unknown) {
  return http.put<T>(url, data).then((response) => response.data);
}

export function apiPutForm<T>(url: string, data: FormData) {
  return http
    .put<T>(url, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    .then((response) => response.data);
}

export function apiDelete<T>(url: string) {
  return http.delete<T>(url).then((response) => response.data);
}
