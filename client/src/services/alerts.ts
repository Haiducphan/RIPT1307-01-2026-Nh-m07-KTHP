import { apiGet, apiPut } from './http';

type RawRecord = Record<string, unknown>;

export interface EmailTemplateRecord {
  id: string;
  code: string;
  name: string;
  subject: string;
  body: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface SystemSettingRecord {
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedAt?: string;
}

interface ApiDataResponse<T> {
  data?: T;
  message?: string;
}

function asRecord(value: unknown): RawRecord {
  return value && typeof value === 'object' ? (value as RawRecord) : {};
}

function toStringValue(value: unknown) {
  return typeof value === 'string' ? value : value === undefined || value === null ? undefined : String(value);
}

function toBooleanValue(value: unknown) {
  return value === true || value === 'true' || value === 1 || value === '1';
}

function normalizeEmailTemplate(raw: unknown): EmailTemplateRecord {
  const record = asRecord(raw);

  return {
    id: String(record.id ?? ''),
    code: toStringValue(record.code) ?? '',
    name: toStringValue(record.name) ?? 'Mẫu email',
    subject: toStringValue(record.subject) ?? '',
    body: toStringValue(record.body) ?? '',
    isActive: toBooleanValue(record.isActive ?? record.is_active ?? true),
    updatedAt: toStringValue(record.updatedAt ?? record.updated_at)
  };
}

function normalizeSystemSetting(raw: unknown): SystemSettingRecord {
  const record = asRecord(raw);

  return {
    settingKey: toStringValue(record.settingKey ?? record.setting_key) ?? '',
    settingValue: toStringValue(record.settingValue ?? record.setting_value) ?? '',
    description: toStringValue(record.description),
    updatedAt: toStringValue(record.updatedAt ?? record.updated_at)
  };
}

export function getEmailTemplates() {
  return apiGet<ApiDataResponse<unknown[]> | unknown[]>('/email-templates').then((response) => {
    const rows = Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : [];
    return rows.map(normalizeEmailTemplate);
  });
}

export function updateEmailTemplate(id: string, payload: { subject: string; body: string }) {
  return apiPut<ApiDataResponse<unknown>>(`/email-templates/${id}`, payload).then((response) => ({
    message: response.message,
    template: normalizeEmailTemplate(response.data)
  }));
}

export function getSystemSettings() {
  return apiGet<ApiDataResponse<unknown[]> | unknown[]>('/settings').then((response) => {
    const rows = Array.isArray(response) ? response : Array.isArray(response.data) ? response.data : [];
    return rows.map(normalizeSystemSetting);
  });
}

export function updateSystemSetting(settingKey: string, settingValue: string) {
  return apiPut<ApiDataResponse<unknown>>(`/settings/${encodeURIComponent(settingKey)}`, { settingValue }).then((response) => ({
    message: response.message,
    setting: normalizeSystemSetting(response.data)
  }));
}
