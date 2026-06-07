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
  | 'canceled'
  | 'cancelled_noshow';

export type DeviceStatus = 'available' | 'unavailable' | 'maintenance';

export interface DeviceImage {
  id?: string;
  url: string;
  isPrimary?: boolean;
  sortOrder?: number;
}

export interface User {
  id: string | number;
  fullName: string;
  name?: string;
  email: string;
  role: UserRole;
  studentCode?: string;
  className?: string;
  phone?: string;
  token?: string;
  avatar?: string;
  avatarUrl?: string;
  studentId?: string | number;
  trustScore?: number;
  trustRank?: 'diamond' | 'gold' | 'silver' | 'bronze' | 'stone' | string;
  goodReturnStreak?: number;
  borrowLocked?: boolean;
  borrowLockUntil?: string;
  borrowLockReason?: string;
  isPermanentlyLocked?: boolean;
  permanentLockReason?: string;
}

export interface Device {
  id: string;
  code?: string;
  name: string;
  categoryId?: number;
  category: string;
  tier?: string;
  totalQuantity: number;
  availableQuantity: number;
  borrowingQuantity?: number;
  brokenQuantity?: number;
  conditionStatus?: string;
  isActive?: boolean;
  status: DeviceStatus;
  description?: string;
  image?: string;
  images?: string[];
  imageItems?: DeviceImage[];
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
