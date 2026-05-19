import { apiPost } from './http';
import type { User, UserRole } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
}

export function login(payload: LoginPayload) {
  return apiPost<User>('/auth/login', payload);
}
