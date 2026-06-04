import { apiGet, apiPatch } from './http';

export type NotificationCategory = 'request' | 'trust' | 'system';

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  content: string;
  isRead: boolean;
  category: NotificationCategory;
  relatedRequestId?: string;
  createdAt?: string;
  readAt?: string;
}

interface NotificationsResponse {
  data?: unknown;
}

type RawRecord = Record<string, unknown>;

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {};
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : value === undefined || value === null ? undefined : String(value);
}

function toBooleanValue(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function getCategory(type: string): NotificationCategory {
  if (
    type === 'request_approved' ||
    type === 'request_rejected' ||
    type === 'pickup_reminder' ||
    type === 'return_reminder' ||
    type === 'overdue_warning' ||
    type === 'new_request'
  ) {
    return 'request';
  }

  if (
    type === 'trust_point_added' ||
    type === 'trust_point_deducted' ||
    type === 'streak_bonus' ||
    type === 'account_locked' ||
    type === 'tier_changed'
  ) {
    return 'trust';
  }

  return 'system';
}

function normalizeNotification(raw: unknown): NotificationItem {
  const record = asRecord(raw);
  const type = toStringValue(record.type) ?? 'system_announcement';
  const metadata = asRecord(record.metadata);
  const relatedRequestId = toStringValue(
    record.requestId ??
      record.request_id ??
      record.borrowRequestId ??
      record.borrow_request_id ??
      record.relatedRequestId ??
      record.related_request_id ??
      metadata.requestId ??
      metadata.request_id ??
      metadata.borrowRequestId ??
      metadata.borrow_request_id
  );

  return {
    id: String(record.id ?? ''),
    type,
    title: toStringValue(record.title) ?? 'Thông báo',
    content: toStringValue(record.message ?? record.content) ?? '',
    isRead: toBooleanValue(record.isRead ?? record.is_read),
    category: getCategory(type),
    relatedRequestId,
    createdAt: toStringValue(record.createdAt ?? record.created_at),
    readAt: toStringValue(record.readAt ?? record.read_at)
  };
}

function extractNotifications(response: NotificationsResponse | unknown[]) {
  if (Array.isArray(response)) return response;
  return Array.isArray(response.data) ? response.data : [];
}

export function getMyNotifications() {
  return apiGet<NotificationsResponse | unknown[]>('/notifications/my').then((response) =>
    extractNotifications(response).map(normalizeNotification)
  );
}

export function markNotificationRead(id: string) {
  return apiPatch<{ message?: string }>(`/notifications/${id}/read`);
}
