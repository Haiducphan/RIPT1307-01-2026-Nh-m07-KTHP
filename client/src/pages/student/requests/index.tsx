import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Card, Col, Empty, Modal, Row, Skeleton, Steps, Tabs, Tag, Typography, message } from 'antd';
import dayjs from 'dayjs';
import { history } from 'umi';
import { cancelBorrowRequest, getMyBorrowRequests } from '@/services/borrowRequests';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { BorrowRequest } from '@/types';

type RequestStatus = BorrowRequest['status'];
type RequestItem = Omit<BorrowRequest, 'status'> & {
  status: RequestStatus;
  requestCode?: string;
  purpose?: string;
  eventName?: string;
  createdAt?: string;
};
type RequestTab = 'all' | 'pending' | 'borrowed' | 'completed';
type DeviceTier = 'S' | 'A' | 'B' | 'C';

const STATUS_CONFIG: Record<RequestStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending: { label: 'Chờ duyệt', color: '#8B6A1F', bg: '#F5EBD0', dot: '#C99A3F' },
  approved: { label: 'Đã duyệt', color: '#2563EB', bg: '#DCE4F0', dot: '#5C7BA8' },
  borrowed: { label: 'Đang mượn', color: '#6D4A8F', bg: '#E8DEF0', dot: '#8A6CA8' },
  borrowing: { label: 'Đang mượn', color: '#6D4A8F', bg: '#E8DEF0', dot: '#8A6CA8' },
  returned: { label: 'Đã trả', color: '#2F6F3E', bg: '#E1EFE3', dot: '#4F8B5F' },
  returned_ontime: { label: 'Đã trả', color: '#2F6F3E', bg: '#E1EFE3', dot: '#4F8B5F' },
  returned_late: { label: 'Đã trả trễ', color: '#8B6A1F', bg: '#F5EBD0', dot: '#C99A3F' },
  cancelled: { label: 'Đã huỷ', color: '#6B6F6C', bg: '#ECEEF2', dot: '#9A9D98' },
  cancelled_noshow: { label: 'Đã huỷ', color: '#6B6F6C', bg: '#ECEEF2', dot: '#9A9D98' },
  rejected: { label: 'Đã từ chối', color: '#9B3E33', bg: '#F2DDD7', dot: '#B05A4D' },
  overdue: { label: 'Quá hạn', color: '#9B3E33', bg: '#F2DDD7', dot: '#B05A4D' }
};

const PROCESSING_STATUSES: RequestStatus[] = ['pending', 'approved'];
const BORROWING_STATUSES: RequestStatus[] = ['borrowed', 'borrowing', 'overdue'];
const RETURNED_STATUSES: RequestStatus[] = ['returned', 'returned_ontime', 'returned_late'];
const COMPLETED_STATUSES: RequestStatus[] = [...RETURNED_STATUSES, 'cancelled', 'cancelled_noshow', 'rejected'];

function normalizeText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function formatDate(value: string, pattern = 'DD/MM') {
  const date = dayjs(value);
  return date.isValid() ? date.format(pattern) : value;
}

