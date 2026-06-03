import { apiGet } from './http';

type RawRecord = Record<string, unknown>;

export interface TopDeviceStat {
  equipmentId: string;
  name: string;
  code?: string;
  availableQuantity: number;
  totalBorrows: number;
}

export interface DeviceStats {
  totalDeviceTypes: number;
  sumTotal: number;
  sumBorrowing: number;
  topDevices: TopDeviceStat[];
}

export interface RequestStats {
  totalRequests: number;
  approvedCount: number;
  rejectedCount: number;
  pendingCount?: number;
  borrowingCount?: number;
  overdueCount?: number;
}

export interface TopStudentStat {
  id: string;
  fullName: string;
  studentCode: string;
  trustScore: number;
  totalBorrowed: number;
  totalLate: number;
}

export interface StudentStatsSummary {
  totalStudents: number;
  currentlyBorrowing: number;
  topStudents: TopStudentStat[];
}

export interface TimeTrendStat {
  month: number;
  year: number;
  totalRequests: number;
}

interface ApiDataResponse<T> {
  data?: T;
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

function buildMonthQuery(params?: { month?: number; year?: number }) {
  const query = new URLSearchParams();
  if (params?.month) query.set('month', String(params.month));
  if (params?.year) query.set('year', String(params.year));
  const value = query.toString();
  return value ? `?${value}` : '';
}

function normalizeTopDevice(raw: unknown): TopDeviceStat {
  const record = asRecord(raw);
  const equipment = asRecord(record.equipment);

  return {
    equipmentId: String(record.equipmentId ?? record.equipment_id ?? equipment.id ?? ''),
    name: toStringValue(record.name ?? equipment.name) ?? 'Chưa có tên thiết bị',
    code: toStringValue(record.code ?? equipment.code),
    availableQuantity: toNumberValue(record.availableQuantity ?? record.available_quantity ?? equipment.availableQuantity ?? equipment.available_quantity),
    totalBorrows: toNumberValue(record.totalBorrows ?? record.total_borrows ?? record.borrowCount ?? record.borrow_count)
  };
}

function normalizeTopStudent(raw: unknown): TopStudentStat {
  const record = asRecord(raw);

  return {
    id: String(record.id ?? ''),
    fullName: toStringValue(record.fullName ?? record.full_name ?? record.name) ?? 'Chưa có tên',
    studentCode: toStringValue(record.studentCode ?? record.student_code ?? record.mssv) ?? 'Chưa có MSSV',
    trustScore: toNumberValue(record.trustScore ?? record.trust_score),
    totalBorrowed: toNumberValue(record.totalBorrowed ?? record.total_borrowed),
    totalLate: toNumberValue(record.totalLate ?? record.total_late)
  };
}

function normalizeTimeTrend(raw: unknown): TimeTrendStat {
  const record = asRecord(raw);

  return {
    month: toNumberValue(record.month),
    year: toNumberValue(record.year),
    totalRequests: toNumberValue(record.totalRequests ?? record.total_requests)
  };
}

function getNestedNumber(data: RawRecord, keys: string[]) {
  const nestedSources = [
    data,
    asRecord(data.statusCounts),
    asRecord(data.status_counts),
    asRecord(data.byStatus),
    asRecord(data.by_status),
    asRecord(data.counts)
  ];

  for (const source of nestedSources) {
    for (const key of keys) {
      const value = toOptionalNumberValue(source[key]);
      if (value !== undefined) return value;
    }
  }

  return undefined;
}

export function getDeviceStats(params?: { month?: number; year?: number }) {
  return apiGet<ApiDataResponse<RawRecord>>(`/stats/devices${buildMonthQuery(params)}`).then((response) => {
    const data = asRecord(response.data);
    return {
      totalDeviceTypes: toNumberValue(data.totalDeviceTypes ?? data.total_device_types),
      sumTotal: toNumberValue(data.sumTotal ?? data.sum_total),
      sumBorrowing: toNumberValue(data.sumBorrowing ?? data.sum_borrowing),
      topDevices: Array.isArray(data.topDevices) ? data.topDevices.map(normalizeTopDevice) : []
    } satisfies DeviceStats;
  });
}

export function getRequestStats(params?: { month?: number; year?: number }) {
  return apiGet<ApiDataResponse<RawRecord>>(`/stats/requests${buildMonthQuery(params)}`).then((response) => {
    const data = asRecord(response.data);
    return {
      totalRequests: toNumberValue(data.totalRequests ?? data.total_requests),
      approvedCount: toNumberValue(data.approvedCount ?? data.approved_count),
      rejectedCount: toNumberValue(data.rejectedCount ?? data.rejected_count),
      pendingCount: getNestedNumber(data, ['pendingCount', 'pending_count', 'pendingRequests', 'pending_requests', 'pending']),
      borrowingCount: getNestedNumber(data, ['borrowingCount', 'borrowing_count', 'borrowingRequests', 'borrowing_requests', 'borrowing', 'borrowed']),
      overdueCount: getNestedNumber(data, ['overdueCount', 'overdue_count', 'overdueRequests', 'overdue_requests', 'overdue'])
    } satisfies RequestStats;
  });
}

export function getStatsStudentSummary() {
  return apiGet<ApiDataResponse<RawRecord>>('/stats/students').then((response) => {
    const data = asRecord(response.data);
    return {
      totalStudents: toNumberValue(data.totalStudents ?? data.total_students),
      currentlyBorrowing: toNumberValue(data.currentlyBorrowing ?? data.currently_borrowing),
      topStudents: Array.isArray(data.topStudents) ? data.topStudents.map(normalizeTopStudent) : []
    } satisfies StudentStatsSummary;
  });
}

export function getTimeTrendStats() {
  return apiGet<ApiDataResponse<unknown[]> | unknown[]>('/stats/time-trend').then((response) => {
    const rows = Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : [];
    return rows.map(normalizeTimeTrend);
  });
}
