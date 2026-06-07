import { Button, Card, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, message } from 'antd';
import { useState } from 'react';
import PageTitle from '@/components/PageTitle';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createDevice, deleteDevice, getDevices, updateDevice } from '@/services/equipment';
import type { Device } from '@/types';

export default function AdminDevicesPage() {
  const { data, loading, refresh } = useAsyncData(getDevices);
  const devices = data?.data ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const openAdd = () => {
    setEditingDevice(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (device: Device) => {
    setEditingDevice(device);
    form.setFieldsValue(device);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteDevice(id);
    message.success('Da xoa thiet bi');
    void refresh();
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSubmitting(true);
    try {
      if (editingDevice) {
        await updateDevice(String(editingDevice.id), values);
        message.success('Da cap nhat thiet bi');
      } else {
        await createDevice(values);
        message.success('Da them thiet bi');
      }
      setModalOpen(false);
      void refresh();
    } catch {
      message.error('Co loi xay ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="page-toolbar">
        <PageTitle title="Quan ly kho thiet bi" description="Them, sua, xoa va cap nhat so luong ton kho." />
        <Button type="primary" onClick={openAdd}>Them thiet bi</Button>
      </div>
      <Card>
        <Table<Device>
          rowKey="id"
          loading={loading}
          dataSource={devices}
          columns={[
            { title: 'Ma', dataIndex: 'code' },
            { title: 'Ten thiet bi', dataIndex: 'name' },
            { title: 'Hang', dataIndex: 'tier' },
            { title: 'Tong so', dataIndex: 'totalQuantity' },
            { title: 'Con lai', dataIndex: 'availableQuantity' },
            { title: 'Dang muon', dataIndex: 'borrowingQuantity' },
            {
              title: 'Tinh trang',
              dataIndex: 'conditionStatus',
              render: (val: string) => (
                <Tag color={val === 'good' ? 'green' : val === 'fair' ? 'orange' : 'red'}>{val}</Tag>
              )
            },
            {
              title: 'Thao tac',
              render: (_, record) => (
                <Space>
                  <Button size="small" onClick={() => openEdit(record)}>Sua</Button>
                  <Button size="small" danger onClick={() => handleDelete(String(record.id))}>Xoa</Button>
                </Space>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title={editingDevice ? 'Sua thiet bi' : 'Them thiet bi'}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        okText={editingDevice ? 'Cap nhat' : 'Them'}
        cancelText="Huy"
      >
        <Form form={form} layout="vertical">
          <Form.Item name="code" label="Ma thiet bi" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="Ten thiet bi" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Mo ta">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="tier" label="Hang" rules={[{ required: true }]}>
            <Select options={[
              { label: 'Hang S', value: 'S' },
              { label: 'Hang A', value: 'A' },
              { label: 'Hang B', value: 'B' },
              { label: 'Hang C', value: 'C' },
            ]} />
          </Form.Item>
          <Form.Item name="totalQuantity" label="Tong so luong" rules={[{ required: true }]}>
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="conditionStatus" label="Tinh trang" rules={[{ required: true }]}>