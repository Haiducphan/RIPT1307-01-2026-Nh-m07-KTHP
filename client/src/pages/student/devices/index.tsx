import { useMemo, useState } from 'react';
import { Button, Col, Empty, Input, Row, Spin } from 'antd';
import { history } from '@umijs/max';
import EquipmentCard from '@/components/EquipmentCard';
import StatsCard from '@/components/StatsCard';
import TrustRankBadge from '@/components/TrustRankBadge';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getDevices } from '@/services/devices';
import { useAuthStore } from '@/stores/authStore';
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
  const { currentUser } = useAuthStore();
  const { data: devices = [], loading } = useAsyncData(getDevices);
  const [searchText, setSearchText] = useState('');
  const [activeFilter, setActiveFilter] = useState(FILTERS[0]);

  const userMeta = currentUser as (typeof currentUser & {
    trustScore?: number;
    trustRank?: TrustRankValue;
  });

  const displayDevices = useMemo<DisplayDevice[]>(
    () =>
      devices.map((device) => ({
        ...device,
        icon: getDeviceIcon(device),
        tier: getDeviceTier(device),
        description: getDeviceDescription(device)
      })),
    [devices]
  );

  const availableCount = useMemo(
    () => displayDevices.reduce((total, device) => total + device.availableQuantity, 0),
    [displayDevices]
  );

  const filteredDevices = useMemo(() => {
    const keyword = normalizeText(searchText.trim());

    return displayDevices.filter((device) => {
      const searchableText = normalizeText(`${device.name} ${device.category} ${device.description ?? ''}`);
      const matchesSearch = !keyword || searchableText.includes(keyword);
      return matchesSearch && matchFilter(device, activeFilter);
    });
  }, [activeFilter, displayDevices, searchText]);

  const handleBorrow = (device: Device) => {
    history.push(`/student/borrow?deviceId=${device.id}`);
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 24,
          marginBottom: 32,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'Georgia, serif',
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.1,
              color: '#1A1F1B',
              margin: '0 0 8px'
            }}
          >
            Xin chào, <em style={{ color: '#2D4A3E' }}>{getLastName(currentUser?.fullName)}</em>
          </h1>
          <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
            Có {availableCount} thiết bị đang sẵn sàng cho bạn mượn hôm nay.
          </p>
        </div>

        <TrustRankBadge rank={userMeta?.trustRank ?? 'stone'} score={userMeta?.trustScore ?? 0} />
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard title="ĐANG MƯỢN" value={MOCK_STATS.borrowing} meta="thiết bị" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard title="CHỜ DUYỆT" value={MOCK_STATS.pending} meta="yêu cầu" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard title="ĐÃ TỪNG MƯỢN" value={MOCK_STATS.returned} meta="lượt thành công" />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatsCard title="CHUỖI TỐT" value={MOCK_STATS.streak} meta="+7đ thưởng 🎉" featured />
        </Col>
      </Row>

      <div
        style={{
          display: 'flex',
          gap: 10,
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 28
        }}
      >
        <Input.Search
          allowClear
          placeholder="Tìm thiết bị: micro, máy chiếu, máy ảnh..."
          value={searchText}
          onChange={(event) => setSearchText(event.target.value)}
          style={{ width: 360, maxWidth: '100%' }}
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
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
          <Spin size="large" />
        </div>
      ) : filteredDevices.length === 0 ? (
        <Empty description="Không tìm thấy thiết bị phù hợp" style={{ padding: '64px 0' }} />
      ) : (
        <Row gutter={[18, 18]}>
          {filteredDevices.map((device) => (
            <Col key={device.id} xs={24} sm={12} lg={8} xl={6}>
              <EquipmentCard device={device} onBorrow={handleBorrow} />
            </Col>
          ))}
        </Row>
      )}
    </div>
  );
}
