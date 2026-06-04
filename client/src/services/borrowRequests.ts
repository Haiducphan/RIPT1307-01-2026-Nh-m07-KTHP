import { apiGet, apiPatch, apiPost } from './http';
import { normalizeBorrowStatus } from '@/constants/borrowStatus';
import type { BorrowRequest } from '@/types';

export interface CreateBorrowRequestPayload {
  deviceId: string;
  quantity: number;
  borrowDate: string;
  returnDate: string;
  purpose?: string;
  note?: string;
}

interface RawBorrowRequest {
  id?: string | number;
  code?: string;
  requestCode?: string;
  request_code?: string;
  studentId?: string | number;
  student_id?: string | number;
  studentCode?: string;
  student_code?: string;
  studentName?: string;
  student?: {
    fullName?: string;
    full_name?: string;
    name?: string;
    studentCode?: string;
    student_code?: string;
    code?: string;
    mssv?: string;
    trustScore?: number | string;
    trust_score?: number | string;
    trustRank?: string;
    trust_rank?: string;
    rank?: string;
  };
  trustScore?: number | string;
  trust_score?: number | string;
  trustRank?: string;
  trust_rank?: string;
  rank?: string;
  deviceId?: string | number;
  equipmentId?: string | number;
  equipment_id?: string | number;
  deviceName?: string;
  equipmentName?: string;
  equipment?: { name?: string };
  device?: { name?: string };
  quantity?: number;
  borrowDate?: string;
  borrow_date?: string;
  startDate?: string;
  start_date?: string;
  returnDate?: string;
  return_date?: string;
  expectedReturnDate?: string;
  expected_return_date?: string;
  dueDate?: string;
  due_date?: string;
  purpose?: string;
  reason?: string;
  note?: string;
  eventName?: string;
  event_name?: string;
  rejectReason?: string;
  reject_reason?: string;
  rejectionReason?: string;
  rejection_reason?: string;
  status?: BorrowRequest['status'] | string | null;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
}

interface BorrowRequestsResponse {
  data?: RawBorrowRequest[];
  totalItems?: number;
  total?: number;
  count?: number;
}

