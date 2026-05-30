import { apiPost } from './http';
import type { User, UserRole } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterPayload {
  fullName: string;
  studentCode: string;
  email: string;
  phone?: string;
  password: string;
}

export interface AuthMessageResponse {
  message?: string;
}

export function login(payload: LoginPayload) {
  return apiPost<User>('/auth/login', payload);
}

export function register(payload: RegisterPayload) {
  return apiPost<AuthMessageResponse>('/auth/register', payload);
}

export function forgotPassword(email: string) {
  return apiPost<AuthMessageResponse>('/auth/forgot-password', { email });
}

export function resetPassword(token: string, newPassword: string) {
  return apiPost<AuthMessageResponse>('/auth/reset-password', { token, newPassword });
}
