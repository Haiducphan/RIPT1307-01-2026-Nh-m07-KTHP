import axios, { isAxiosError } from 'axios';
const API_BASE_URL = process.env.UMI_APP_API_BASE_URL || '/api';
const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header from stored user token (if available)
http.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('borrow_equipment_user');
    if (raw) {
      const user = JSON.parse(raw);
      if (user?.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${user.token}`;
      }
    }
  } catch (e) {
    // ignore
  }
  return config;
});

<<<<<<< HEAD
export function getErrorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.response?.status === 404) {
      return 'Khong tim thay du lieu';
    }
    if (!error.response) {
      return 'Khong ket noi duoc server. Hay chay backend (port 4000).';
    }
    return error.message || fallback;
  }
  return fallback;
}

export function apiGet<T>(url: string) {
  return http.get<T>(url).then((response) => response.data);
=======
export function apiGet<T>(url: string, config?: { params?: Record<string, unknown> }) {
  return http.get<T>(url, config).then((response) => response.data);
>>>>>>> feature/borrow-request-be1
}
export function apiPost<T>(url: string, data?: unknown) {
  return http.post<T>(url, data).then((response) => response.data);
}
export function apiPatch<T>(url: string, data?: unknown) {
  return http.patch<T>(url, data).then((response) => response.data);
}
export function apiPut<T>(url: string, data?: unknown) {
  return http.put<T>(url, data).then((response) => response.data);
}
export function apiDelete<T>(url: string) {
  return http.delete<T>(url).then((response) => response.data);
}