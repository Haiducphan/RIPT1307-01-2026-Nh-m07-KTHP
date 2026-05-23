import { useMemo } from 'react';
import { Alert, Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber, message, Row, Select, Spin, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { history, useLocation } from '@umijs/max';
import { createBorrowRequest } from '@/services/borrowRequests';

import { getDevices } from '@/services/equipment';

interface BorrowFormValues {
  borrowDate: Dayjs;
  returnDate: Dayjs;
  quantity: number;
  eventName: string;
  purpose: string;
}

const EVENT_OPTIONS = ['Đêm nhạc CLB tháng 5', 'Sự kiện khác', 'Học tập'];

const RANK_LABEL: Record<TrustRank, string> = {
  diamond: 'Kim cương',
  gold: 'Vàng',
  silver: 'Bạc',
  bronze: 'Đồng',
  stone: 'Đá'
};

const RANK_SCORE: Record<TrustRank, number> = {
  stone: 1,
  bronze: 2,
  silver: 3,
  gold: 4,
  diamond: 5
};

const REQUIRED_RANK_BY_TIER: Record<DeviceTier, TrustRank> = {
  S: 'gold',
  A: 'gold',
  B: 'silver',
  C: 'stone'
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function getDeviceIcon(device: Device) {
  const text = normalizeText(`${device.name} ${device.category}`);

  if (text.includes('micro')) return '🎤';
  if (text.includes('loa') || text.includes('am thanh')) return '🔊';
  if (text.includes('may chieu') || text.includes('trinh chieu')) return '📽️';
  if (text.includes('may anh') || text.includes('camera') || text.includes('canon') || text.includes('sony')) return '📷';
  if (text.includes('tripod') || text.includes('chan may')) return '🎬';
  if (text.includes('den') || text.includes('led')) return '💡';
  if (text.includes('tai nghe')) return '🎧';
  if (text.includes('mixer')) return '🎚️';
  return '📦';
}

function getDeviceTier(device: Device): DeviceTier {
  const text = normalizeText(`${device.name} ${device.category}`);

  if (text.includes('epson') || text.includes('canon') || text.includes('may chieu')) return 'S';
  if (text.includes('shure') || text.includes('jbl') || text.includes('mixer') || text.includes('micro')) return 'A';
  if (text.includes('tripod') || text.includes('den') || text.includes('loa')) return 'B';
  return 'C';
}

function getDeviceDescription(device: Device) {
  if (device.description?.trim()) return device.description;

  const text = normalizeText(`${device.name} ${device.category}`);

  if (text.includes('micro')) return 'Micro chuyên dụng cho sự kiện, thuyết trình và biểu diễn live.';
  if (text.includes('loa')) return 'Loa di động phục vụ sinh hoạt câu lạc bộ và sự kiện nhỏ.';
  if (text.includes('may chieu') || text.includes('trinh chieu')) return 'Thiết bị trình chiếu cho họp nhóm, workshop và thuyết trình.';
  if (text.includes('may anh') || text.includes('camera')) return 'Thiết bị ghi hình cho truyền thông, sự kiện và dự án học tập.';
  if (text.includes('tripod') || text.includes('chan may')) return 'Phụ kiện hỗ trợ quay chụp ổn định trong nhiều bối cảnh.';
  if (text.includes('den') || text.includes('led')) return 'Đèn hỗ trợ quay chụp trong không gian trong nhà.';
  return 'Thiết bị sẵn sàng cho sinh viên đăng ký mượn theo lịch sử dụng.';
}

function EmptyBorrowState() {
  return (
    <Empty
      description="Không tìm thấy thiết bị cần mượn"
      style={{ padding: '72px 0' }}
    >
      <Button type="link" onClick={() => history.push('/student/devices')}>
        ← Quay lại danh sách
      </Button>
    </Empty>
  );
}

export default function StudentBorrowPage() {
  const { data: rawData } = useAsyncData(getDevices);
  const devices = rawData?.data ?? [];

  const handleSubmit = async (values: BorrowFormValues) => {
    const hideLoading = message.loading('Đang gửi yêu cầu mượn...', 0);

    try {
      await createBorrowRequest({
        deviceId: device.id,
        quantity: values.quantity,
        borrowDate: values.borrowDate.format('YYYY-MM-DD'),
        returnDate: values.returnDate.format('YYYY-MM-DD'),
        note: `[${values.eventName}] ${values.purpose}`
      });

      hideLoading();
      message.success('Đã gửi yêu cầu mượn', 2);
      history.push('/student/requests');
    } catch (error) {
      hideLoading();
      console.error('Create borrow request failed:', error);
      message.error('Không thể gửi yêu cầu mượn. Vui lòng thử lại.', 3);
    }
  };

  return (
    <>
      <PageTitle title="Gui yeu cau muon" description="Chon thiet bi, so luong va thoi gian muon tra." />
      <Card>
        <Form layout="vertical" onFinish={handleSubmit} style={{ maxWidth: 640 }}>
          <Form.Item name="deviceId" label="Thiet bi" rules={[{ required: true }]}>
            <Select
              options={devices.map((device) => ({
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