function getRequestCode(request: RequestItem, short = false) {
  if (request.requestCode) {
    const code = request.requestCode.replace(/^#/, '');
    return short ? `#${code.replace(/^REQ-/, '')}` : `#${code}`;
  }

  const id = String(request.id);
  const digits = id.replace(/\D/g, '');
  const suffix = digits ? digits.slice(-4).padStart(4, '0') : id.slice(-4).toUpperCase();
  return short ? `#${suffix}` : `#REQ-2026-${suffix}`;
}

function getDeviceIcon(deviceName?: string | null) {
  const text = normalizeText(deviceName);

  if (text.includes('micro')) return '🎤';
  if (text.includes('loa')) return '🔊';
  if (text.includes('may chieu')) return '📽️';
  if (text.includes('may anh') || text.includes('camera') || text.includes('canon') || text.includes('sony')) return '📷';
  if (text.includes('tripod') || text.includes('chan may')) return '🎬';
  if (text.includes('den') || text.includes('led')) return '💡';
  if (text.includes('tai nghe')) return '🎧';
  if (text.includes('mixer')) return '🎚️';
  return '📦';
}

function getDeviceTier(deviceName?: string | null): DeviceTier {
  const text = normalizeText(deviceName);

  if (text.includes('epson') || text.includes('canon') || text.includes('may chieu')) return 'S';
  if (text.includes('shure') || text.includes('jbl') || text.includes('mixer') || text.includes('micro')) return 'A';
  if (text.includes('tripod') || text.includes('den') || text.includes('loa')) return 'B';
  return 'C';
}

function getPurpose(request: RequestItem) {
  return request.purpose?.trim() || request.note?.trim() || 'Chưa có mô tả mục đích mượn.';
}

function StatusBadge({ status }: { status: RequestStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;

  return (
    <Tag
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        border: 'none',
        borderRadius: 999,
        color: config.color,
        background: config.bg,
        fontSize: 12,
        fontWeight: 600,
        margin: 0,
        padding: '4px 10px'
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: config.dot }} />
      {config.label}
    </Tag>
  );
}

function getFilteredRequests(requests: RequestItem[], activeTab: RequestTab) {
  if (activeTab === 'pending') return requests.filter((request) => PROCESSING_STATUSES.includes(request.status));
  if (activeTab === 'borrowed') return requests.filter((request) => BORROWING_STATUSES.includes(request.status));
  if (activeTab === 'completed') return requests.filter((request) => COMPLETED_STATUSES.includes(request.status));
  return requests;
}

function getTimelineItems(request: RequestItem) {
  const isRejected = request.status === 'rejected';
  const isCancelled = request.status === 'cancelled' || request.status === 'cancelled_noshow';
  const isApproved = ['approved', ...BORROWING_STATUSES, ...RETURNED_STATUSES].includes(request.status);
  const isBorrowed = [...BORROWING_STATUSES, ...RETURNED_STATUSES].includes(request.status);
  const isReturned = RETURNED_STATUSES.includes(request.status);

  return [
    {
      title: 'Gửi yêu cầu',
      description: formatDate(request.borrowDate, 'DD/MM/YYYY'),
      status: 'finish' as const
    },
    {
      title: isRejected ? 'Đã từ chối' : isCancelled ? 'Đã huỷ' : isApproved ? 'Đã duyệt' : 'Chờ Admin duyệt',
      description: isApproved ? 'Admin đã xác nhận yêu cầu' : 'Dự kiến: trong 24h',
      status: isRejected || isCancelled ? ('error' as const) : isApproved ? ('finish' as const) : ('process' as const)
    },
    {
      title: 'Đến nhận thiết bị',
      description: isBorrowed ? 'Đã nhận thiết bị' : 'Sau khi được duyệt',
      status: isBorrowed ? ('finish' as const) : ('wait' as const)
    },
    {
      title: 'Hoàn trả thiết bị',
      description: isReturned ? STATUS_CONFIG[request.status].label : `Trước ${formatDate(request.returnDate, 'DD/MM/YYYY')}`,
      status: isReturned ? ('finish' as const) : ('wait' as const)
    }
  ];
}

