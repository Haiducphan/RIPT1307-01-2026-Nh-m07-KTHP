import { useEffect, useState } from 'react';
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  message
} from 'antd';
import DeviceStatusTag from '@/components/DeviceStatusTag';
import PageTitle from '@/components/PageTitle';
import { DEVICE_STATUS_LABEL } from '@/constants/deviceStatus';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createDevice, deleteDevice, getDevices, updateDevice } from '@/services/devices';
import { getErrorMessage } from '@/services/http';
import type { Device, DeviceStatus } from '@/types';

const STATUS_OPTIONS: { label: string; value: DeviceStatus }[] = (
  Object.entries(DEVICE_STATUS_LABEL) as [DeviceStatus, string][]
).map(([value, label]) => ({ value, label }));

interface DeviceFormValues {
  name: string;
  category: string;
  totalQuantity: number;
  status: DeviceStatus;
  description?: string;
}

export default function AdminDevicesPage() {
  const { data, loading, refresh } = useAsyncData(getDevices);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<DeviceFormValues>();

  useEffect(() => {
    if (!modalOpen) {
      return;
    }

    if (editingDevice) {
      form.setFieldsValue({
        name: editingDevice.name,
        category: editingDevice.category,
        totalQuantity: editingDevice.totalQuantity,
        status: editingDevice.status,
        description: editingDevice.description
      });
      return;
    }

    form.resetFields();
    form.setFieldsValue({ status: 'available', totalQuantity: 1 });
  }, [modalOpen, editingDevice, form]);

  const openCreateModal = () => {
    setEditingDevice(null);
    setModalOpen(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingDevice(null);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      if (editingDevice) {
        await updateDevice(editingDevice.id, values);
        message.success('Da cap nhat thiet bi');
      } else {
        await createDevice({
          ...values,
          availableQuantity: values.totalQuantity
        });
        message.success('Da them thiet bi');
      }

      closeModal();
      await refresh();
    } catch (error) {
      const fallback = editingDevice ? 'Cap nhat that bai' : 'Them thiet bi that bai';
      message.error(getErrorMessage(error, fallback));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDevice(id);
      message.success('Da xoa thiet bi');
      await refresh();
    } catch (error) {
      message.error(getErrorMessage(error, 'Xoa thiet bi that bai'));
    }
  };

  return (
    <>
      <div className="page-toolbar">
        <PageTitle title="Quan ly kho thiet bi" description="Them, sua, xoa va cap nhat so luong ton kho." />
        <Button type="primary" onClick={openCreateModal}>
          Them thiet bi
        </Button>
      </div>
      <Card>
        <Table<Device>
          rowKey="id"
          loading={loading}
          dataSource={data || []}
          columns={[
            { title: 'Ten thiet bi', dataIndex: 'name' },
            { title: 'Loai', dataIndex: 'category' },
            { title: 'Tong so', dataIndex: 'totalQuantity' },
            { title: 'Con lai', dataIndex: 'availableQuantity' },
            {
              title: 'Tinh trang',
              dataIndex: 'status',
              render: (status: Device['status']) => <DeviceStatusTag status={status} />
            },
            {
              title: 'Thao tac',
              render: (_, record) => (
                <Space>
                  <Button size="small" onClick={() => openEditModal(record)}>
                    Sua
                  </Button>
                  <Popconfirm
                    title="Xoa thiet bi nay?"
                    description="Thiet bi se bi xoa khoi danh sach."
                    okText="Xoa"
                    cancelText="Huy"
                    onConfirm={() => handleDelete(record.id)}
                  >
                    <Button size="small" danger>
                      Xoa
                    </Button>
                  </Popconfirm>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editingDevice ? 'Sua thiet bi' : 'Them thiet bi'}
        open={modalOpen}
        onCancel={closeModal}
        footer={[
          <Button key="cancel" onClick={closeModal}>
            Huy
          </Button>,
          <Button key="submit" type="primary" loading={submitting} onClick={() => void handleSubmit()}>
            {editingDevice ? 'Luu' : 'Them'}
          </Button>
        ]}
        destroyOnClose
      >
        <Form form={form} layout="vertical" preserve={false} style={{ marginTop: 16 }}>
          <Form.Item name="name" label="Ten thiet bi" rules={[{ required: true, message: 'Nhap ten thiet bi' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="category" label="Loai" rules={[{ required: true, message: 'Nhap loai thiet bi' }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="totalQuantity"
            label="Tong so luong"
            rules={[{ required: true, message: 'Nhap so luong' }]}
          >
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="status" label="Tinh trang" rules={[{ required: true }]}>
            <Select options={STATUS_OPTIONS} />
          </Form.Item>
          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