export interface NormalizedBorrowRequest extends BorrowRequest {
  requestCode: string;
  studentCode: string;
  purpose: string;
  eventName: string;
  trustScore?: number;
  trustRank?: string;
  rejectReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

function toOptionalNumber(value: unknown) {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeBorrowRequest(raw: RawBorrowRequest): NormalizedBorrowRequest {
  const id = String(raw.id ?? '');
  const deviceId = String(raw.deviceId ?? raw.equipmentId ?? raw.equipment_id ?? '');
  const purpose = raw.purpose ?? raw.reason ?? raw.note ?? '';
  const studentCode =
    raw.studentCode ??
    raw.student_code ??
    raw.student?.studentCode ??
    raw.student?.student_code ??
    raw.student?.code ??
    raw.student?.mssv ??
    '';

  return {
    id,
    requestCode: raw.requestCode ?? raw.request_code ?? raw.code ?? `REQ-${id}`,
    studentId: String(raw.studentId ?? raw.student_id ?? ''),
    studentName:
      raw.studentName ??
      raw.student?.fullName ??
      raw.student?.full_name ??
      raw.student?.name ??
      `Sinh viên #${raw.student_id ?? raw.studentId ?? ''}`,
    studentCode,
    deviceId,
    deviceName:
      raw.deviceName ??
      raw.equipmentName ??
      raw.equipment?.name ??
      raw.device?.name ??
      `Thiết bị #${deviceId}`,
    quantity: raw.quantity ?? 1,
    borrowDate: raw.borrowDate ?? raw.borrow_date ?? raw.startDate ?? raw.start_date ?? '',
    returnDate: raw.returnDate ?? raw.return_date ?? raw.expectedReturnDate ?? raw.expected_return_date ?? raw.dueDate ?? raw.due_date ?? '',
    purpose,
    note: purpose,
    eventName: raw.eventName ?? raw.event_name ?? '',
    status: normalizeBorrowStatus(raw.status),
    trustScore: toOptionalNumber(raw.trustScore ?? raw.trust_score ?? raw.student?.trustScore ?? raw.student?.trust_score),
    trustRank: raw.trustRank ?? raw.trust_rank ?? raw.rank ?? raw.student?.trustRank ?? raw.student?.trust_rank ?? raw.student?.rank,
    rejectReason: raw.rejectReason ?? raw.reject_reason ?? raw.rejectionReason ?? raw.rejection_reason,
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at
  };
}

function buildBorrowRequestQuery(params?: { page?: number; limit?: number; status?: string }) {
  if (!params) return '';

  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.status) query.set('status', params.status);

  const value = query.toString();
  return value ? `?${value}` : '';
}

export function getBorrowRequests(params?: { page?: number; limit?: number; status?: string }) {
  return apiGet<RawBorrowRequest[] | BorrowRequestsResponse>(`/borrow-requests${buildBorrowRequestQuery(params)}`).then((response) => {
    const requests = Array.isArray(response) ? response : response.data ?? [];
    return requests.map(normalizeBorrowRequest);
  });
}

export async function getReturnableBorrowRequests() {
  const [borrowingRequests, overdueRequests] = await Promise.all([
    getBorrowRequests({ status: 'borrowing', page: 1, limit: 1000 }),
    getBorrowRequests({ status: 'overdue', page: 1, limit: 1000 })
  ]);
  const requestMap = new Map<string, NormalizedBorrowRequest>();

  [...borrowingRequests, ...overdueRequests].forEach((request) => {
    requestMap.set(request.id, request);
  });

  return Array.from(requestMap.values());
}

function getBorrowRequestCount(params?: { status?: string }) {
  return apiGet<BorrowRequestsResponse>(`/borrow-requests${buildBorrowRequestQuery({ ...params, page: 1, limit: 1 })}`).then((response) => {
    const fallbackCount = Array.isArray(response.data) ? response.data.length : 0;
    return Number(response.totalItems ?? response.total ?? response.count ?? fallbackCount);
  });
}

export async function getBorrowRequestStatusCounts() {
  const [pendingCount, borrowingCount, overdueCount] = await Promise.all([
    getBorrowRequestCount({ status: 'pending' }),
    getBorrowRequestCount({ status: 'borrowing' }),
    getBorrowRequestCount({ status: 'overdue' })
  ]);

  return { pendingCount, borrowingCount, overdueCount };
}

export function getMyBorrowRequests() {
  return apiGet<RawBorrowRequest[] | BorrowRequestsResponse>('/borrow-requests/my').then((response) => {
    const requests = Array.isArray(response) ? response : response.data ?? [];
    return requests.map(normalizeBorrowRequest);
  });
}

export function createBorrowRequest(payload: CreateBorrowRequestPayload) {
  return apiPost<BorrowRequest>('/borrow-requests', {
    deviceId: payload.deviceId,
    quantity: payload.quantity,
    borrowDate: payload.borrowDate,
    returnDate: payload.returnDate,
    purpose: payload.purpose ?? payload.note ?? ''
  });
}

export function approveBorrowRequest(id: string) {
  return apiPatch<BorrowRequest>(`/borrow-requests/${id}/approve`);
}

export function rejectBorrowRequest(id: string, reason?: string) {
  return apiPatch<BorrowRequest>(`/borrow-requests/${id}/reject`, { reason });
}

export function handoverBorrowRequest(id: string) {
  return apiPatch<BorrowRequest>(`/borrow-requests/${id}/handover`);
}

export function markReturned(id: string, payload: { returnCondition: string; damageNote?: string }) {
  return apiPatch<BorrowRequest>(`/borrow-requests/${id}/return`, payload);
}

export function cancelBorrowRequest(id: string) {
  return apiPatch<BorrowRequest>(`/borrow-requests/${id}/cancel`);
}