function RequestDetailContent({ request, onCancelRequest }: { request: RequestItem; onCancelRequest: () => void }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 14,
            background: '#EFE9DD',
            display: 'grid',
            placeItems: 'center',
            fontSize: 36
          }}
        >
          {getDeviceIcon(request.deviceName)}
        </div>
        <div>
          <div style={{ fontWeight: 700, color: '#1A1F1B' }}>{request.deviceName}</div>
          <div style={{ color: '#6B6F6C', fontSize: 13, marginTop: 4 }}>
            Số lượng: {request.quantity} · Hạng {getDeviceTier(request.deviceName)}
          </div>
        </div>
      </div>

      <Steps direction="vertical" size="small" items={getTimelineItems(request)} />

      <div style={{ borderTop: '1px solid #EFEADA', marginTop: 18, paddingTop: 16 }}>
        <div style={{ fontSize: 12, color: '#6B6F6C', marginBottom: 6 }}>Mục đích mượn</div>
        <div style={{ fontSize: 13, color: '#1A1F1B', lineHeight: 1.6 }}>{getPurpose(request)}</div>
      </div>

      {request.status === 'pending' && (
        <Button danger block style={{ marginTop: 20, height: 42 }} onClick={onCancelRequest}>
          Huỷ yêu cầu
        </Button>
      )}
    </>
  );
}

