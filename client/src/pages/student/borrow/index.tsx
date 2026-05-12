import { Button, Card, DatePicker, Form, Input, InputNumber, message, Select } from 'antd';
import type { Dayjs } from 'dayjs';
import PageTitle from '@/components/PageTitle';
import { useAsyncData } from '@/hooks/useAsyncData';
import { createBorrowRequest } from '@/services/borrowRequests';
import { getDevices } from '@/services/devices';

interface BorrowFormValues {
  deviceId: string;
  quantity: number;
  dateRange: [Dayjs, Dayjs];
  note?: string;
}

export default function StudentBorrowPage() {
  const { data: devices } = useAsyncData(getDevices);

  const handleSubmit = async (values: BorrowFormValues) => {
    const [borrowDate, returnDate] = values.dateRange;
    await createBorrowRequest({
      deviceId: values.deviceId,
      quantity: values.quantity,
      borrowDate: borrowDate.format('YYYY-MM-DD'),
      returnDate: returnDate.format('YYYY-MM-DD'),
      note: values.note
    });
    message.success('Da gui yeu cau muon');
  };

  return (
    <>
      <PageTitle title="Gui yeu cau muon" description="Chon thiet bi, so luong va thoi gian muon tra." />
      <Card>
        <Form layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 640 }}>
          <Form.Item name="deviceId" label="Thiet bi" rules={[{ required: true }]}>
            <Select
              options={(devices || []).map((device) => ({
                value: device.id,
                label: `${device.name} - con ${device.availableQuantity}`
              }))}
            />
          </Form.Item>
          <Form.Item name="quantity" label="So luong" rules={[{ required: true }]}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="dateRange" label="Ngay muon - tra" rules={[{ required: true }]}>
            <DatePicker.RangePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="note" label="Ghi chu">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit">
            Gui yeu cau
          </Button>
        </Form>
      </Card>
    </>
  );
}
