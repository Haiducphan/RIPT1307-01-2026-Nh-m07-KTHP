import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Empty,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Row,
  Space,
  Table,
  Tabs,
  Tag,
  Typography
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { approveBorrowRequest, getBorrowRequests, handoverBorrowRequest, markReturned, rejectBorrowRequest } from '@/services/borrowRequests';
import type { NormalizedBorrowRequest } from '@/services/borrowRequests';
import { useAsyncData } from '@/hooks/useAsyncData';
import type { BorrowRequest } from '@/types';
type RequestStatus = BorrowRequest['status'];
type RequestTab = 'all' | 'pending' | 'approved' | 'borrowed' | 'returned' | 'overdue';
type AdminActionType = 'approve' | 'reject' | 'handover' | 'return';
interface AdminRequest extends Omit<BorrowRequest, 'id' | 'status'> {
  id: string | number;
  status: RequestStatus;
  studentCode: string;
  requestCode?: string;
  request_code?: string;
  purpose?: string;
  eventName?: string;
  createdAt?: string;
  rejectReason?: string;
  returnCondition?: string;
  returnNote?: string;
}
interface RejectFormValues {
  reason: string;
}
interface ReturnFormValues {
  condition: string;
  note?: string;
}
const { RangePicker } = DatePicker;
const STATUS_CONFIG: Record<RequestStatus, { label: string; description: string; color: string; bg: string }> = {
  pending: { label: 'Chờ duyệt', description: 'Cần admin xét duyệt', color: '#8B6A1F', bg: '#F5EBD0' },
  approved: { label: 'Đã duyệt', description: 'Chờ bàn giao', color: '#2563EB', bg: '#DCE4F0' },
  borrowed: { label: 'Đang mượn', description: 'Chờ ghi nhận trả', color: '#6D4A8F', bg: '#E8DEF0' },
  borrowing: { label: 'Đang mượn', description: 'Chờ ghi nhận trả', color: '#6D4A8F', bg: '#E8DEF0' },
  returned: { label: 'Đã trả', description: 'Hoàn tất', color: '#2F6F3E', bg: '#E1EFE3' },
  returned_ontime: { label: 'Đã trả', description: 'Trả đúng hạn', color: '#2F6F3E', bg: '#E1EFE3' },
  returned_late: { label: 'Đã trả', description: 'Trả trễ hạn', color: '#8B6A1F', bg: '#F5EBD0' },
  cancelled: { label: 'Đã huỷ', description: 'Sinh viên đã huỷ', color: '#6B6F6C', bg: '#ECEEF2' },
  cancelled_noshow: { label: 'Đã huỷ', description: 'Không đến nhận', color: '#6B6F6C', bg: '#ECEEF2' },
  rejected: { label: 'Đã từ chối', description: 'Admin đã từ chối', color: '#9B3E33', bg: '#F2DDD7' },
  overdue: { label: 'Quá hạn', description: 'Cần ghi nhận trả', color: '#7A241B', bg: '#F2DDD7' }
};
const BORROWING_STATUSES: RequestStatus[] = ['borrowed', 'borrowing', 'overdue'];
const RETURNED_STATUSES: RequestStatus[] = ['returned', 'returned_ontime', 'returned_late'];
const RETURN_CONDITIONS = [
  { value: 'perfect', label: 'Hoàn hảo', points: '+2đ uy tín', tone: '#2F6F3E' },
  { value: 'minor_damage', label: 'Trầy nhẹ', points: '0đ uy tín', tone: '#6B6F6C' },
  { value: 'major_damage', label: 'Hỏng nhẹ', points: '-3đ uy tín', tone: '#B05A4D' },
  { value: 'lost', label: 'Hỏng nặng / mất', points: '-10đ uy tín', tone: '#9B3E33' }
];
function normalizeText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}
function getRequestCode(request: AdminRequest) {
  const requestCode = request.requestCode ?? request.request_code;
  if (requestCode) return requestCode.startsWith('#') ? requestCode : `#${requestCode}`;

  const id = String(request.id ?? '');
  const fallbackId = typeof request.id === 'number' ? id.padStart(4, '0') : id;
  return `#REQ-${fallbackId}`;
}
function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}
function getDeviceIcon(deviceName?: string | null) {
  const text = normalizeText(deviceName);
  if (text.includes('micro')) return '🎤';
  if (text.includes('loa')) return '🔊';
  if (text.includes('may chieu')) return '📽️';
  if (text.includes('may anh') || text.includes('camera') || text.includes('canon') || text.includes('sony')) return '📷';
  if (text.includes('tripod') || text.includes('chan may')) return '🎬';
  if (text.includes('den') || text.includes('led')) return '💡';
  return '📦';
}
function formatDate(value: string, pattern = 'DD/MM') {
  const date = dayjs(value);
  return date.isValid() ? date.format(pattern) : value;
}
function ellipsisText(value = '', max = 50) {
  return value.length > max ? `${value.slice(0, max)}...` : value;
}
function getPurpose(request: AdminRequest) {
  return request.purpose?.trim() || request.note?.trim() || 'Chưa có ghi chú';
}
function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
}
function toAdminRequest(request: NormalizedBorrowRequest): AdminRequest {
  return {
    ...request,
    status: request.status as RequestStatus,
    studentCode: request.studentCode || 'Chưa có MSSV'
  };
}
function StatusTag({ status }: { status: RequestStatus }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <div style={{ display: 'grid', gap: 4, justifyItems: 'start' }}>
      <Tag style={{ border: 'none', borderRadius: 999, color: config.color, background: config.bg, fontWeight: 700, margin: 0 }}>
        {config.label}
      </Tag>
      <span style={{ color: '#8A8E88', fontSize: 12 }}>{config.description}</span>
    </div>
  );
}
function StatCard({ title, value, meta, danger, featured }: { title: string; value: number; meta: string; danger?: boolean; featured?: boolean }) {
  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 14, border: featured ? '1px solid #2D4A3E' : '1px solid #E5DECB', background: featured ? '#2D4A3E' : '#FFFFFF' }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ color: featured ? 'rgba(255,255,255,0.72)' : '#6B6F6C', fontSize: 11, letterSpacing: '0.08em' }}>{title}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, color: danger ? '#B05A4D' : featured ? '#FFFFFF' : '#1A1F1B', marginTop: 8 }}>
        {value}
      </div>
      <div style={{ color: featured ? 'rgba(255,255,255,0.72)' : '#6B6F6C', fontSize: 12 }}>{meta}</div>
    </Card>
  );
}
function RequestDetailPanel({ request, actions }: { request?: AdminRequest; actions: (request: AdminRequest) => ReactNode }) {
  if (!request) {
    return (
      <Empty
        image={<div style={{ fontSize: 60 }}>📄</div>}
        styles={{ image: { height: 80, marginBottom: 14 } }}
        description={
          <div>
            <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chọn một đơn để xem chi tiết</h3>
            <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>Bấm vào một dòng trong bảng để xem thông tin xử lý.</p>
          </div>
        }
        style={{ padding: '48px 0' }}
      />
    );
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
        <div>
          <div style={{ color: '#8A8E88', fontSize: 12, marginBottom: 4 }}>Mã đơn</div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 24, color: '#1A1F1B' }}>{getRequestCode(request)}</div>
        </div>
        <StatusTag status={request.status} />
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, background: '#F8F4EA', borderRadius: 14 }}>
        <Avatar size={46} style={{ background: '#2D4A3E', color: '#F5EBD0', fontWeight: 700 }}>
          {getInitials(request.studentName)}
        </Avatar>
        <div>
          <div style={{ fontWeight: 700 }}>{request.studentName}</div>
          <div style={{ color: '#6B6F6C', fontSize: 13 }}>{request.studentCode}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        <div style={{ color: '#6B6F6C', fontSize: 12 }}>Thiết bị</div>
        <div style={{ fontWeight: 700, color: '#1A1F1B' }}>
          {getDeviceIcon(request.deviceName)} {request.deviceName} × {request.quantity}
        </div>
        <div style={{ color: '#6B6F6C', fontSize: 13 }}>
          {formatDate(request.borrowDate, 'DD/MM/YYYY')} → {formatDate(request.returnDate, 'DD/MM/YYYY')}
        </div>
      </div>

      <div style={{ borderTop: '1px solid #EFEADA', paddingTop: 14 }}>
        <div style={{ color: '#6B6F6C', fontSize: 12, marginBottom: 6 }}>Mục đích</div>
        <div style={{ color: '#1A1F1B', lineHeight: 1.6 }}>{getPurpose(request)}</div>
      </div>

      <div style={{ borderTop: '1px solid #EFEADA', paddingTop: 14 }}>{actions(request)}</div>
    </div>
  );
}
export default function AdminRequestsPage() {
  const [rejectForm] = Form.useForm<RejectFormValues>();
  const [returnForm] = Form.useForm<ReturnFormValues>();
  const { data, loading, refresh } = useAsyncData(getBorrowRequests);
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [activeTab, setActiveTab] = useState<RequestTab>('all');
  const [searchText, setSearchText] = useState('');
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedId, setSelectedId] = useState<AdminRequest['id']>();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [actionKey, setActionKey] = useState<string>();
  const [isMobile, setIsMobile] = useState(() => (typeof window === 'undefined' ? false : window.innerWidth < 768));
  const [rejectTarget, setRejectTarget] = useState<AdminRequest>();
  const [handoverTarget, setHandoverTarget] = useState<AdminRequest>();
  const [returnTarget, setReturnTarget] = useState<AdminRequest>();
  const [handoverChecked, setHandoverChecked] = useState(false);
  const detailPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!data) return;

    const nextRequests = data.map(toAdminRequest);
    setRequests(nextRequests);
    setSelectedId((currentId) => {
      if (currentId && nextRequests.some((request) => request.id === currentId)) return currentId;
      return nextRequests[0]?.id;
    });
  }, [data]);
  const counts = useMemo(
    () => ({
      all: requests.length,
      pending: requests.filter((item) => item.status === 'pending').length,
      approved: requests.filter((item) => item.status === 'approved').length,
      borrowed: requests.filter((item) => BORROWING_STATUSES.includes(item.status)).length,
      returned: requests.filter((item) => RETURNED_STATUSES.includes(item.status)).length,
      overdue: requests.filter((item) => item.status === 'overdue').length
    }),
    [requests]
  );
  const filteredRequests = useMemo(() => {
    const keyword = normalizeText(searchText.trim());
    return requests.filter((request) => {
      const matchesTab =
        activeTab === 'all' ||
        request.status === activeTab ||
        (activeTab === 'borrowed' && BORROWING_STATUSES.includes(request.status)) ||
        (activeTab === 'returned' && RETURNED_STATUSES.includes(request.status));
      const matchesSearch =
        !keyword ||
        normalizeText(`${getRequestCode(request)} ${request.studentName} ${request.studentCode} ${request.deviceName}`).includes(keyword);
      const borrowDate = dayjs(request.borrowDate);
      const matchesDate =
        !dateRange ||
        !borrowDate.isValid() ||
        (borrowDate.isSame(dateRange[0], 'day') || borrowDate.isAfter(dateRange[0], 'day')) &&
          (borrowDate.isSame(dateRange[1], 'day') || borrowDate.isBefore(dateRange[1], 'day'));
      return matchesTab && matchesSearch && matchesDate;
    });
  }, [activeTab, dateRange, requests, searchText]);
  const selectedRequest = requests.find((request) => request.id === selectedId) ?? filteredRequests[0];

  useEffect(() => {
    if (filteredRequests.length && !filteredRequests.some((request) => request.id === selectedId)) {
      setSelectedId(filteredRequests[0].id);
    }
  }, [filteredRequests, selectedId]);

  const isActionLoading = (type: AdminActionType, requestId?: AdminRequest['id']) => actionKey === `${type}:${requestId}`;
  const isAnyActionLoading = Boolean(actionKey);
  const focusDetailPanel = () => {
    window.setTimeout(() => {
      detailPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      detailPanelRef.current?.focus({ preventScroll: true });
    }, 50);
  };
  const selectRequest = (request: AdminRequest, openMobileDetail = false) => {
    setSelectedId(request.id);

    if (isMobile && openMobileDetail) {
      setDetailModalOpen(true);
      return;
    }

    if (!isMobile) focusDetailPanel();
  };
  const runAction = async (type: AdminActionType, request: AdminRequest, action: () => Promise<unknown>, successMessage: string) => {
    setActionKey(`${type}:${request.id}`);
    setSelectedId(request.id);

    try {
      await action();
      await refresh();
      message.success(successMessage, 2);
      return true;
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể thực hiện thao tác. Vui lòng thử lại.'), 3);
      return false;
    } finally {
      setActionKey(undefined);
    }
  };

  const handleApprove = (request: AdminRequest) => {
    void runAction('approve', request, () => approveBorrowRequest(String(request.id)), 'Đã duyệt đơn');
  };
  const handleReject = async (values: RejectFormValues) => {
    if (!rejectTarget) return;

    const success = await runAction('reject', rejectTarget, () => rejectBorrowRequest(String(rejectTarget.id), values.reason), 'Đã từ chối đơn');
    if (success) {
      setRejectTarget(undefined);
      rejectForm.resetFields();
    }
  };
  const handleHandOver = async () => {
    if (!handoverTarget) return;

    const success = await runAction('handover', handoverTarget, () => handoverBorrowRequest(String(handoverTarget.id)), 'Đã ghi nhận bàn giao');
    if (success) {
      setHandoverTarget(undefined);
      setHandoverChecked(false);
    }
  };
  const handleReturn = (values: ReturnFormValues) => {
    if (!returnTarget) return;

    const condition = RETURN_CONDITIONS.find((item) => item.value === values.condition);

    Modal.confirm({
      title: 'Xác nhận ghi nhận hoàn trả',
      okText: 'Xác nhận trả',
      cancelText: 'Quay lại',
      content: (
        <div style={{ lineHeight: 1.7 }}>
          <div>Đơn: <strong>{getRequestCode(returnTarget)}</strong></div>
          <div>Thiết bị: <strong>{returnTarget.deviceName} × {returnTarget.quantity}</strong></div>
          <div>Tình trạng: <strong>{condition?.label}</strong> ({condition?.points})</div>
          {values.note ? <div>Ghi chú: {values.note}</div> : null}
        </div>
      ),
      onOk: async () => {
        const success = await runAction(
          'return',
          returnTarget,
          () => markReturned(String(returnTarget.id), { returnCondition: values.condition, damageNote: values.note }),
          'Đã ghi nhận trả thiết bị'
        );

        if (success) {
          setReturnTarget(undefined);
          returnForm.resetFields();
        }
      }
    });
  };
  const openRejectModal = (request: AdminRequest) => {
    setSelectedId(request.id);
    setRejectTarget(request);
    rejectForm.resetFields();
  };
  const openHandOverModal = (request: AdminRequest) => {
    setSelectedId(request.id);
    setHandoverTarget(request);
    setHandoverChecked(false);
  };
  const openReturnModal = (request: AdminRequest) => {
    setSelectedId(request.id);
    setReturnTarget(request);
    returnForm.setFieldsValue({ condition: 'perfect', note: '' });
  };
  const showDetail = (request: AdminRequest) => {
    selectRequest(request, true);
  };
  const actionButtons = (request: AdminRequest) => {
    const selected = selectedRequest?.id === request.id;

    if (request.status === 'pending') {
      return (
        <Space>
          <Button
            type="primary"
            loading={isActionLoading('approve', request.id)}
            disabled={isAnyActionLoading && !isActionLoading('approve', request.id)}
            onClick={(event) => {
              event.stopPropagation();
              handleApprove(request);
            }}
          >
            Duyệt
          </Button>
          <Button
            danger
            disabled={isAnyActionLoading}
            onClick={(event) => {
              event.stopPropagation();
              openRejectModal(request);
            }}
          >
            Từ chối
          </Button>
        </Space>
      );
    }
    if (request.status === 'approved') {
      return (
        <Button
          type="primary"
          disabled={isAnyActionLoading}
          onClick={(event) => {
            event.stopPropagation();
            openHandOverModal(request);
          }}
        >
          Ghi nhận mượn
        </Button>
      );
    }
    if (BORROWING_STATUSES.includes(request.status)) {
      return (
        <Button
          type="primary"
          disabled={isAnyActionLoading}
          onClick={(event) => {
            event.stopPropagation();
            openReturnModal(request);
          }}
        >
          Ghi nhận trả
        </Button>
      );
    }
    return (
      <Button
        type={selected ? 'primary' : 'default'}
        disabled={selected && !isMobile}
        onClick={(event) => {
          event.stopPropagation();
          showDetail(request);
        }}
      >
        {selected ? 'Đang xem' : 'Chi tiết'}
      </Button>
    );
  };
  const tabItems = [
    { key: 'all', label: `Tất cả (${counts.all})` },
    { key: 'pending', label: `Chờ duyệt (${counts.pending})` },
    { key: 'approved', label: `Đã duyệt (${counts.approved})` },
    { key: 'borrowed', label: `Đang mượn (${counts.borrowed})` },
    { key: 'returned', label: `Đã trả (${counts.returned})` },
    { key: 'overdue', label: `Quá hạn (${counts.overdue})` }
  ];
  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 500, margin: '0 0 8px', color: '#1A1F1B' }}>
          Xử lý yêu cầu mượn
        </h1>
        <p style={{ color: '#6B6F6C', margin: 0 }}>Duyệt đơn, ghi nhận bàn giao và hoàn trả thiết bị</p>
      </div>
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="CHỜ DUYỆT" value={counts.pending} meta="đơn cần xử lý" featured={counts.pending > 0} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="ĐÃ DUYỆT" value={counts.approved} meta="chờ bàn giao" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="ĐANG MƯỢN" value={counts.borrowed} meta="đơn đang hoạt động" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="QUÁ HẠN" value={counts.overdue} meta="đơn cần nhắc nhở" danger />
        </Col>
      </Row>
      <Tabs activeKey={activeTab} items={tabItems} onChange={(key) => setActiveTab(key as RequestTab)} />
      <style>
        {`
          .admin-request-row-selected > td {
            background: #F8F4EA !important;
            border-top: 1px solid rgba(45, 74, 62, 0.22) !important;
            border-bottom: 1px solid rgba(45, 74, 62, 0.22) !important;
          }
          .admin-request-row-selected > td:first-child {
            border-left: 3px solid #2D4A3E !important;
          }
        `}
      </style>
      <Row gutter={[24, 24]} align="top">
        <Col xs={24} xl={16}>
          <Card variant="borderless" style={{ borderRadius: 14, border: '1px solid #E5DECB' }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
              <Input.Search
                allowClear
                placeholder="Tìm theo tên SV hoặc mã đơn..."
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                style={{ width: 320, maxWidth: '100%' }}
              />
              <RangePicker
                placeholder={['Từ ngày', 'Đến ngày']}
                format="DD/MM/YYYY"
                onChange={(dates) => setDateRange(dates as [Dayjs, Dayjs] | null)}
              />
            </div>
            <Table<AdminRequest>
              rowKey="id"
              loading={{ spinning: loading, tip: 'Đang tải yêu cầu...' }}
              dataSource={filteredRequests}
              pagination={{ pageSize: 8 }}
              scroll={{ x: 'max-content' }}
              rowClassName={(request) => (selectedRequest?.id === request.id ? 'admin-request-row-selected' : '')}
              onRow={(request) => ({
                onClick: () => selectRequest(request, isMobile),
                style: { cursor: 'pointer' }
              })}
          locale={{
            emptyText: requests.length === 0 ? (
              <Empty
                image={<div style={{ fontSize: 80 }}>✅</div>}
                styles={{ image: { height: 96, marginBottom: 16 } }}
                description={
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Không có yêu cầu cần xử lý</h3>
                    <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                      Tất cả yêu cầu mượn đã được xử lý xong.
                    </p>
                  </div>
                }
                style={{ padding: '64px 0' }}
              />
            ) : activeTab === 'pending' ? (
              <Empty
                image={<div style={{ fontSize: 70 }}>✅</div>}
                styles={{ image: { height: 90, marginBottom: 14 } }}
                description={
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Không có đơn chờ duyệt</h3>
                    <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                      Tất cả đơn đã được duyệt hoặc xử lý.
                    </p>
                  </div>
                }
                style={{ padding: '60px 0' }}
              />
            ) : (
              <Empty
                image={<div style={{ fontSize: 64 }}>🔍</div>}
                styles={{ image: { height: 84, marginBottom: 14 } }}
                description={
                  <div>
                    <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Không tìm thấy yêu cầu nào</h3>
                    <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                      Thử đổi tab, từ khoá tìm kiếm hoặc khoảng thời gian khác.
                    </p>
                  </div>
                }
                style={{ padding: '60px 0' }}
              />
            )
          }}
          columns={[
            { title: 'Mã đơn', render: (_, request) => <Typography.Text strong>{getRequestCode(request)}</Typography.Text> },
            {
              title: 'Sinh viên',
              render: (_, request) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar style={{ background: '#2D4A3E', color: '#F5EBD0' }}>{getInitials(request.studentName)}</Avatar>
                  <div>
                    <div style={{ fontWeight: 600 }}>{request.studentName}</div>
                    <div style={{ color: '#9A9D98', fontSize: 12 }}>{request.studentCode}</div>
                  </div>
                </div>
              )
            },
            {
              title: 'Thiết bị',
              render: (_, request) => (
                <span>{getDeviceIcon(request.deviceName)} {request.deviceName} × {request.quantity}</span>
              )
            },
            {
              title: 'Ngày mượn → trả',
              render: (_, request) => `${formatDate(request.borrowDate)} → ${formatDate(request.returnDate)}`
            },
            {
              title: 'Mục đích',
              render: (_, request) => <Typography.Text style={{ color: '#6B6F6C' }}>{ellipsisText(request.purpose || request.note || '—')}</Typography.Text>
            },
            { title: 'Trạng thái', dataIndex: 'status', render: (status: RequestStatus) => <StatusTag status={status} /> },
            { title: 'Hành động', align: 'right', render: (_, request) => actionButtons(request) }
          ]}
            />
          </Card>
        </Col>
        <Col xs={24} xl={8} style={{ display: isMobile ? 'none' : undefined }}>
          <div ref={detailPanelRef} tabIndex={-1} style={{ outline: 'none' }}>
            <Card
              variant="borderless"
              style={{ borderRadius: 14, border: '1px solid #E5DECB', position: 'sticky', top: 24 }}
              title={<span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 500 }}>Chi tiết xử lý</span>}
            >
              <RequestDetailPanel request={selectedRequest} actions={actionButtons} />
            </Card>
          </div>
        </Col>
      </Row>
      <Modal
        title={
          selectedRequest ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', paddingRight: 24 }}>
              <span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 500 }}>{getRequestCode(selectedRequest)}</span>
              <StatusTag status={selectedRequest.status} />
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
        <RequestDetailPanel request={selectedRequest} actions={actionButtons} />
        <Button block style={{ marginTop: 14, height: 42 }} onClick={() => setDetailModalOpen(false)}>
          Quay lại danh sách
        </Button>
      </Modal>
      <Modal
        title={`Từ chối yêu cầu ${rejectTarget ? getRequestCode(rejectTarget) : ''}`}
        open={Boolean(rejectTarget)}
        okText="Xác nhận từ chối"
        cancelText="Huỷ"
        confirmLoading={Boolean(rejectTarget && isActionLoading('reject', rejectTarget.id))}
        okButtonProps={{ danger: true, disabled: isAnyActionLoading && !Boolean(rejectTarget && isActionLoading('reject', rejectTarget.id)) }}
        onOk={() => rejectForm.submit()}
        onCancel={() => setRejectTarget(undefined)}
      >
        <Form<RejectFormValues> form={rejectForm} layout="vertical" onFinish={handleReject}>
          <Form.Item name="reason" label="Lý do từ chối" rules={[{ required: true, whitespace: true, message: 'Nhập lý do từ chối' }]}>
            <Input.TextArea rows={4} placeholder="Nhập lý do từ chối..." />
          </Form.Item>
        </Form>
      </Modal>
      <Modal
        title="Ghi nhận bàn giao thiết bị"
        open={Boolean(handoverTarget)}
        okText="Xác nhận"
        cancelText="Huỷ"
        confirmLoading={Boolean(handoverTarget && isActionLoading('handover', handoverTarget.id))}
        okButtonProps={{ disabled: !handoverChecked || (isAnyActionLoading && !Boolean(handoverTarget && isActionLoading('handover', handoverTarget.id))) }}
        onOk={handleHandOver}
        onCancel={() => setHandoverTarget(undefined)}
      >
        {handoverTarget && (
          <div style={{ lineHeight: 1.8 }}>
            <div>Sinh viên: <strong>{handoverTarget.studentName}</strong></div>
            <div>Thiết bị: <strong>{handoverTarget.deviceName} × {handoverTarget.quantity}</strong></div>
            <div>Ngày trả dự kiến: <strong>{formatDate(handoverTarget.returnDate, 'DD/MM/YYYY')}</strong></div>
          </div>
        )}
        <Checkbox checked={handoverChecked} onChange={(event) => setHandoverChecked(event.target.checked)} style={{ marginTop: 16 }}>
          Tôi xác nhận đã bàn giao đầy đủ thiết bị cho sinh viên
        </Checkbox>
      </Modal>
      <Modal
        title="Ghi nhận hoàn trả thiết bị"
        open={Boolean(returnTarget)}
        okText="Xác nhận trả"
        cancelText="Huỷ"
        confirmLoading={Boolean(returnTarget && isActionLoading('return', returnTarget.id))}
        onOk={() => returnForm.submit()}
        onCancel={() => setReturnTarget(undefined)}
      >
        {returnTarget && (
          <div style={{ lineHeight: 1.8, marginBottom: 12 }}>
            <div>Sinh viên: <strong>{returnTarget.studentName}</strong></div>
            <div>Thiết bị: <strong>{returnTarget.deviceName} × {returnTarget.quantity}</strong></div>
          </div>
        )}
        <Form<ReturnFormValues> form={returnForm} layout="vertical" onFinish={handleReturn}>
          <Form.Item name="condition" label="Tình trạng thiết bị" rules={[{ required: true, message: 'Chọn tình trạng thiết bị' }]}>
            <Radio.Group>
              <Space direction="vertical">
                {RETURN_CONDITIONS.map((condition) => (
                  <Radio key={condition.label} value={condition.value}>
                    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                      <span>{condition.label}</span>
                      <Tag style={{ margin: 0, color: condition.tone, borderColor: condition.tone }}>{condition.points}</Tag>
                    </span>
                  </Radio>
                ))}
              </Space>
            </Radio.Group>
          </Form.Item>
          <Form.Item name="note" label="Ghi chú">
            <Input.TextArea rows={3} placeholder="Ghi chú tình trạng thực tế..." />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
