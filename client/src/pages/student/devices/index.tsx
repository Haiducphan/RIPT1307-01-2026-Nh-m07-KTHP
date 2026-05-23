import { useMemo, useState } from 'react';
import { Button, Col, Empty, Grid, Input, Row, Skeleton } from 'antd';
import { history } from '@umijs/max';
import EquipmentCard from '@/components/EquipmentCard';
import StatsCard from '@/components/StatsCard';
import TrustRankBadge from '@/components/TrustRankBadge';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getDevices } from '@/services/equipment';
import type { Device } from '@/types';

type TrustRankValue = 'diamond' | 'gold' | 'silver' | 'bronze' | 'stone';
type DeviceTier = 'S' | 'A' | 'B' | 'C';
type DisplayDevice = Device & {
  icon?: string;
  tier?: DeviceTier;
};

const FILTERS = ['Tất cả', 'Âm thanh', 'Hình ảnh', 'Trình chiếu', 'Phụ kiện', '⚡ Còn hàng'];

const MOCK_STATS = {
  borrowing: 1,
  pending: 1,
  returned: 12,
  streak: 5
};

function normalizeText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function getLastName(fullName?: string) {
  const parts = fullName?.trim().split(/\s+/) ?? [];
  return parts[parts.length - 1] || 'bạn';
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

  if (text.includes('micro')) return 'Micro chuyên dụng cho sự kiện và thuyết trình';
  if (text.includes('loa')) return 'Loa di động phục vụ sinh hoạt câu lạc bộ';
  if (text.includes('may chieu') || text.includes('trinh chieu')) return 'Thiết bị trình chiếu cho họp nhóm và workshop';
  if (text.includes('may anh') || text.includes('camera')) return 'Thiết bị ghi hình cho truyền thông và sự kiện';
  if (text.includes('tripod') || text.includes('chan may')) return 'Phụ kiện hỗ trợ quay chụp ổn định';
  if (text.includes('den') || text.includes('led')) return 'Đèn hỗ trợ quay chụp trong không gian trong nhà';
  if (text.includes('tai nghe')) return 'Tai nghe kiểm âm, dựng video và luyện tập';
  return 'Thiết bị sẵn sàng cho sinh viên đăng ký mượn';
}

function matchFilter(device: Device, filter: string) {
  if (filter === 'Tất cả') return true;
  if (filter === '⚡ Còn hàng') return device.availableQuantity > 0;

  const text = normalizeText(`${device.name} ${device.category}`);

  if (filter === 'Âm thanh') return text.includes('am thanh') || text.includes('micro') || text.includes('loa');
  if (filter === 'Hình ảnh') return text.includes('hinh anh') || text.includes('may anh') || text.includes('camera');
  if (filter === 'Trình chiếu') return text.includes('trinh chieu') || text.includes('may chieu');
  if (filter === 'Phụ kiện') return text.includes('phu kien') || text.includes('tripod') || text.includes('den') || text.includes('tai nghe');

  return true;
}

export default function StudentDevicesPage() {
  const { data, loading } = useAsyncData(getDevices);
  const devices = data?.data ?? [];

  return (
    <>
      <PageTitle title="Danh sach thiet bi" description="Sinh vien xem tinh trang va so luong con lai." />
      <Card>
        <Table<Device>
          rowKey="id"
          loading={loading}
          dataSource={devices}
          columns={[
            { title: 'Ten thiet bi', dataIndex: 'name' },
            { title: 'Ma', dataIndex: 'code' },
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
            }
          ]}
        />

        {FILTERS.map((filter) => {
          const active = activeFilter === filter;

          return (
            <Button
              key={filter}
              type={active ? 'primary' : 'default'}
              onClick={() => setActiveFilter(filter)}
              style={{
                borderRadius: 100,
                height: 36,
                paddingInline: 16,
                background: active ? '#2D4A3E' : '#FFFFFF',
                borderColor: active ? '#2D4A3E' : '#E5DECB',
                color: active ? '#FFFFFF' : '#1A1F1B'
              }}
            >
              {filter}
            </Button>
          );
        })}
      </div>

      {loading ? (
        <Row gutter={[18, 18]}>
          {Array.from({ length: 8 }, (_, index) => (
            <Col key={index} xs={24} sm={12} md={8} lg={6}>
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid #E5DECB',
                  background: '#FFFFFF',
                  padding: 18
                }}
              >
                <Skeleton.Image active style={{ width: '100%', height: 150, borderRadius: 12 }} />
                <Skeleton active paragraph={{ rows: 2 }} title={{ width: '70%' }} style={{ marginTop: 16 }} />
                <Skeleton.Button active block style={{ height: 40, borderRadius: 10 }} />
              </div>
            </Col>
          ))}
        </Row>
      ) : filteredDevices.length === 0 ? (
        <Empty
          image={<div style={{ fontSize: 60 }}>🔍</div>}
          styles={{ image: { height: 80, marginBottom: 16 } }}
          description={
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Không tìm thấy thiết bị nào</h3>
              <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                Thử thay đổi từ khoá tìm kiếm hoặc bộ lọc khác
              </p>
            </div>
          }
          style={{ padding: '70px 0' }}
        >
          <Button
            onClick={() => {
              setSearchText('');
              setActiveFilter(FILTERS[0]);
            }}
          >
            Xoá bộ lọc
          </Button>
        </Empty>
      ) : (
        <Row gutter={[18, 18]}>
          {filteredDevices.map((device) => (
            <Col key={device.id} xs={24} sm={12} md={8} lg={6}>
              <EquipmentCard device={device} onBorrow={handleBorrow} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}