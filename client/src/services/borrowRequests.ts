import { apiGet, apiPatch, apiPost } from './http';
import type { BorrowRequest } from '@/types';

export interface CreateBorrowRequestPayload {
  deviceId: string;
  quantity: number;
  borrowDate: string;
  returnDate: string;
  note?: string;
}

export function getBorrowRequests() {
  return apiGet<BorrowRequest[]>('/borrow-requests');
}

export function getMyBorrowRequests() {
  return apiGet<BorrowRequest[]>('/borrow-requests/my');
}

export function createBorrowRequest(payload: CreateBorrowRequestPayload) {
  return apiPost<BorrowRequest>('/borrow-requests', payload);
}

export function approveBorrowRequest(id: string) {
  return apiPatch<BorrowRequest>(`/borrow-requests/${id}/approve`);
}

export function rejectBorrowRequest(id: string) {
  return apiPatch<BorrowRequest>(`/borrow-requests/${id}/reject`);
}

export function markReturned(id: string) {
  return apiPatch<BorrowRequest>(`/borrow-requests/${id}/return`);
}
