import { apiGet, apiPatchForm, apiPost } from './http';
import type { User, UserRole } from '@/types';

const API_BASE_URL = process.env.UMI_APP_API_BASE_URL || '/api';

export interface LoginPayload {
  email: string;
  password: string;
  role?: UserRole;
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

export interface AvatarUploadResponse {
  message?: string;
  avatarUrl?: string;
  avatar?: string;
  data?: { avatarUrl?: string; avatar?: string };
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
  good_return_streak?: number;
  goodReturnStreak?: number;
  studentId?: string | number;
  student_id?: string | number;
  studentCode?: string;
  student_code?: string;
  className?: string;
  class_name?: string;
  phone?: string;
  borrowLocked?: boolean;
  borrow_locked?: boolean;
  borrowLockUntil?: string;
  borrow_lock_until?: string;
  borrowLockReason?: string;
  borrow_lock_reason?: string;
  isPermanentlyLocked?: boolean;
  is_permanently_locked?: boolean;
  permanentLockReason?: string;
  permanent_lock_reason?: string;
  student?: Partial<User> & {
    id?: string | number;
    studentId?: string | number;
    student_id?: string | number;
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
    goodReturnStreak?: number;
    good_return_streak?: number;
    studentCode?: string;
    student_code?: string;
    className?: string;
    class_name?: string;
    phone?: string;
    borrowLocked?: boolean;
    borrow_locked?: boolean;
    borrowLockUntil?: string;
    borrow_lock_until?: string;
    borrowLockReason?: string;
    borrow_lock_reason?: string;
    isPermanentlyLocked?: boolean;
    is_permanently_locked?: boolean;
    permanentLockReason?: string;
    permanent_lock_reason?: string;
  };
  data?: RawUser;
};

interface DemoAccount {
  email: string;
  password: string;
  label: string;
  user: User;
}

interface MeResponse {
  message?: string;
  data?: RawUser;
}

const DEMO_TOKEN_PREFIX = 'demo-token-';

function normalizeEnvValue(value?: string) {
  return value?.trim();
}

function createDemoAccount({
  email,
  password,
  role,
  index,
  name,
  studentCode,
  className,
  trustScore,
  trustRank
}: {
  email?: string;
  password?: string;
  role: UserRole;
  index: number;
  name?: string;
  studentCode?: string;
  className?: string;
  trustScore?: number;
  trustRank?: string;
}): DemoAccount | undefined {
  if (!email || !password) return undefined;

  const fallbackName = role === 'admin' ? 'Admin Demo' : `Sinh viên Demo ${index}`;
  const fullName = name || fallbackName;

  return {
    email,
    password,
    label: `${role === 'admin' ? 'Admin' : `Sinh viên ${index}`} dùng ${email} / ${password}`,
    user: {
      id: `demo-${role}-${index}`,
      studentId: role === 'student' ? `demo-student-${index}` : undefined,
      fullName,
      name: fullName,
      email,
      role,
      studentCode: role === 'student' ? studentCode || `DEMO${String(index).padStart(3, '0')}` : undefined,
      className: role === 'student' ? className || 'Demo' : undefined,
      token: `${DEMO_TOKEN_PREFIX}${role}-${index}`,
      trustScore: role === 'student' ? trustScore : undefined,
      trustRank: role === 'student' ? trustRank : undefined,
      goodReturnStreak: role === 'student' ? 0 : undefined,
      borrowLocked: role === 'student' ? false : undefined,
      isPermanentlyLocked: role === 'student' ? false : undefined
    }
  };
}

// FE-only demo fallback. It is disabled by default and only uses accounts provided through UMI_APP_DEMO_* env vars.
function getDemoAccounts() {
  if (!isDemoLoginEnabled()) return [];

  return [
    createDemoAccount({
      role: 'admin',
      index: 1,
      email: normalizeEnvValue(process.env.UMI_APP_DEMO_ADMIN_EMAIL),
      password: normalizeEnvValue(process.env.UMI_APP_DEMO_ADMIN_PASSWORD),
      name: normalizeEnvValue(process.env.UMI_APP_DEMO_ADMIN_NAME)
    }),
    createDemoAccount({
      role: 'student',
      index: 1,
      email: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT1_EMAIL),
      password: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT1_PASSWORD),
      name: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT1_NAME),
      studentCode: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT1_CODE),
      className: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT1_CLASS),
      trustScore: Number(normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT1_TRUST_SCORE) || 100),
      trustRank: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT1_TRUST_RANK) || 'diamond'
    }),
    createDemoAccount({
      role: 'student',
      index: 2,
      email: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT2_EMAIL),
      password: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT2_PASSWORD),
      name: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT2_NAME),
      studentCode: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT2_CODE),
      className: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT2_CLASS),
      trustScore: Number(normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT2_TRUST_SCORE) || 88),
      trustRank: normalizeEnvValue(process.env.UMI_APP_DEMO_STUDENT2_TRUST_RANK) || 'gold'
    })
  ].filter((account): account is DemoAccount => Boolean(account));
}

