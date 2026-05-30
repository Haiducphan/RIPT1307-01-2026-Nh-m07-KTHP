import { apiGet, apiPatch, apiPost } from './http';
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
  };
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
  returnDate?: string;
  return_date?: string;
  purpose?: string;
  note?: string;
  eventName?: string;
  event_name?: string;
  status?: BorrowRequest['status'] | string | null;
  createdAt?: string;
  created_at?: string;
}

interface BorrowRequestsResponse {
  data?: RawBorrowRequest[];
}

export interface NormalizedBorrowRequest extends BorrowRequest {
  requestCode: string;
  studentCode: string;
  purpose: string;
  eventName: string;
  createdAt?: string;
}

function normalizeBorrowRequest(raw: RawBorrowRequest): NormalizedBorrowRequest {
  const id = String(raw.id ?? '');
  const deviceId = String(raw.deviceId ?? raw.equipmentId ?? raw.equipment_id ?? '');
  const purpose = raw.purpose ?? raw.note ?? '';
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
    requestCode: raw.requestCode ?? raw.request_code ?? `REQ-${id}`,
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
    borrowDate: raw.borrowDate ?? raw.borrow_date ?? '',
    returnDate: raw.returnDate ?? raw.return_date ?? '',
    purpose,
    note: purpose,
    eventName: raw.eventName ?? raw.event_name ?? '',
    status: (raw.status || 'pending') as BorrowRequest['status'],
    createdAt: raw.createdAt ?? raw.created_at
  };
}

export function getBorrowRequests() {
  return apiGet<RawBorrowRequest[] | BorrowRequestsResponse>('/borrow-requests').then((response) => {
    const requests = Array.isArray(response) ? response : response.data ?? [];
    return requests.map(normalizeBorrowRequest);
  });
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
