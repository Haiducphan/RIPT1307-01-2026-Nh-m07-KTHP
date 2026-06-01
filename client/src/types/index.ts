export type UserRole = 'student' | 'admin';

export type BorrowStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'borrowed'
  | 'borrowing'
  | 'returned'
  | 'returned_ontime'
  | 'returned_late'
  | 'overdue'
  | 'cancelled'
  | 'cancelled_noshow';

export type DeviceStatus = 'available' | 'unavailable' | 'maintenance';

export interface User {
  id: string | number;
  fullName: string;
  name?: string;
  email: string;
  role: UserRole;
  token?: string;
  avatar?: string;
  avatarUrl?: string;
  trustScore?: number;
  trustRank?: 'diamond' | 'gold' | 'silver' | 'bronze' | 'stone' | string;
}

export interface Device {
  id: string;
  name: string;
  category: string;
  totalQuantity: number;
  availableQuantity: number;
  status: DeviceStatus;
  description?: string;
}

export interface BorrowRequest {
  id: string;
  studentId: string;
  studentName: string;
  deviceId: string;
  deviceName: string;
  quantity: number;
  borrowDate: string;
  returnDate: string;
  status: BorrowStatus;
  note?: string;
}

export interface StatisticItem {
  deviceId: string;
  deviceName: string;
  borrowCount: number;
}