function getApiOrigin() {
  if (API_BASE_URL.startsWith('http://') || API_BASE_URL.startsWith('https://')) {
    try {
      return new URL(API_BASE_URL).origin;
    } catch {
      return '';
    }
  }

  return '';
}

export function normalizeUploadUrl(value?: string | null) {
  const rawUrl = value?.trim();
  if (!rawUrl) return undefined;

  if (/^(https?:|data:|blob:)/i.test(rawUrl)) return rawUrl;

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
    studentId: source.studentId ?? source.student_id ?? student?.studentId ?? student?.student_id ?? student?.id,
    studentCode: source.studentCode ?? source.student_code ?? student?.studentCode ?? student?.student_code,
    className: source.className ?? source.class_name ?? student?.className ?? student?.class_name,
    phone: source.phone ?? student?.phone,
    token: source.token,
    avatar: normalizeUploadUrl(source.avatar ?? source.avatarUrl ?? source.avatar_url ?? student?.avatar ?? student?.avatarUrl ?? student?.avatar_url),
    avatarUrl: normalizeUploadUrl(source.avatarUrl ?? source.avatar_url ?? source.avatar ?? student?.avatarUrl ?? student?.avatar_url ?? student?.avatar),
    trustScore: source.trustScore ?? source.trust_score ?? student?.trustScore ?? student?.trust_score,
    trustRank: source.trustRank ?? source.trust_rank ?? student?.trustRank ?? student?.trust_rank,
    goodReturnStreak: source.goodReturnStreak ?? source.good_return_streak ?? student?.goodReturnStreak ?? student?.good_return_streak,
    borrowLocked: source.borrowLocked ?? source.borrow_locked ?? student?.borrowLocked ?? student?.borrow_locked,
    borrowLockUntil: source.borrowLockUntil ?? source.borrow_lock_until ?? student?.borrowLockUntil ?? student?.borrow_lock_until,
    borrowLockReason: source.borrowLockReason ?? source.borrow_lock_reason ?? student?.borrowLockReason ?? student?.borrow_lock_reason,
    isPermanentlyLocked: source.isPermanentlyLocked ?? source.is_permanently_locked ?? student?.isPermanentlyLocked ?? student?.is_permanently_locked,
    permanentLockReason: source.permanentLockReason ?? source.permanent_lock_reason ?? student?.permanentLockReason ?? student?.permanent_lock_reason
  };
}

export function login(payload: LoginPayload) {
  return apiPost<RawUser>('/auth/login', payload).then(normalizeUser);
}

function findDemoAccount(payload: LoginPayload) {
  const email = payload.email.trim().toLowerCase();
  return getDemoAccounts().find((account) => account.email.toLowerCase() === email && account.password === payload.password);
}

export function isDemoLoginEnabled() {
  return process.env.UMI_APP_DEMO_MODE === 'true';
}

export function isDemoAuthUser(user?: User | null) {
  return Boolean(user?.token?.startsWith(DEMO_TOKEN_PREFIX));
}

export function getDemoLoginHint() {
  const demoAccounts = getDemoAccounts();
  if (demoAccounts.length === 0) return '';

  return `Bản demo frontend: ${demoAccounts.map((account) => account.label).join('. ')}.`;
}

export async function loginWithDemoFallback(payload: LoginPayload) {
  const demoAccount = isDemoLoginEnabled() ? findDemoAccount(payload) : undefined;
  if (demoAccount) return { ...demoAccount.user };

  return login(payload);
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

export function uploadMyAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  return apiPatchForm<AvatarUploadResponse>('/students/me/avatar', formData).then((response) => ({
    ...response,
    avatarUrl: normalizeUploadUrl(response.avatarUrl ?? response.avatar ?? response.data?.avatarUrl ?? response.data?.avatar)
  }));
}

export function uploadCurrentUserAvatar(file: File) {
  const formData = new FormData();
  formData.append('avatar', file);

  return apiPatchForm<AvatarUploadResponse>('/auth/me/avatar', formData).then((response) => ({
    ...response,
    avatarUrl: normalizeUploadUrl(response.avatarUrl ?? response.avatar ?? response.data?.avatarUrl ?? response.data?.avatar)
  }));
}
