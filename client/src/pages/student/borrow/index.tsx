import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Empty, Form, Input, InputNumber, message, Row, Spin, Tag } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { history, useLocation } from 'umi';
import { createBorrowRequest } from '@/services/borrowRequests';
import { getDeviceById } from '@/services/devices';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuthStore } from '@/stores/authStore';
import type { Device } from '@/types';

type DeviceTier = 'S' | 'A' | 'B' | 'C';
type TrustRank = 'diamond' | 'gold' | 'silver' | 'bronze' | 'stone';

interface BorrowFormValues {
  borrowDate: Dayjs;
  returnDate: Dayjs;
  quantity: number;
  purpose: string;
}

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
  if (device.tier === 'S' || device.tier === 'A' || device.tier === 'B' || device.tier === 'C') return device.tier;

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

function deriveRankFromTrustScore(score: number): TrustRank {
  if (score >= 90) return 'diamond';
  if (score >= 80) return 'gold';
  if (score >= 66) return 'silver';
  if (score >= 50) return 'bronze';
  return 'stone';
}

function normalizeTrustRank(rank?: string): TrustRank | undefined {
  const normalized = rank?.trim().toLowerCase();
  if (!normalized) return undefined;
  if (['diamond', 'kim cương', 'kim cuong'].includes(normalized)) return 'diamond';
  if (['gold', 'vàng', 'vang'].includes(normalized)) return 'gold';
  if (['silver', 'bạc', 'bac'].includes(normalized)) return 'silver';
  if (['bronze', 'đồng', 'dong'].includes(normalized)) return 'bronze';
  if (['stone', 'pebble', 'đá cuội', 'da cuoi'].includes(normalized)) return 'stone';
  return undefined;
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
  const [form] = Form.useForm<BorrowFormValues>();
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const location = useLocation();
  const { currentUser } = useAuthStore();
  const deviceId = useMemo(() => new URLSearchParams(location.search).get('deviceId'), [location.search]);
  const { data: device, loading } = useAsyncData<Device | undefined>(
    () => (deviceId ? getDeviceById(deviceId) : Promise.resolve(undefined)),
    [deviceId]
  );

  useEffect(() => {
    setActiveImageIndex(0);
  }, [deviceId]);

  const userMeta = currentUser as (typeof currentUser & {
    trustRank?: string;
    trustScore?: number;
  });
  const currentScore = typeof userMeta?.trustScore === 'number' ? userMeta.trustScore : undefined;
  const currentRank = normalizeTrustRank(userMeta?.trustRank) ?? (currentScore !== undefined ? deriveRankFromTrustScore(currentScore) : undefined);

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', minHeight: 360 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!deviceId || !device) {
    return <EmptyBorrowState />;
  }

  const icon = getDeviceIcon(device);
  const tier = getDeviceTier(device);
  const description = getDeviceDescription(device);
  const requiredRank = REQUIRED_RANK_BY_TIER[tier];
  const hasRequiredRank = currentRank ? RANK_SCORE[currentRank] >= RANK_SCORE[requiredRank] : false;
  const hasStock = device.availableQuantity > 0;
  const formDisabled = !hasRequiredRank || !hasStock;
  const borrowedQuantity = Math.max(device.totalQuantity - device.availableQuantity, 0);
  const galleryItems = device.images?.length ? device.images : device.image ? [device.image] : ['icon'];
  const activeGalleryItem = galleryItems[Math.min(activeImageIndex, galleryItems.length - 1)];
  const hasRealImages = Boolean(device.images?.length || device.image);

  const getErrorMessage = (error: unknown) => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string } } }).response;
      if (response?.data?.message) return response.data.message;
    }

    return 'Không thể gửi yêu cầu mượn. Vui lòng thử lại.';
  };

  const handleSubmit = async (values: BorrowFormValues) => {
    setSubmitting(true);

    try {
      await createBorrowRequest({
        deviceId: device.id,
        quantity: values.quantity,
        borrowDate: values.borrowDate.format('YYYY-MM-DD'),
        returnDate: values.returnDate.format('YYYY-MM-DD'),
        purpose: values.purpose
      });

      message.success('Đã gửi yêu cầu mượn', 2);
      history.push('/student/requests');
    } catch (error) {
      console.error('Create borrow request failed:', error);
      message.error(getErrorMessage(error), 3);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      <Button type="link" onClick={() => history.push('/student/devices')} style={{ padding: 0, marginBottom: 20 }}>
        ← Quay lại danh sách
      </Button>

      <Row gutter={[28, 28]} align="top">
        <Col xs={24} lg={9}>
          <Card
            variant="borderless"
            style={{ borderRadius: 18, border: '1px solid #E5DECB', background: '#FFFFFF', boxShadow: '0 8px 28px rgba(45, 74, 62, 0.06)' }}
            styles={{ body: { padding: 18 } }}
          >
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', background: '#EFE9DD', marginBottom: 14 }}>
              {hasRealImages ? (
                <img
                  key={activeGalleryItem}
                  src={activeGalleryItem}
                  alt={device.name}
                  style={{ width: '100%', height: 'min(260px, 52vw)', objectFit: 'cover', display: 'block', transition: 'opacity 0.2s ease' }}
                />
              ) : (
                <div
                  key={activeGalleryItem}
                  style={{ width: '100%', height: 'min(260px, 52vw)', background: '#F5F1E8', display: 'grid', placeItems: 'center', fontSize: 88, lineHeight: 1 }}
                >
                  {icon}
                </div>
              )}
              <Tag
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  margin: 0,
                  border: '1px solid rgba(201, 154, 63, 0.25)',
                  borderRadius: 999,
                  background: '#FFFFFF',
                  color: '#C99A3F',
                  fontFamily: 'var(--app-heading-font)',
                  fontWeight: 700
                }}
              >
                Hạng {tier}
              </Tag>
            </div>

            {galleryItems.length > 1 && (
              <Row gutter={8} style={{ marginBottom: 16 }}>
                {galleryItems.map((item, index) => {
                  const active = activeImageIndex === index;

                  return (
                    <Col span={8} key={`${item}-${index}`}>
                      <button
                        type="button"
                        onClick={() => setActiveImageIndex(index)}
                        style={{
                          width: '100%',
                          height: 58,
                          borderRadius: 10,
                          border: active ? '2px solid #2D4A3E' : '1px solid #E5E5E5',
                          background: active ? '#EFE9DD' : '#F5F1E8',
                          padding: 4,
                          cursor: 'pointer',
                          overflow: 'hidden',
                          opacity: active ? 1 : 0.78,
                          transition: 'border-color 0.2s ease, transform 0.2s ease, opacity 0.2s ease'
                        }}
                        onMouseEnter={(event) => {
                          event.currentTarget.style.borderColor = '#6BA67B';
                          event.currentTarget.style.transform = 'scale(1.02)';
                        }}
                        onMouseLeave={(event) => {
                          event.currentTarget.style.borderColor = active ? '#2D4A3E' : '#E5E5E5';
                          event.currentTarget.style.transform = 'scale(1)';
                        }}
                      >
                        {hasRealImages ? (
                          <img src={item} alt={`${device.name} ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 7, display: 'block' }} />
                        ) : (
                          <span style={{ display: 'grid', placeItems: 'center', width: '100%', height: '100%', fontSize: 28, lineHeight: 1 }}>{icon}</span>
                        )}
                      </button>
                    </Col>
                  );
                })}
              </Row>
            )}

            <h2 style={{ fontFamily: 'var(--app-heading-font)', fontSize: 26, fontWeight: 500, lineHeight: 1.15, color: '#1A1F1B', margin: '0 0 8px' }}>
              {device.name}
            </h2>
            <p style={{ color: '#6B6F6C', fontSize: 14, lineHeight: 1.6, margin: '0 0 16px' }}>{description}</p>

            <Row gutter={[10, 10]}>
              {[
                ['Tổng số', device.totalQuantity, '#1A1F1B'],
                ['Sẵn có', device.availableQuantity, '#4F8B5F'],
                ['Đang mượn', borrowedQuantity, '#8B6A1F']
              ].map(([label, value, color]) => (
                <Col xs={8} key={String(label)}>
                  <div style={{ border: '1px solid #E5DECB', borderRadius: 12, padding: '10px 8px', background: '#FAF8F2' }}>
                    <div style={{ fontSize: 11, color: '#6B6F6C', marginBottom: 4 }}>{label}</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: String(color) }}>{value}</div>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={15}>
          <Card
            variant="borderless"
            style={{ borderRadius: 18, border: '1px solid #E5DECB', background: '#FFFFFF', boxShadow: '0 16px 42px rgba(45, 74, 62, 0.08)' }}
            styles={{ body: { padding: 24 } }}
          >
            <div style={{ marginBottom: 18 }}>
              <Tag style={{ marginBottom: 12, border: 'none', borderRadius: 100, color: '#075985', background: '#E0F2FE', padding: '4px 12px' }}>
                Yêu cầu hạng {RANK_LABEL[requiredRank]} · Thiết bị hạng {tier}
              </Tag>
              <h1 style={{ fontFamily: 'var(--app-heading-font)', fontSize: 36, fontWeight: 500, lineHeight: 1.1, color: '#1A1F1B', margin: '0 0 8px' }}>
                Xác nhận yêu cầu mượn
              </h1>
              <p style={{ color: '#6B6F6C', fontSize: 15, lineHeight: 1.6, margin: 0 }}>
                Điền thông tin sử dụng để CLB xét duyệt yêu cầu của bạn.
              </p>
            </div>

            <Alert
              showIcon
              type={hasRequiredRank && hasStock ? 'info' : 'error'}
              style={{ marginBottom: 22, borderRadius: 12, background: hasRequiredRank && hasStock ? '#F5EBD0' : '#F2DDD7', borderColor: hasRequiredRank && hasStock ? '#E5DECB' : '#E4B7AD' }}
              message={hasStock ? 'Điều kiện mượn thiết bị' : 'Thiết bị hiện đã hết hàng'}
              description={
                hasStock
                  ? currentRank
                    ? `Cần hạng ${RANK_LABEL[requiredRank]} để mượn thiết bị hạng ${tier}. Hạng hiện tại của bạn: ${RANK_LABEL[currentRank]}${currentScore !== undefined ? ` (${currentScore} điểm)` : ''}${hasRequiredRank ? ' - đủ điều kiện.' : ' - chưa đủ điều kiện.'}`
                    : `Cần hạng ${RANK_LABEL[requiredRank]} để mượn thiết bị hạng ${tier}. Hồ sơ của bạn chưa có dữ liệu hạng uy tín để xác định điều kiện mượn.`
                  : 'Bạn chưa thể gửi yêu cầu mượn thiết bị này. Vui lòng quay lại danh sách và chọn thiết bị còn hàng.'
              }
            />

            <Form<BorrowFormValues>
              form={form}
              layout="vertical"
              disabled={formDisabled || submitting}
              requiredMark={false}
              initialValues={{
                borrowDate: dayjs(),
                returnDate: dayjs().add(3, 'day'),
                quantity: 1
              }}
              onFinish={handleSubmit}
              scrollToFirstError
            >
              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item name="borrowDate" label="Ngày bắt đầu mượn" rules={[{ required: true, message: 'Chọn ngày bắt đầu mượn' }]}>
                    <DatePicker style={{ width: '100%', height: 42 }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="returnDate"
                    label="Ngày dự kiến trả"
                    dependencies={['borrowDate']}
                    rules={[
                      { required: true, message: 'Chọn ngày dự kiến trả' },
                      ({ getFieldValue }) => ({
                        validator(_, value: Dayjs) {
                          const borrowDate = getFieldValue('borrowDate') as Dayjs | undefined;
                          if (!value || !borrowDate || value.isAfter(borrowDate, 'day')) return Promise.resolve();
                          return Promise.reject(new Error('Ngày trả phải sau ngày mượn'));
                        }
                      })
                    ]}
                  >
                    <DatePicker style={{ width: '100%', height: 42 }} format="DD/MM/YYYY" />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="quantity"
                    label="Số lượng"
                    rules={[
                      { required: true, message: 'Nhập số lượng' },
                      {
                        validator(_, value: number) {
                          if (value === undefined || value === null) return Promise.reject(new Error('Nhập số lượng'));
                          if (value <= 0) return Promise.reject(new Error('Số lượng phải lớn hơn 0'));
                          if (value > device.availableQuantity) return Promise.reject(new Error(`Số lượng không được vượt quá ${device.availableQuantity} thiết bị đang sẵn có`));
                          return Promise.resolve();
                        }
                      }
                    ]}
                  >
                    <InputNumber min={1} max={device.availableQuantity} style={{ width: '100%', height: 42 }} />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="purpose" label="Mục đích mượn" rules={[{ required: true, whitespace: true, message: 'Mục đích mượn không được bỏ trống' }]}> 
                <Input.TextArea rows={5} placeholder="Ví dụ: Dùng cho buổi thuyết trình nhóm, ghi rõ thời gian và bối cảnh sử dụng..." />
              </Form.Item>

              <Button
                type="primary"
                htmlType="submit"
                block
                loading={submitting}
                disabled={formDisabled || submitting}
                style={{ height: 48, background: '#2D4A3E', borderColor: '#2D4A3E', borderRadius: 12, fontWeight: 700 }}
              >
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu mượn'}
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