export default function StudentRequestsPage() {
  const { data, loading, refresh } = useAsyncData(getMyBorrowRequests);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [activeTab, setActiveTab] = useState<RequestTab>('all');
  const [selectedId, setSelectedId] = useState<string>();
  const [cancelTarget, setCancelTarget] = useState<RequestItem>();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [isMobile, setIsMobile] = useState(() => (typeof window === 'undefined' ? false : window.innerWidth < 768));
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!data) return;

    const nextRequests = [...(data as RequestItem[])].sort((first, second) => {
      const firstTime = dayjs(first.createdAt).valueOf() || 0;
      const secondTime = dayjs(second.createdAt).valueOf() || 0;
      if (firstTime !== secondTime) return secondTime - firstTime;
      return Number(second.id) - Number(first.id);
    });
    setRequests(nextRequests);
    setSelectedId((currentId) => {
      if (currentId && nextRequests.some((request) => request.id === currentId)) return currentId;
      return nextRequests[0]?.id;
    });
  }, [data]);

  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((request) => PROCESSING_STATUSES.includes(request.status)).length,
      borrowed: requests.filter((request) => BORROWING_STATUSES.includes(request.status)).length,
      completed: requests.filter((request) => COMPLETED_STATUSES.includes(request.status)).length
    }),
    [requests]
  );

  const filteredRequests = useMemo(() => getFilteredRequests(requests, activeTab), [activeTab, requests]);
  const selectedRequest = requests.find((request) => request.id === selectedId) ?? filteredRequests[0];

  useEffect(() => {
    if (filteredRequests.length && !filteredRequests.some((request) => request.id === selectedId)) {
      setSelectedId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedId]);

  const focusDetailPanel = () => {
    window.setTimeout(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      detailPanelRef.current?.focus({ preventScroll: true });
    }, 50);
  };

  const handleSelectRequest = (request: RequestItem, shouldOpenMobileDetail = false) => {
    setSelectedId(request.id);

    if (isMobile && shouldOpenMobileDetail) {
      setDetailModalOpen(true);
      return;
    }

    if (!isMobile) focusDetailPanel();
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;

    setCancelling(true);

    try {
      await cancelBorrowRequest(String(cancelTarget.id));
      const refreshedRequests = await refresh();
      const nextRequests = refreshedRequests as RequestItem[] | undefined;

      if (nextRequests?.some((request) => request.id === cancelTarget.id)) {
        setSelectedId(String(cancelTarget.id));
      }

      setCancelTarget(undefined);
      message.success('Đã huỷ yêu cầu', 2);
    } catch (error) {
      const errorMessage =
        error && typeof error === 'object' && 'response' in error
          ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      message.error(errorMessage || 'Không thể huỷ yêu cầu. Vui lòng thử lại.', 3);
    } finally {
      setCancelling(false);
    }
  };

  const tabItems = [
    { key: 'all', label: `Tất cả (${counts.all})` },
    { key: 'pending', label: `Đang xử lý (${counts.pending})` },
    { key: 'borrowed', label: `Đang mượn (${counts.borrowed})` },
    { key: 'completed', label: `Đã hoàn tất (${counts.completed})` }
  ];

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ marginBottom: 24 }}>
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
          Yêu cầu của tôi
        </h1>
        <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
          Theo dõi trạng thái các đơn mượn thiết bị
        </p>
      </div>

      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => setActiveTab(key as RequestTab)}
        style={{ marginBottom: 18 }}
      />

      {loading ? (
        <Row gutter={[24, 24]} align="top">
          <Col xs={24} xl={14}>
            <div style={{ display: 'grid', gap: 12 }}>
              {Array.from({ length: 4 }, (_, index) => (
                <Card key={index} variant="borderless" style={{ borderRadius: 14, border: '1px solid #E5DECB' }} styles={{ body: { padding: 18 } }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '44px 1fr 92px', gap: 14, alignItems: 'center' }}>
                    <Skeleton.Avatar active shape="square" size={44} />
                    <Skeleton active paragraph={{ rows: 1 }} title={{ width: '62%' }} />
                    <Skeleton.Button active block style={{ height: 34 }} />
                  </div>
                </Card>
              ))}
            </div>
          </Col>
          <Col xs={24} xl={10}>
            <Card variant="borderless" style={{ borderRadius: 14, border: '1px solid #E5DECB' }}>
              <Skeleton active paragraph={{ rows: 7 }} title={{ width: '58%' }} />
            </Card>
          </Col>
        </Row>
      ) : requests.length === 0 ? (
        <Empty
          image={<div style={{ fontSize: 80 }}>📋</div>}
          styles={{ image: { height: 96, marginBottom: 16 } }}
          description={
            <div>
              <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chưa có yêu cầu nào</h3>
              <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                Bạn chưa gửi yêu cầu mượn nào. Hãy bắt đầu bằng việc chọn thiết bị!
              </p>
            </div>
          }
          style={{ padding: '76px 0' }}
        >
          <Button type="primary" onClick={() => history.push('/student/devices')}>
            Xem danh sách thiết bị
          </Button>
        </Empty>
      ) : (
        <Row gutter={[24, 24]} align="top">
          <Col xs={24} xl={14}>
            <div style={{ display: 'grid', gap: 12 }}>
              {filteredRequests.length === 0 ? (
                <Empty
                  image={<div style={{ fontSize: 64 }}>📭</div>}
                  styles={{ image: { height: 84, marginBottom: 14 } }}
                  description={
                    <div>
                      <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Không có đơn nào trong mục này</h3>
                      <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                        Chuyển sang tab khác để xem các đơn mượn của bạn
                      </p>
                    </div>
                  }
                  style={{ padding: '64px 0' }}
                />
              ) : (
                filteredRequests.map((request) => {
                  const selected = selectedRequest?.id === request.id;

                  return (
                    <Card
                      key={request.id}
                      hoverable
                      variant="borderless"
                      onClick={() => handleSelectRequest(request, isMobile)}
                      style={{
                        borderRadius: 14,
                        border: selected ? '1px solid #2D4A3E' : '1px solid #E5DECB',
                        background: selected ? '#F8F4EA' : '#FFFFFF',
                        boxShadow: selected ? '0 12px 30px rgba(45, 74, 62, 0.14)' : '0 1px 2px rgba(45, 74, 62, 0.04)',
                        outline: selected ? '2px solid rgba(45, 74, 62, 0.16)' : 'none',
                        opacity: ['cancelled', 'cancelled_noshow', 'rejected'].includes(request.status) ? 0.72 : 1
                      }}
                      styles={{ body: { padding: 18 } }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: isMobile ? '44px 1fr' : '44px 1fr auto auto',
                          gap: 14,
                          alignItems: 'center'
                        }}
                      >
                        <div style={{ fontSize: 32, lineHeight: 1 }}>{getDeviceIcon(request.deviceName)}</div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12, color: '#9A9D98', marginBottom: 3 }}>
                            {getRequestCode(request)}
                          </div>
                          <Typography.Text strong style={{ display: 'block', color: '#1A1F1B' }}>
                            {request.deviceName} × {request.quantity}
                          </Typography.Text>
                          <div
                            style={{
                              color: '#6B6F6C',
                              fontSize: 13,
                              marginTop: 4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {formatDate(request.borrowDate)} → {formatDate(request.returnDate)} · {getPurpose(request)}
                          </div>
                        </div>
                        <StatusBadge status={request.status} />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <Button
                            type={selected ? 'primary' : 'default'}
                            disabled={selected && !isMobile}
                            onClick={(event) => {
                              event.stopPropagation();
                              handleSelectRequest(request, true);
                            }}
                            style={
                              selected
                                ? { background: '#2D4A3E', borderColor: '#2D4A3E', color: '#FFFFFF' }
                                : undefined
                            }
                          >
                            {selected ? 'Đang xem' : 'Chi tiết'}
                          </Button>
                          {request.status === 'pending' && (
                            <Button
                              danger
                              onClick={(event) => {
                                event.stopPropagation();
                                setSelectedId(request.id);
                                setCancelTarget(request);
                              }}
                            >
                              Huỷ đơn
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          </Col>

          <Col xs={24} xl={10} style={{ display: isMobile ? 'none' : undefined }}>
            {selectedRequest ? (
              <div ref={detailPanelRef} tabIndex={-1} style={{ outline: 'none' }}>
                <Card
                  variant="borderless"
                  style={{
                    borderRadius: 14,
                    border: '1px solid #E5DECB',
                    position: 'sticky',
                    top: 24
                  }}
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 500 }}>
                        Chi tiết đơn {getRequestCode(selectedRequest, true)}
                      </span>
                      <StatusBadge status={selectedRequest.status} />
                    </div>
                  }
                >
                  <RequestDetailContent request={selectedRequest} onCancelRequest={() => setCancelTarget(selectedRequest)} />
                </Card>
              </div>
            ) : (
              <Empty
                image={<div style={{ fontSize: 60 }}>📄</div>}
                styles={{ image: { height: 80, marginBottom: 14 } }}
                description={
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chọn một đơn để xem chi tiết</h3>
                    <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                      Nhấn vào một thẻ yêu cầu bên trái để xem tiến trình và thông tin mượn.
                    </p>
                  </div>
                }
                style={{ padding: '48px 0' }}
              />
            )}
          </Col>
        </Row>
      )}

      <Modal
        title={
          selectedRequest ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingRight: 24 }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 500 }}>
                Chi tiết đơn {getRequestCode(selectedRequest, true)}
              </span>
              <StatusBadge status={selectedRequest.status} />
            </div>
          ) : (
            'Chi tiết đơn'
          )
        }
        open={detailModalOpen && Boolean(selectedRequest)}
        footer={null}
        width="calc(100vw - 24px)"
        centered={false}
        style={{ top: 12, maxWidth: 560 }}
        onCancel={() => setDetailModalOpen(false)}
      >
        {selectedRequest && (
          <>
            <RequestDetailContent request={selectedRequest} onCancelRequest={() => setCancelTarget(selectedRequest)} />
            <Button block style={{ marginTop: 12, height: 42 }} onClick={() => setDetailModalOpen(false)}>
              Quay lại danh sách
            </Button>
          </>
        )}
      </Modal>

      <Modal
        title="Xác nhận huỷ đơn"
        open={Boolean(cancelTarget)}
        okText="Đồng ý huỷ"
        cancelText="Quay lại"
        confirmLoading={cancelling}
        okButtonProps={{ danger: true }}
        onOk={handleCancel}
        onCancel={() => setCancelTarget(undefined)}
      >
        <p style={{ marginTop: 12 }}>
          Huỷ đơn sau khi đã duyệt sẽ trừ 3 điểm uy tín. Bạn có chắc muốn huỷ đơn này không?
        </p>
      </Modal>
    </div>
  );
}
