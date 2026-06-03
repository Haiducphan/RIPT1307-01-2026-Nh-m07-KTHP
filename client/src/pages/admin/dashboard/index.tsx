import { useMemo } from 'react';
import type { ReactNode } from 'react';
import { AppstoreOutlined, ClockCircleOutlined, TeamOutlined, WarningOutlined } from '@ant-design/icons';
import { Card, Col, Empty, Row, Skeleton, Table, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBorrowRequests } from '@/services/borrowRequests';
import type { NormalizedBorrowRequest } from '@/services/borrowRequests';
import { getDeviceStats, getRequestStats, getStatsStudentSummary } from '@/services/statistics';
import { BORROW_STATUS_COLOR, BORROW_STATUS_LABEL } from '@/constants/borrowStatus';

function formatDateTime(value?: string) {
  if (!value) return 'Chưa có dữ liệu';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : value;
}

function StatCard({ title, value, meta, icon, accent = '#2D4A3E', danger }: { title: string; value: number; meta: string; icon: ReactNode; accent?: string; danger?: boolean }) {
  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 12, border: danger ? '1px solid #B05A4D' : '1px solid #E5DECB', height: '100%' }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ color: '#6B6F6C', fontSize: 11, letterSpacing: 0, textTransform: 'uppercase' }}>{title}</div>
        <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', color: accent, background: `${accent}14`, fontSize: 18 }}>
          {icon}
        </div>
      </div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, lineHeight: 1.1, color: danger ? '#B05A4D' : '#1A1F1B', marginTop: 12 }}>
        {value.toLocaleString('vi-VN')}
      </div>
      <div style={{ color: '#6B6F6C', fontSize: 12 }}>{meta}</div>
    </Card>
  );
}

function getStatusTag(status: string) {
  const key = status as keyof typeof BORROW_STATUS_LABEL;
  return <Tag color={BORROW_STATUS_COLOR[key] ?? 'default'}>{BORROW_STATUS_LABEL[key] ?? (status || 'Chưa có dữ liệu')}</Tag>;
}

export default function AdminDashboardPage() {
  const { data: deviceStats, loading: deviceLoading } = useAsyncData(getDeviceStats, []);
  const { data: requestStats, loading: requestStatsLoading } = useAsyncData(getRequestStats, []);
  const { data: studentStats, loading: studentLoading } = useAsyncData(getStatsStudentSummary, []);
  const { data: requests = [], loading: requestLoading } = useAsyncData(() => getBorrowRequests({ page: 1, limit: 6 }), []);
  const loading = deviceLoading || requestStatsLoading || studentLoading || requestLoading;

  const requestSummary = useMemo(() => {
    const recentRequests = [...requests]
      .sort((a, b) => dayjs(b.createdAt || b.borrowDate).valueOf() - dayjs(a.createdAt || a.borrowDate).valueOf())
      .slice(0, 6);

    return {
      pendingCount: requestStats?.pendingCount ?? 0,
      activeBorrowing: requestStats?.borrowingCount ?? 0,
      overdueCount: requestStats?.overdueCount ?? 0,
      recentRequests
    };
  }, [requestStats?.borrowingCount, requestStats?.overdueCount, requestStats?.pendingCount, requests]);

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 500, margin: '0 0 8px', color: '#1A1F1B' }}>
          Dashboard admin
        </h1>
        <p style={{ color: '#6B6F6C', margin: 0 }}>Tổng quan vận hành hệ thống mượn thiết bị</p>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Tổng thiết bị" value={deviceStats?.sumTotal ?? 0} meta={`${deviceStats?.totalDeviceTypes ?? 0} loại đang hoạt động`} icon={<AppstoreOutlined />} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Yêu cầu chờ xử lý" value={requestSummary.pendingCount} meta="đơn cần xét duyệt" icon={<ClockCircleOutlined />} accent="#8B6A1F" danger={requestSummary.pendingCount > 0} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard
            title="Đang mượn / Quá hạn"
            value={requestSummary.activeBorrowing + requestSummary.overdueCount}
            meta={`${requestSummary.activeBorrowing} đang mượn · ${requestSummary.overdueCount} quá hạn`}
            icon={<WarningOutlined />}
            accent="#B05A4D"
            danger={requestSummary.overdueCount > 0}
          />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <StatCard title="Tài khoản sinh viên" value={studentStats?.totalStudents ?? 0} meta={`${studentStats?.currentlyBorrowing ?? 0} sinh viên đang mượn`} icon={<TeamOutlined />} accent="#355D8E" />
        </Col>
      </Row>

      <Card
        title={<span style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 500 }}>Hoạt động gần đây</span>}
        variant="borderless"
        style={{ borderRadius: 14, border: '1px solid #E5DECB' }}
      >
        {loading ? (
          <Skeleton active paragraph={{ rows: 5 }} />
        ) : requestSummary.recentRequests.length === 0 ? (
          <Empty
            description={
              <div>
                <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chưa có dữ liệu</h3>
                <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>Chưa có hoạt động gần đây.</p>
              </div>
            }
            style={{ padding: '56px 0' }}
          />
        ) : (
          <Table<NormalizedBorrowRequest>
            rowKey="id"
            dataSource={requestSummary.recentRequests}
            pagination={false}
            scroll={{ x: 760 }}
            columns={[
              {
                title: 'Yêu cầu',
                render: (_, request) => (
                  <div>
                    <Typography.Text strong>{request.requestCode}</Typography.Text>
                    <div style={{ color: '#8A8E88', fontSize: 12 }}>{formatDateTime(request.createdAt)}</div>
                  </div>
                )
              },
              { title: 'Sinh viên', render: (_, request) => `${request.studentName} · ${request.studentCode || 'Chưa có MSSV'}` },
              { title: 'Thiết bị', render: (_, request) => `${request.deviceName} × ${request.quantity}` },
              { title: 'Trạng thái', dataIndex: 'status', render: (status: string) => getStatusTag(status) }
            ]}
          />
        )}
      </Card>
    </div>
  );
}
