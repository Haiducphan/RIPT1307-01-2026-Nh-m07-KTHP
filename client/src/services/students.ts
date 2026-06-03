import { apiGet, apiPatch } from './http';

export type StudentRank = 'diamond' | 'gold' | 'silver' | 'bronze' | 'pebble';

export interface StudentRecord {
  id: string;
  userId?: string | number;
  fullName: string;
  studentCode: string;
  email?: string;
  phone?: string;
  className?: string;
  trustScore: number;
  trustRank: StudentRank;
  borrowLocked: boolean;
  borrowLockUntil?: string;
  borrowLockReason?: string;
  isPermanentlyLocked: boolean;
  permanentLockReason?: string;
  goodReturnStreak: number;
  totalBorrowed: number;
  totalLate: number;
  createdAt?: string;
}

export interface StudentListResult {
  students: StudentRecord[];
  totalItems: number;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
}

export interface StudentStats {
  totalStudents: number;
  currentlyBorrowing: number;
  topStudents: StudentRecord[];
}

export interface TrustScoreLogRecord {
  id: string;
  studentId?: string | number;
  borrowRequestId?: string | number;
  delta: number;
  scoreBefore: number;
  scoreAfter: number;
  rankBefore: StudentRank;
  rankAfter: StudentRank;
  reason: string;
  note?: string;
  createdBy?: string | number;
  createdAt?: string;
}

type RawRecord = Record<string, unknown>;

interface StudentListResponse {
  data?: unknown;
  rows?: unknown[];
  items?: unknown[];
  totalItems?: number;
  total_pages?: number;
  totalPages?: number;
  currentPage?: number;
  limit?: number;
}

interface StudentStatsResponse {
  data?: {
    totalStudents?: number;
    currentlyBorrowing?: number;
    topStudents?: unknown[];
  };
}

interface TrustScoreLogsResponse {
  data?: unknown;
}

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {};
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : value === undefined || value === null ? undefined : String(value);
}

function toNumberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toBooleanValue(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function normalizeRank(value: unknown): StudentRank {
  if (value === 'diamond' || value === 'gold' || value === 'silver' || value === 'bronze' || value === 'pebble') {
    return value;
  }

  if (value === 'stone') return 'pebble';
  return 'pebble';
}

function buildQuery(params?: { page?: number; limit?: number; search?: string }) {
  if (!params) return '';

  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search?.trim()) query.set('search', params.search.trim());

  const value = query.toString();
  return value ? `?${value}` : '';
}

function extractStudentArray(response: StudentListResponse | unknown[]): unknown[] {
  if (Array.isArray(response)) return response;

  const data = response.data;
  if (Array.isArray(data)) return data;

  const dataRecord = asRecord(data);
  if (Array.isArray(dataRecord.rows)) return dataRecord.rows;
  if (Array.isArray(dataRecord.items)) return dataRecord.items;

  if (Array.isArray(response.rows)) return response.rows;
  if (Array.isArray(response.items)) return response.items;

  return [];
}

export function normalizeStudent(raw: unknown): StudentRecord {
  const record = asRecord(raw);
  const user = asRecord(record.user);

  return {
    id: String(record.id ?? record.studentId ?? ''),
    userId: toStringValue(record.userId ?? record.user_id),
    fullName: toStringValue(record.fullName ?? record.full_name ?? record.name) ?? 'Chưa có tên',
    studentCode: toStringValue(record.studentCode ?? record.student_code ?? record.mssv) ?? 'Chưa có MSSV',
    email: toStringValue(record.email ?? user.email),
    phone: toStringValue(record.phone),
    className: toStringValue(record.className ?? record.class_name),
    trustScore: toNumberValue(record.trustScore ?? record.trust_score),
    trustRank: normalizeRank(record.trustRank ?? record.trust_rank),
    borrowLocked: toBooleanValue(record.borrowLocked ?? record.borrow_locked),
    borrowLockUntil: toStringValue(record.borrowLockUntil ?? record.borrow_lock_until),
    borrowLockReason: toStringValue(record.borrowLockReason ?? record.borrow_lock_reason),
    isPermanentlyLocked: toBooleanValue(record.isPermanentlyLocked ?? record.is_permanently_locked),
    permanentLockReason: toStringValue(record.permanentLockReason ?? record.permanent_lock_reason),
    goodReturnStreak: toNumberValue(record.goodReturnStreak ?? record.good_return_streak),
    totalBorrowed: toNumberValue(record.totalBorrowed ?? record.total_borrowed),
    totalLate: toNumberValue(record.totalLate ?? record.total_late),
    createdAt: toStringValue(record.createdAt ?? record.created_at)
  };
}

function normalizeStudentList(response: StudentListResponse | unknown[]): StudentListResult {
  const students = extractStudentArray(response).map(normalizeStudent);

  return {
    students,
    totalItems: Array.isArray(response) ? students.length : response.totalItems ?? students.length,
    totalPages: Array.isArray(response) ? undefined : response.totalPages ?? response.total_pages,
    currentPage: Array.isArray(response) ? undefined : response.currentPage,
    limit: Array.isArray(response) ? undefined : response.limit
  };
}

function normalizeTrustScoreLog(raw: unknown): TrustScoreLogRecord {
  const record = asRecord(raw);

  return {
    id: String(record.id ?? ''),
    studentId: toStringValue(record.studentId ?? record.student_id),
    borrowRequestId: toStringValue(record.borrowRequestId ?? record.borrow_request_id),
    delta: toNumberValue(record.delta),
    scoreBefore: toNumberValue(record.scoreBefore ?? record.score_before),
    scoreAfter: toNumberValue(record.scoreAfter ?? record.score_after),
    rankBefore: normalizeRank(record.rankBefore ?? record.rank_before),
    rankAfter: normalizeRank(record.rankAfter ?? record.rank_after),
    reason: toStringValue(record.reason) ?? 'unknown',
    note: toStringValue(record.note),
    createdBy: toStringValue(record.createdBy ?? record.created_by),
    createdAt: toStringValue(record.createdAt ?? record.created_at)
  };
}

export function getStudents(params?: { page?: number; limit?: number; search?: string }) {
  return apiGet<StudentListResponse | unknown[]>(`/students${buildQuery(params)}`).then(normalizeStudentList);
}

export function getStudentStats() {
  return apiGet<StudentStatsResponse>('/stats/students').then((response) => ({
    totalStudents: response.data?.totalStudents ?? 0,
    currentlyBorrowing: response.data?.currentlyBorrowing ?? 0,
    topStudents: (response.data?.topStudents ?? []).map(normalizeStudent)
  }));
}

export function getStudentTrustScoreLogs(studentId: string) {
  return apiGet<TrustScoreLogsResponse | unknown[]>(`/students/${studentId}/trust-score-logs`).then((response) => {
    const data = Array.isArray(response) ? response : response.data;
    return (Array.isArray(data) ? data : []).map(normalizeTrustScoreLog);
  });
}

export function restoreStudentTrustScore(studentId: string, payload: { pointsToAdd: number; reason: string }) {
  return apiPatch<{ message?: string; newScore?: number; newRank?: StudentRank }>(`/students/${studentId}/restore-score`, payload);
}

export function toggleStudentLock(
  studentId: string,
  payload: { isLocked: boolean; lockDays?: number; isPermanent?: boolean; reason?: string }
) {
  return apiPatch<{ message?: string; student?: unknown }>(`/students/${studentId}/toggle-lock`, payload);
}
