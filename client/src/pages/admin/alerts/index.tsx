import { useState } from 'react';
import { Button, Empty, Form, Input, message, Modal, Table, Tabs, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getEmailTemplates,
  getSystemSettings,
  updateEmailTemplate,
  updateSystemSetting
} from '@/services/alerts';
import type { EmailTemplateRecord, SystemSettingRecord } from '@/services/alerts';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';

interface TemplateFormValues {
  subject: string;
  body: string;
}

interface SettingFormValues {
  settingValue: string;
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa có dữ liệu';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : value;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
}

export default function AdminAlertsPage() {
  const [templateForm] = Form.useForm<TemplateFormValues>();
  const [settingForm] = Form.useForm<SettingFormValues>();
  const { data: templates = [], loading: templatesLoading, error: templatesError, refresh: refreshTemplates } = useAsyncData(getEmailTemplates, []);
  const { data: settings = [], loading: settingsLoading, error: settingsError, refresh: refreshSettings } = useAsyncData(getSystemSettings, []);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplateRecord>();
  const [editingSetting, setEditingSetting] = useState<SystemSettingRecord>();
  const [saving, setSaving] = useState(false);

  const openTemplateModal = (template: EmailTemplateRecord) => {
    setEditingTemplate(template);
    templateForm.setFieldsValue({ subject: template.subject, body: template.body });
  };

  const openSettingModal = (setting: SystemSettingRecord) => {
    setEditingSetting(setting);
    settingForm.setFieldsValue({ settingValue: setting.settingValue });
  };

  const handleTemplateSubmit = async (values: TemplateFormValues) => {
    if (!editingTemplate) return;

    setSaving(true);
    try {
      const response = await updateEmailTemplate(editingTemplate.id, values);
      await refreshTemplates();
      message.success(response.message || 'Đã cập nhật mẫu email');
      setEditingTemplate(undefined);
      templateForm.resetFields();
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể cập nhật mẫu email'), 3);
    } finally {
      setSaving(false);
    }
  };

  const handleSettingSubmit = async (values: SettingFormValues) => {
    if (!editingSetting) return;

    setSaving(true);
    try {
      const response = await updateSystemSetting(editingSetting.settingKey, values.settingValue);
      await refreshSettings();
      message.success(response.message || 'Đã cập nhật cấu hình');
      setEditingSetting(undefined);
      settingForm.resetFields();
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể cập nhật cấu hình'), 3);
    } finally {
      setSaving(false);
    }
  };

  const apiMissingText = (
    <Empty
      description={
        <div>
          <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chưa có dữ liệu cấu hình</h3>
          <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>Không thể tải dữ liệu cảnh báo tại thời điểm này.</p>
        </div>
      }
      style={{ padding: '56px 0' }}
    />
  );

  return (
    <div style={{ paddingBottom: 48 }}>
      <AdminPageHeader
        title="Cảnh báo & mẫu thông báo"
        description="Quản lý mẫu email và cấu hình thông báo của hệ thống"
      />

      <Tabs
        size="large"
        items={[
          {
            key: 'templates',
            label: 'Mẫu email',
            children: (
              <AdminTableCard>
                {templatesError ? (
                  apiMissingText
                ) : (
                  <Table<EmailTemplateRecord>
                    rowKey="id"
                    loading={templatesLoading}
                    dataSource={templates}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 860 }}
                    locale={{ emptyText: <Empty description="Chưa có dữ liệu mẫu email" /> }}
                    columns={[
                      {
                        title: 'Mẫu',
                        render: (_, template) => (
                          <div>
                            <Typography.Text strong>{template.name}</Typography.Text>
                            <div style={{ color: '#8A8E88', fontSize: 12 }}>{template.code || 'Chưa có mã mẫu'}</div>
                          </div>
                        )
                      },
                      { title: 'Tiêu đề', dataIndex: 'subject', ellipsis: true },
                      {
                        title: 'Trạng thái',
                        render: (_, template) => (
                          <Tag style={{ border: 'none', borderRadius: 999, color: template.isActive ? '#2F6F3E' : '#6B6F6C', background: template.isActive ? '#E1EFE3' : '#ECEEF2', fontWeight: 700 }}>
                            {template.isActive ? 'Đang dùng' : 'Tắt'}
                          </Tag>
                        )
                      },
                      { title: 'Cập nhật', render: (_, template) => formatDateTime(template.updatedAt) },
                      {
                        title: 'Thao tác',
                        align: 'right',
                        render: (_, template) => <Button onClick={() => openTemplateModal(template)}>Sửa mẫu</Button>
                      }
                    ]}
                  />
                )}
              </AdminTableCard>
            )
          },
          {
            key: 'settings',
            label: 'Cấu hình gửi đi',
            children: (
              <AdminTableCard>
                {settingsError ? (
                  apiMissingText
                ) : (
                  <Table<SystemSettingRecord>
                    rowKey="settingKey"
                    loading={settingsLoading}
                    dataSource={settings}
                    pagination={{ pageSize: 8 }}
                    scroll={{ x: 760 }}
                    locale={{ emptyText: <Empty description="Chưa có dữ liệu cấu hình" /> }}
                    columns={[
                      {
                        title: 'Cấu hình',
                        render: (_, setting) => (
                          <div>
                            <Typography.Text strong>{setting.settingKey}</Typography.Text>
                            <div style={{ color: '#8A8E88', fontSize: 12 }}>{setting.description || 'Chưa có mô tả'}</div>
                          </div>
                        )
                      },
                      { title: 'Giá trị', dataIndex: 'settingValue' },
                      { title: 'Cập nhật', render: (_, setting) => formatDateTime(setting.updatedAt) },
                      {
                        title: 'Thao tác',
                        align: 'right',
                        render: (_, setting) => <Button onClick={() => openSettingModal(setting)}>Sửa cấu hình</Button>
                      }
                    ]}
                  />
                )}
              </AdminTableCard>
            )
          }
        ]}
      />

      <Modal
        title={editingTemplate ? `Sửa mẫu email: ${editingTemplate.name}` : 'Sửa mẫu email'}
        open={Boolean(editingTemplate)}
        okText="Lưu mẫu"
        cancelText="Huỷ"
        confirmLoading={saving}
        onOk={() => templateForm.submit()}
        onCancel={() => setEditingTemplate(undefined)}
      >
        <Form<TemplateFormValues> form={templateForm} layout="vertical" onFinish={handleTemplateSubmit}>
          <Form.Item name="subject" label="Tiêu đề" rules={[{ required: true, whitespace: true, message: 'Nhập tiêu đề email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label="Nội dung" rules={[{ required: true, whitespace: true, message: 'Nhập nội dung email' }]}>
            <Input.TextArea rows={8} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={editingSetting ? `Sửa cấu hình: ${editingSetting.settingKey}` : 'Sửa cấu hình'}
        open={Boolean(editingSetting)}
        okText="Lưu cấu hình"
        cancelText="Huỷ"
        confirmLoading={saving}
        onOk={() => settingForm.submit()}
        onCancel={() => setEditingSetting(undefined)}
      >
        <Form<SettingFormValues> form={settingForm} layout="vertical" onFinish={handleSettingSubmit}>
          <Form.Item name="settingValue" label="Giá trị" rules={[{ required: true, whitespace: true, message: 'Nhập giá trị cấu hình' }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
