import { useState } from 'react';
import { Button, Col, Form, Input, InputNumber, message, Modal, Popconfirm, Row, Space, Table, Tag } from 'antd';
import { AppstoreOutlined, CheckCircleOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createCategory, deleteCategory, getCategories, updateCategory } from '@/services/categories';
import type { Category, CategoryPayload } from '@/services/categories';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import AdminTableCard from '@/components/admin/AdminTableCard';

interface CategoryFormValues {
  name: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}

export default function AdminCategoriesPage() {
  const [form] = Form.useForm<CategoryFormValues>();
  const { data: categories = [], loading, refresh } = useAsyncData(getCategories);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category>();
  const [saving, setSaving] = useState(false);

  const openCreateModal = () => {
    setEditingCategory(undefined);
    form.resetFields();
    form.setFieldsValue({ sortOrder: categories.length + 1 });
    setModalOpen(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description,
      icon: category.icon,
      sortOrder: category.sortOrder
    });
    setModalOpen(true);
  };

  const handleSave = async (values: CategoryFormValues) => {
    const payload: CategoryPayload = {
      name: values.name.trim(),
      description: values.description?.trim() || undefined,
      icon: values.icon?.trim() || undefined,
      sortOrder: values.sortOrder ?? 0
    };

    setSaving(true);
    try {
      const response = editingCategory
        ? await updateCategory(editingCategory.id, payload)
        : await createCategory(payload);

      message.success(response.message || (editingCategory ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục'), 2);
      setModalOpen(false);
      form.resetFields();
      await refresh();
    } catch (error) {
      message.error(getErrorMessage(error, editingCategory ? 'Không thể cập nhật danh mục' : 'Không thể thêm danh mục'), 3);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: Category) => {
    try {
      const response = await deleteCategory(category.id);
      message.success(response.message || 'Đã xoá danh mục', 2);
      await refresh();
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể xoá danh mục. Có thể danh mục đang được thiết bị sử dụng.'), 4);
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      <AdminPageHeader
        title="Danh mục thiết bị"
        description="Quản lý các loại thiết bị dùng trong kho."
        actions={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} style={{ background: '#2D4A3E', borderColor: '#2D4A3E' }}>
          Thêm danh mục
        </Button>
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Tổng danh mục" value={categories.length} meta="loại thiết bị" icon={<AppstoreOutlined />} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Có mô tả" value={categories.filter((item) => item.description?.trim()).length} meta="danh mục đã bổ sung thông tin" icon={<CheckCircleOutlined />} accent="#2F6F3E" />
        </Col>
      </Row>

      <AdminTableCard>
        <Table<Category>
          rowKey="id"
          loading={loading}
          dataSource={categories}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: (
              <AdminEmptyState
                title="Chưa có danh mục thiết bị"
                description="Thêm danh mục đầu tiên để phân loại thiết bị trong kho."
                icon="📁"
              >
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} style={{ background: '#2D4A3E', borderColor: '#2D4A3E' }}>
                  Thêm danh mục
                </Button>
              </AdminEmptyState>
            )
          }}
          columns={[
            {
              title: 'Tên danh mục',
              render: (_, category) => (
                <Space>
                  <span style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', background: '#F8F4EA', color: '#2D4A3E', fontWeight: 700 }}>
                    {category.icon || category.name.charAt(0).toUpperCase()}
                  </span>
                  <strong>{category.name}</strong>
                </Space>
              )
            },
            { title: 'Mô tả', dataIndex: 'description', render: (value?: string) => value || <span style={{ color: '#9A9D98' }}>Chưa có mô tả</span> },
            { title: 'Thứ tự', dataIndex: 'sortOrder', width: 110 },
            {
              title: 'Thao tác',
              align: 'right',
              render: (_, category) => (
                <Space>
                  <Button icon={<EditOutlined />} onClick={() => openEditModal(category)} />
                  <Popconfirm
                    title="Xoá danh mục?"
                    description="Không thể xoá nếu danh mục đang có thiết bị."
                    okText="Xoá"
                    cancelText="Huỷ"
                    okButtonProps={{ danger: true }}
                    onConfirm={() => handleDelete(category)}
                  >
                    <Button danger icon={<DeleteOutlined />} />
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </AdminTableCard>

      <Modal
        title={editingCategory ? 'Sửa danh mục' : 'Thêm danh mục'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        okText={editingCategory ? 'Cập nhật' : 'Thêm'}
        cancelText="Huỷ"
        confirmLoading={saving}
        onOk={() => form.submit()}
      >
        <Form<CategoryFormValues> form={form} layout="vertical" onFinish={handleSave}>
          <Form.Item name="name" label="Tên danh mục" rules={[{ required: true, whitespace: true, message: 'Nhập tên danh mục' }]}>
            <Input placeholder="VD: Âm thanh" />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea rows={3} placeholder="Mô tả ngắn về danh mục" />
          </Form.Item>
          <Form.Item name="icon" label="Ký hiệu">
            <Input placeholder="VD: audio, camera..." />
          </Form.Item>
          <Form.Item name="sortOrder" label="Thứ tự hiển thị">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
