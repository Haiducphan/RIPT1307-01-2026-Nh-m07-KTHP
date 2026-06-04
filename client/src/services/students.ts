import { apiGet, apiPatch } from './http';

export type StudentRank = 'diamond' | 'gold' | 'silver' | 'bronze' | 'pebble';

export interface StudentRecord {
  id: string;
  userId?: string | number;
  fullName: string;
  studentCode: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
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
  currentBorrowing: number;
  overdueCount: number;
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
  requestCode?: string;
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

function toOptionalNumberValue(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
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

function deriveRankFromTrustScore(score: number): StudentRank {
  if (score >= 90) return 'diamond';
  if (score >= 80) return 'gold';
  if (score >= 66) return 'silver';
  if (score >= 50) return 'bronze';
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
  const student = asRecord(record.student ?? record.Student ?? record.profile);
  const user = asRecord(record.user ?? record.User ?? record.account ?? student.user ?? student.User);
  const status = toStringValue(record.status ?? record.accountStatus ?? record.account_status);
  const trustScore = toOptionalNumberValue(record.trustScore ?? record.trust_score ?? record.score ?? student.trustScore ?? student.trust_score ?? student.score);

  return {
    id: String(record.id ?? record.studentId ?? record.student_id ?? student.id ?? ''),
    userId: toStringValue(record.userId ?? record.user_id ?? student.userId ?? student.user_id ?? user.id),
    fullName: toStringValue(record.fullName ?? record.full_name ?? record.name ?? student.fullName ?? student.full_name ?? student.name ?? user.fullName ?? user.full_name ?? user.name) ?? 'Chưa có tên',
    studentCode: toStringValue(record.studentCode ?? record.student_code ?? record.code ?? record.mssv ?? student.studentCode ?? student.student_code ?? student.code ?? student.mssv) ?? 'Chưa có MSSV',
    email: toStringValue(record.email ?? record.userEmail ?? record.user_email ?? user.email ?? student.email),
    phone: toStringValue(record.phone ?? student.phone ?? user.phone),
    avatarUrl: toStringValue(record.avatarUrl ?? record.avatar_url ?? student.avatarUrl ?? student.avatar_url),
    className: toStringValue(record.className ?? record.class_name ?? record.class ?? record.studentClass ?? record.student_class ?? student.className ?? student.class_name ?? student.class ?? student.studentClass ?? student.student_class),
    trustScore: trustScore ?? 0,
    trustRank: trustScore !== undefined ? deriveRankFromTrustScore(trustScore) : normalizeRank(record.trustRank ?? record.trust_rank ?? record.rank ?? student.trustRank ?? student.trust_rank ?? student.rank),
    borrowLocked: toBooleanValue(record.borrowLocked ?? record.borrow_locked ?? student.borrowLocked ?? student.borrow_locked ?? status === 'locked'),
    borrowLockUntil: toStringValue(record.borrowLockUntil ?? record.borrow_lock_until ?? student.borrowLockUntil ?? student.borrow_lock_until),
    borrowLockReason: toStringValue(record.borrowLockReason ?? record.borrow_lock_reason ?? student.borrowLockReason ?? student.borrow_lock_reason),
    isPermanentlyLocked: toBooleanValue(record.isPermanentlyLocked ?? record.is_permanently_locked ?? student.isPermanentlyLocked ?? student.is_permanently_locked),
    permanentLockReason: toStringValue(record.permanentLockReason ?? record.permanent_lock_reason ?? student.permanentLockReason ?? student.permanent_lock_reason),
    goodReturnStreak: toNumberValue(record.goodReturnStreak ?? record.good_return_streak ?? student.goodReturnStreak ?? student.good_return_streak),
    totalBorrowed: toNumberValue(record.totalBorrowed ?? record.total_borrowed ?? record.totalBorrows ?? record.total_borrows ?? record.borrowCount ?? record.borrow_count ?? record.borrowedCount ?? record.borrowed_count ?? student.totalBorrowed ?? student.total_borrowed),
    totalLate: toNumberValue(record.totalLate ?? record.total_late ?? record.lateCount ?? record.late_count ?? student.totalLate ?? student.total_late),
    currentBorrowing: toNumberValue(record.currentBorrowing ?? record.current_borrowing ?? record.currentlyBorrowing ?? record.currently_borrowing ?? record.borrowingCount ?? record.borrowing_count ?? record.activeBorrowCount ?? record.active_borrow_count ?? student.currentBorrowing ?? student.current_borrowing),
    overdueCount: toNumberValue(record.overdueCount ?? record.overdue_count ?? record.currentOverdueCount ?? record.current_overdue_count ?? record.overdueBorrowCount ?? record.overdue_borrow_count ?? student.overdueCount ?? student.overdue_count),
    createdAt: toStringValue(record.createdAt ?? record.created_at ?? student.createdAt ?? student.created_at)
  };
}

function normalizeStudentList(response: StudentListResponse | unknown[]): StudentListResult {
  const students = extractStudentArray(response).map(normalizeStudent);
  const responseRecord = asRecord(response);
  const dataRecord = asRecord(responseRecord.data);

  return {
    students,
    totalItems: Array.isArray(response)
      ? students.length
      : toNumberValue(responseRecord.totalItems ?? responseRecord.total_items ?? responseRecord.total ?? dataRecord.totalItems ?? dataRecord.total_items ?? dataRecord.total, students.length),
    totalPages: Array.isArray(response) ? undefined : toOptionalNumberValue(responseRecord.totalPages ?? responseRecord.total_pages ?? dataRecord.totalPages ?? dataRecord.total_pages),
    currentPage: Array.isArray(response) ? undefined : toOptionalNumberValue(responseRecord.currentPage ?? responseRecord.current_page ?? dataRecord.currentPage ?? dataRecord.current_page),
    limit: Array.isArray(response) ? undefined : toOptionalNumberValue(responseRecord.limit ?? dataRecord.limit)
  };
}

function normalizeTrustScoreLog(raw: unknown): TrustScoreLogRecord {
  const record = asRecord(raw);
  const borrowRequest = asRecord(record.BorrowRequest ?? record.borrowRequest ?? record.borrow_request);

  return {
    id: String(record.id ?? ''),
    studentId: toStringValue(record.studentId ?? record.student_id),
    borrowRequestId: toStringValue(record.borrowRequestId ?? record.borrow_request_id),
    requestCode: toStringValue(record.requestCode ?? record.request_code ?? borrowRequest.requestCode ?? borrowRequest.request_code),
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

export function getMyTrustScoreLogs() {
  return apiGet<TrustScoreLogsResponse | unknown[]>('/students/me/trust-score-logs').then((response) => {
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
