import { apiGet, apiPost } from './http';
import type { User } from '@/types';

export interface LoginPayload {
  email: string;
  password: string;
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

type RawUser = Partial<User> & {
  id?: string | number;
  name?: string;
  full_name?: string;
  avatar_url?: string;
  avatarUrl?: string;
  trust_score?: number;
  trustScore?: number;
  trust_rank?: string;
  trustRank?: string;
  student?: Partial<User> & {
    fullName?: string;
    full_name?: string;
    name?: string;
    avatar?: string;
    avatarUrl?: string;
    avatar_url?: string;
    trustScore?: number;
    trust_score?: number;
    trustRank?: string;
    trust_rank?: string;
  };
  data?: RawUser;
};

interface MeResponse {
  message?: string;
  data?: RawUser;
}

function normalizeUser(raw: RawUser): User {
  const source = raw.data ?? raw;
  const student = source.student;
  const fullName = source.fullName ?? source.full_name ?? source.name ?? student?.fullName ?? student?.full_name ?? student?.name ?? '';

  return {
    id: source.id ?? '',
    fullName,
    name: source.name ?? fullName,
    email: source.email ?? '',
    role: source.role ?? 'student',
    token: source.token,
    avatar: source.avatar ?? source.avatarUrl ?? source.avatar_url ?? student?.avatar ?? student?.avatarUrl ?? student?.avatar_url,
    avatarUrl: source.avatarUrl ?? source.avatar_url ?? source.avatar ?? student?.avatarUrl ?? student?.avatar_url ?? student?.avatar,
    trustScore: source.trustScore ?? source.trust_score ?? student?.trustScore ?? student?.trust_score,
    trustRank: source.trustRank ?? source.trust_rank ?? student?.trustRank ?? student?.trust_rank
  };
}

export function login(payload: LoginPayload) {
  return apiPost<RawUser>('/auth/login', payload).then(normalizeUser);
}

export function getMe() {
  return apiGet<MeResponse | RawUser>('/auth/me').then((response) => normalizeUser('data' in response && response.data ? response.data : (response as RawUser)));
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
