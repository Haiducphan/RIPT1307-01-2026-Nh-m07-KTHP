import type { BorrowStatus } from '@/types';

export const BORROW_STATUS_LABEL = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt / Chờ bàn giao',
  rejected: 'Từ chối',
  borrowed: 'Đang mượn',
  borrowing: 'Đang mượn',
  returned: 'Đã trả',
  returned_ontime: 'Đã trả',
  returned_late: 'Đã trả trễ',
  overdue: 'Quá hạn',
  cancelled: 'Đã huỷ',
  canceled: 'Đã huỷ',
  cancelled_noshow: 'Đã huỷ'
} as const;

export const BORROW_STATUS_COLOR = {
  pending: 'gold',
  approved: 'blue',
  rejected: 'red',
  borrowed: 'processing',
  borrowing: 'processing',
  returned: 'green',
  returned_ontime: 'green',
  returned_late: 'orange',
  overdue: 'volcano',
  cancelled: 'default',
  canceled: 'default',
  cancelled_noshow: 'default'
} as const;

export function normalizeBorrowStatus(status?: string | null): BorrowStatus {
  if (status === 'borrowed') return 'borrowing';
  if (status === 'canceled') return 'cancelled';
  return (status || 'pending') as BorrowStatus;
}
