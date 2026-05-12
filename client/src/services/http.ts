import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || '/api';

const http = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

export function apiGet<T>(url: string) {
  return http.get<T>(url).then((response) => response.data);
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
