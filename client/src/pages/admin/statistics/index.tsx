import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Alert, Card, Col, Progress, Row, Select, Skeleton, Table, Tabs, Tag, Typography } from 'antd';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ChartTooltip,
  XAxis,
  YAxis
} from 'recharts';
import {
  BarChartOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  FieldTimeOutlined,
  FireOutlined,
  ProfileOutlined,
  TeamOutlined,
  WarningOutlined
} from '@ant-design/icons';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import AdminTableCard from '@/components/admin/AdminTableCard';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getDeviceStats,
  getRequestStats,
  getStatsStudentSummary,
  getTimeTrendStats
} from '@/services/statistics';
import type { DeviceStats, RequestStats, StudentStatsSummary, TimeTrendStat, TopDeviceStat, TopStudentStat } from '@/services/statistics';

const now = new Date();
const REQUEST_COLORS = ['#2D4A3E', '#C99A3F', '#355D8E', '#9B3E33', '#B05A4D', '#8A8E88', '#6B6F6C'];
type TrendRow = TimeTrendStat & { label: string };

function formatNumber(value?: number) {
  return Number(value ?? 0).toLocaleString('vi-VN');
}

function formatPercent(value: number) {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function monthLabel(row: TimeTrendStat) {
  if (!row.month || !row.year) return 'Chưa có thời gian';
  return `Tháng ${row.month}/${row.year}`;
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

function SectionCard({ title, subtitle, children }: { title: ReactNode; subtitle?: string; children: ReactNode }) {
  return (
    <Card
      title={
        <div>
          <div style={{ fontFamily: 'Georgia, serif', fontSize: 20, fontWeight: 500, color: '#1A1F1B' }}>{title}</div>
          {subtitle ? <div style={{ color: '#6B6F6C', fontSize: 12, marginTop: 4 }}>{subtitle}</div> : null}
        </div>
      }
      variant="borderless"
      style={{ borderRadius: 14, border: '1px solid #E5DECB', height: '100%', boxShadow: '0 1px 2px rgba(45, 74, 62, 0.04)' }}
      styles={{ body: { padding: 18 } }}
    >
      {children}
    </Card>
  );
}

function InsightCard({ title, value, description, tone = '#2D4A3E' }: { title: string; value: string; description: string; tone?: string }) {
  return (
    <div style={{ border: '1px solid #E5DECB', borderRadius: 12, padding: 16, background: '#FFFFFF' }}>
      <div style={{ color: '#6B6F6C', fontSize: 12, marginBottom: 8 }}>{title}</div>
      <div style={{ color: tone, fontWeight: 800, fontSize: 22, lineHeight: 1.1 }}>{value}</div>
      <div style={{ color: '#6B6F6C', fontSize: 12, marginTop: 8 }}>{description}</div>
    </div>
  );
}

function LoadingBlock() {
  return (
    <Card variant="borderless" style={{ borderRadius: 14, border: '1px solid #E5DECB' }}>
      <Skeleton active paragraph={{ rows: 6 }} />
    </Card>
  );
}

function RankedDeviceList({ devices }: { devices: TopDeviceStat[] }) {
  const maxBorrows = Math.max(...devices.map((device) => device.totalBorrows), 1);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {devices.map((device, index) => {
        const percent = Math.round((device.totalBorrows / maxBorrows) * 100);
        return (
          <div key={device.equipmentId || device.name} style={{ border: '1px solid #E5DECB', borderRadius: 12, padding: 16, background: '#FFFDF8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ minWidth: 0 }}>
                <Tag color={index === 0 ? 'gold' : 'default'} style={{ marginBottom: 8 }}>
                  Hạng {index + 1}
                </Tag>
                <Typography.Text strong ellipsis style={{ display: 'block', color: '#1A1F1B', fontSize: 15 }}>
                  {device.name}
                </Typography.Text>
                <Typography.Text style={{ color: '#6B6F6C', fontSize: 12 }}>
                  {device.code || 'Chưa có mã thiết bị'}
                </Typography.Text>
              </div>
              <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#2D4A3E' }}>{formatNumber(device.totalBorrows)}</div>
                <div style={{ color: '#6B6F6C', fontSize: 12 }}>lượt mượn</div>
              </div>
            </div>
            <Progress percent={percent} showInfo={false} strokeColor="#2D4A3E" trailColor="#EFEADA" style={{ marginTop: 12 }} />
          </div>
        );
      })}
    </div>
  );
}

function DeviceSection({ data, loading }: { data?: DeviceStats; loading: boolean }) {
  const topDevices = data?.topDevices ?? [];
  const hasSummary = Boolean((data?.totalDeviceTypes ?? 0) || (data?.sumTotal ?? 0) || (data?.sumBorrowing ?? 0));
  const useChart = topDevices.length >= 3;

  if (loading) return <LoadingBlock />;

  if (!hasSummary && topDevices.length === 0) {
    return <AdminEmptyState title="Chưa có dữ liệu mượn thiết bị." description="Khi có lượt mượn mới, thống kê thiết bị sẽ được cập nhật tại đây." />;
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <AdminStatCard title="Loại thiết bị" value={data?.totalDeviceTypes ?? 0} meta="thiết bị đang hoạt động" icon={<DatabaseOutlined />} />
        </Col>
        <Col xs={24} sm={8}>
          <AdminStatCard title="Tổng số lượng" value={data?.sumTotal ?? 0} meta="tổng tồn kho hiện có" icon={<ProfileOutlined />} accent="#355D8E" />
        </Col>
        <Col xs={24} sm={8}>
          <AdminStatCard title="Đang cho mượn" value={data?.sumBorrowing ?? 0} meta="số lượng đang được sử dụng" icon={<FireOutlined />} danger={(data?.sumBorrowing ?? 0) > 0} accent="#B05A4D" />
        </Col>
      </Row>

      {topDevices.length === 0 ? (
        <AdminEmptyState title="Chưa có dữ liệu mượn thiết bị." description="Danh sách top thiết bị sẽ rõ hơn khi có thêm yêu cầu mượn." />
      ) : (
        <Row gutter={[18, 18]} align="top">
          <Col xs={24} xl={useChart ? 14 : 10}>
            <SectionCard
              title="Top thiết bị được mượn nhiều"
              subtitle={useChart ? 'Biểu đồ hiển thị các thiết bị nổi bật trong kỳ.' : 'Dữ liệu còn ít nên ưu tiên danh sách xếp hạng dễ đọc.'}
            >
              {useChart ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={topDevices} layout="vertical" margin={{ left: 18, right: 16 }}>
                    <CartesianGrid stroke="#EFEADA" strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                    <ChartTooltip />
                    <Bar dataKey="totalBorrows" name="Lượt mượn" fill="#2D4A3E" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <RankedDeviceList devices={topDevices} />
              )}
            </SectionCard>
          </Col>
          <Col xs={24} xl={useChart ? 10 : 14}>
            <AdminTableCard title="Chi tiết thiết bị">
              <Table<TopDeviceStat>
                rowKey={(record) => record.equipmentId || record.name}
                dataSource={topDevices}
                pagination={false}
                size="middle"
                scroll={{ x: 560 }}
                locale={{
                  emptyText: <AdminEmptyState title="Chưa có dữ liệu mượn thiết bị." />
                }}
                columns={[
                  {
                    title: 'Thiết bị',
                    render: (_, record) => (
                      <div>
                        <Typography.Text strong>{record.name}</Typography.Text>
                        <div style={{ color: '#8A8E88', fontSize: 12 }}>{record.code || 'Chưa có mã thiết bị'}</div>
                      </div>
                    )
                  },
                  { title: 'Còn lại', dataIndex: 'availableQuantity', width: 110, render: (value: number) => formatNumber(value) },
                  {
                    title: 'Lượt mượn',
                    dataIndex: 'totalBorrows',
                    width: 120,
                    render: (value: number) => <Typography.Text strong>{formatNumber(value)}</Typography.Text>
                  }
                ]}
              />
            </AdminTableCard>
          </Col>
        </Row>
      )}
    </div>
  );
}

function getRequestBreakdown(data?: RequestStats) {
  const totalRequests = data?.totalRequests ?? 0;
  const knownStatusCount =
    (data?.approvedCount ?? 0) +
    (data?.rejectedCount ?? 0) +
    (data?.pendingCount ?? 0) +
    (data?.borrowingCount ?? 0) +
    (data?.overdueCount ?? 0);
  const otherCount = Math.max(totalRequests - knownStatusCount, 0);

  return [
    { key: 'approved', name: 'Đã duyệt', value: data?.approvedCount ?? 0, color: '#2D4A3E' },
    { key: 'rejected', name: 'Từ chối', value: data?.rejectedCount ?? 0, color: '#9B3E33' },
    { key: 'pending', name: 'Chờ xử lý', value: data?.pendingCount ?? 0, color: '#C99A3F' },
    { key: 'borrowing', name: 'Đang mượn', value: data?.borrowingCount ?? 0, color: '#355D8E' },
    { key: 'overdue', name: 'Quá hạn', value: data?.overdueCount ?? 0, color: '#B05A4D' },
    ...(otherCount > 0 ? [{ key: 'other', name: 'Khác', value: otherCount, color: '#8A8E88' }] : [])
  ];
}

function RequestBreakdownList({ rows, totalRequests }: { rows: ReturnType<typeof getRequestBreakdown>; totalRequests: number }) {
  const visibleRows = rows.filter((row) => row.value > 0);
  const displayRows = visibleRows.length > 0 ? visibleRows : rows.filter((row) => row.key !== 'other');

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {displayRows.map((row) => {
        const percent = totalRequests > 0 ? Math.round((row.value / totalRequests) * 100) : 0;
        return (
          <div key={row.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
              <Typography.Text style={{ color: '#1A1F1B' }}>{row.name}</Typography.Text>
              <Typography.Text strong>{formatNumber(row.value)} lượt</Typography.Text>
            </div>
            <Progress percent={percent} showInfo={false} strokeColor={row.color} trailColor="#EFEADA" />
          </div>
        );
      })}
    </div>
  );
}

function RequestInsight({ data, activeStatusCount }: { data?: RequestStats; activeStatusCount: number }) {
  const totalRequests = data?.totalRequests ?? 0;
  const approvedCount = data?.approvedCount ?? 0;
  const rejectedCount = data?.rejectedCount ?? 0;
  const overdueCount = data?.overdueCount ?? 0;
  const approvalRate = totalRequests > 0 ? formatPercent((approvedCount / totalRequests) * 100) : 'Chưa có dữ liệu';
  let description = 'Chưa có dữ liệu đủ để so sánh nhiều trạng thái.';

  if (totalRequests > 0 && activeStatusCount > 1) {
    description = overdueCount > 0 ? 'Có đơn quá hạn cần được ưu tiên theo dõi.' : 'Phân bổ trạng thái đang rõ ràng hơn trong kỳ này.';
  } else if (totalRequests > 0 && rejectedCount === 0) {
    description = 'Chưa có đơn bị từ chối trong kỳ này.';
  }

  return <InsightCard title="Nhận định nhanh" value={`Tỉ lệ duyệt hiện tại: ${approvalRate}`} description={description} tone={overdueCount > 0 ? '#B05A4D' : '#2D4A3E'} />;
}

function RequestSection({ data, loading }: { data?: RequestStats; loading: boolean }) {
  const totalRequests = data?.totalRequests ?? 0;
  const breakdownRows = getRequestBreakdown(data);
  const chartData = breakdownRows.filter((item) => item.value > 0);
  const showPie = chartData.length >= 2;
  const approvalRate = totalRequests > 0 ? formatPercent(((data?.approvedCount ?? 0) / totalRequests) * 100) : 'Chưa có dữ liệu';

  if (loading) return <LoadingBlock />;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={8}>
          <AdminStatCard title="Tổng yêu cầu" value={totalRequests} meta="trong tháng đã chọn" icon={<ProfileOutlined />} />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <AdminStatCard title="Đã duyệt" value={data?.approvedCount ?? 0} meta={`tỉ lệ duyệt: ${approvalRate}`} icon={<CheckCircleOutlined />} accent="#2D4A3E" />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <AdminStatCard title="Từ chối" value={data?.rejectedCount ?? 0} meta={(data?.rejectedCount ?? 0) > 0 ? 'cần xem lại lý do từ chối' : 'chưa phát sinh trong kỳ'} icon={<WarningOutlined />} danger={(data?.rejectedCount ?? 0) > 0} accent="#9B3E33" />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <AdminStatCard title="Chờ xử lý" value={data?.pendingCount ?? 0} meta="đang chờ admin xử lý" icon={<ClockCircleOutlined />} danger={(data?.pendingCount ?? 0) > 0} accent="#C99A3F" />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <AdminStatCard title="Đang mượn" value={data?.borrowingCount ?? 0} meta="đơn đang được sử dụng" icon={<FieldTimeOutlined />} accent="#355D8E" />
        </Col>
        <Col xs={24} sm={12} xl={8}>
          <AdminStatCard title="Quá hạn" value={data?.overdueCount ?? 0} meta={(data?.overdueCount ?? 0) > 0 ? 'cần nhắc trả' : 'không có đơn quá hạn'} icon={<WarningOutlined />} danger={(data?.overdueCount ?? 0) > 0} accent="#B05A4D" />
        </Col>
      </Row>

      <Row gutter={[18, 18]} align="top">
        <Col xs={24} xl={showPie ? 12 : 14}>
          <SectionCard title="Phân bổ trạng thái yêu cầu" subtitle={showPie ? 'Biểu đồ chỉ hiển thị khi có nhiều trạng thái cùng phát sinh.' : 'Dữ liệu hiện ít nên hiển thị dạng thanh để dễ đọc hơn.'}>
            {totalRequests === 0 ? (
              <AdminEmptyState title="Chưa có dữ liệu yêu cầu trong tháng đã chọn." />
            ) : showPie ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" outerRadius={86} label>
                    {chartData.map((entry, index) => (
                      <Cell key={entry.name} fill={REQUEST_COLORS[index % REQUEST_COLORS.length]} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                  <Legend verticalAlign="bottom" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <RequestBreakdownList rows={breakdownRows} totalRequests={totalRequests} />
            )}
          </SectionCard>
        </Col>
        <Col xs={24} xl={showPie ? 12 : 10}>
          <div style={{ display: 'grid', gap: 14 }}>
            <RequestInsight data={data} activeStatusCount={chartData.length} />
            {showPie ? (
              <SectionCard title="Breakdown theo trạng thái">
                <RequestBreakdownList rows={breakdownRows} totalRequests={totalRequests} />
              </SectionCard>
            ) : null}
          </div>
        </Col>
      </Row>
    </div>
  );
}

function StudentSection({ data, loading }: { data?: StudentStatsSummary; loading: boolean }) {
  const topStudents = data?.topStudents ?? [];
  const totalStudents = data?.totalStudents ?? 0;
  const currentlyBorrowing = data?.currentlyBorrowing ?? 0;
  const borrowingRate = totalStudents > 0 ? formatPercent((currentlyBorrowing / totalStudents) * 100) : '0%';

  if (loading) return <LoadingBlock />;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <AdminStatCard title="Tổng sinh viên" value={totalStudents} meta="tài khoản sinh viên" icon={<TeamOutlined />} />
        </Col>
        <Col xs={24} sm={8}>
          <AdminStatCard title="Sinh viên đang mượn" value={currentlyBorrowing} meta="có đơn đang sử dụng" icon={<FieldTimeOutlined />} danger={currentlyBorrowing > 0} accent="#355D8E" />
        </Col>
        <Col xs={24} sm={8}>
          <AdminStatCard title="Tỉ lệ đang mượn" value={borrowingRate} meta="so với tổng sinh viên" icon={<BarChartOutlined />} accent="#C99A3F" />
        </Col>
      </Row>

      <AdminTableCard title="Top sinh viên theo lượt mượn">
        {topStudents.length === 0 ? (
          <AdminEmptyState title="Chưa có dữ liệu sinh viên." description="Bảng xếp hạng sẽ xuất hiện khi sinh viên phát sinh lịch sử mượn." />
        ) : (
          <Table<TopStudentStat>
            rowKey="id"
            dataSource={topStudents}
            pagination={false}
            scroll={{ x: 760 }}
            columns={[
              {
                title: 'Hạng',
                width: 82,
                render: (_, __, index) => (
                  <Tag color={index === 0 ? 'gold' : 'default'} style={{ fontWeight: 700 }}>
                    #{index + 1}
                  </Tag>
                )
              },
              {
                title: 'Sinh viên',
                render: (_, student) => (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', display: 'grid', placeItems: 'center', background: '#2D4A3E', color: '#F5EBD0', fontWeight: 700 }}>
                      {getInitials(student.fullName)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#1A1F1B' }}>{student.fullName}</div>
                      <div style={{ color: '#8A8E88', fontSize: 12 }}>{student.studentCode}</div>
                    </div>
                  </div>
                )
              },
              {
                title: 'Điểm uy tín',
                dataIndex: 'trustScore',
                width: 190,
                render: (value: number) => (
                  <div>
                    <Typography.Text strong>{formatNumber(value)} điểm</Typography.Text>
                    <Progress percent={Math.max(0, Math.min(100, value))} showInfo={false} strokeColor="#C99A3F" trailColor="#EFEADA" size="small" />
                  </div>
                )
              },
              {
                title: 'Tổng mượn',
                dataIndex: 'totalBorrowed',
                width: 150,
                render: (value: number) =>
                  value > 0 ? <Typography.Text strong>{formatNumber(value)} lượt</Typography.Text> : <Typography.Text type="secondary">Chưa phát sinh</Typography.Text>
              },
              {
                title: 'Trễ hạn',
                dataIndex: 'totalLate',
                width: 110,
                render: (value: number) => <Tag color={value > 0 ? 'red' : 'green'}>{formatNumber(value)}</Tag>
              }
            ]}
          />
        )}
      </AdminTableCard>
    </div>
  );
}

function TrendMonthList({ rows }: { rows: TrendRow[] }) {
  const maxRequests = Math.max(...rows.map((row) => row.totalRequests), 1);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {rows.map((row) => {
        const percent = Math.round((row.totalRequests / maxRequests) * 100);
        return (
          <div key={`${row.year}-${row.month}`} style={{ border: '1px solid #E5DECB', borderRadius: 12, padding: 14, background: '#FFFDF8' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
              <Typography.Text strong>{row.label}</Typography.Text>
              <Typography.Text strong>{formatNumber(row.totalRequests)} yêu cầu</Typography.Text>
            </div>
            <Progress percent={percent} showInfo={false} strokeColor="#2D4A3E" trailColor="#EFEADA" />
          </div>
        );
      })}
    </div>
  );
}

function TimeSection({ data, loading }: { data?: TimeTrendStat[]; loading: boolean }) {
  const trendData = useMemo(
    () =>
      [...(data ?? [])]
        .filter((row) => row.month && row.year)
        .sort((a, b) => a.year - b.year || a.month - b.month)
        .map((row) => ({ ...row, label: monthLabel(row) })),
    [data]
  );
  const hasEnoughTrend = trendData.length >= 3;

  if (loading) return <LoadingBlock />;

  if (trendData.length === 0) {
    return <AdminEmptyState title="Chưa có dữ liệu thống kê theo thời gian." description="Khi có yêu cầu ở các tháng tiếp theo, xu hướng sẽ được cập nhật rõ hơn." />;
  }

  return (
    <Row gutter={[18, 18]} align="top">
      <Col xs={24} xl={hasEnoughTrend ? 15 : 11}>
        <SectionCard title="Xu hướng yêu cầu theo thời gian" subtitle={hasEnoughTrend ? 'Theo dõi biến động yêu cầu qua từng tháng.' : 'Dữ liệu hiện ít nên hiển thị theo danh sách tháng.'}>
          {hasEnoughTrend ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid stroke="#EFEADA" strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} />
                <ChartTooltip />
                <Legend />
                <Line type="monotone" dataKey="totalRequests" name="Tổng yêu cầu" stroke="#2D4A3E" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <TrendMonthList rows={trendData} />
          )}
        </SectionCard>
      </Col>
      <Col xs={24} xl={hasEnoughTrend ? 9 : 13}>
        <div style={{ display: 'grid', gap: 14 }}>
          {!hasEnoughTrend ? (
            <Alert
              showIcon
              type="info"
              message="Chưa đủ dữ liệu để phân tích xu hướng dài hạn"
              description="Hệ thống sẽ hiển thị biểu đồ rõ hơn khi có thêm dữ liệu các tháng tiếp theo."
              style={{ borderRadius: 12, border: '1px solid #D9E6DD', background: '#F7FBF8' }}
            />
          ) : null}
          <AdminTableCard title="Dữ liệu theo tháng">
            <Table<TrendRow>
              rowKey={(record) => `${record.year}-${record.month}`}
              dataSource={trendData}
              pagination={false}
              size="middle"
              columns={[
                { title: 'Tháng', dataIndex: 'label' },
                { title: 'Tổng yêu cầu', dataIndex: 'totalRequests', align: 'right', render: (value: number) => <Typography.Text strong>{formatNumber(value)}</Typography.Text> }
              ]}
            />
          </AdminTableCard>
        </div>
      </Col>
    </Row>
  );
}

function OverviewSection({
  deviceStats,
  requestStats,
  studentStats
}: {
  deviceStats?: DeviceStats;
  requestStats?: RequestStats;
  studentStats?: StudentStatsSummary;
}) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'baseline', marginBottom: 12, flexWrap: 'wrap' }}>
        <Typography.Title level={4} style={{ margin: 0, fontFamily: 'Georgia, serif', fontWeight: 500 }}>
          Tổng quan nhanh
        </Typography.Title>
        <Typography.Text style={{ color: '#6B6F6C', fontSize: 13 }}>Các chỉ số vận hành chính trong kỳ đang xem</Typography.Text>
      </div>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Tổng thiết bị đang hoạt động" value={deviceStats?.totalDeviceTypes ?? 0} meta="loại thiết bị active" icon={<DatabaseOutlined />} featured />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Tổng lượt yêu cầu" value={requestStats?.totalRequests ?? 0} meta="theo tháng đã chọn" icon={<ProfileOutlined />} accent="#355D8E" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Sinh viên đang mượn" value={studentStats?.currentlyBorrowing ?? 0} meta="tài khoản có đơn active" icon={<TeamOutlined />} accent="#C99A3F" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Số lượng đang cho mượn" value={deviceStats?.sumBorrowing ?? 0} meta="từ kho thiết bị" icon={<FieldTimeOutlined />} danger={(deviceStats?.sumBorrowing ?? 0) > 0} accent="#B05A4D" />
        </Col>
      </Row>
    </div>
  );
}

export default function AdminStatisticsPage() {
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const monthParams = useMemo(() => ({ month, year }), [month, year]);
  const { data: deviceStats, loading: deviceLoading } = useAsyncData(() => getDeviceStats(monthParams), [month, year]);
  const { data: requestStats, loading: requestLoading } = useAsyncData(() => getRequestStats(monthParams), [month, year]);
  const { data: studentStats, loading: studentLoading } = useAsyncData(getStatsStudentSummary, []);
  const { data: timeStats, loading: timeLoading } = useAsyncData(getTimeTrendStats, []);
  const yearOptions = Array.from({ length: 4 }, (_, index) => {
    const value = now.getFullYear() - index;
    return { value, label: String(value) };
  });

  return (
    <div style={{ paddingBottom: 48 }}>
      <AdminPageHeader
        title="Thống kê hệ thống"
        description="Dữ liệu thống kê vận hành theo thiết bị, yêu cầu, sinh viên và thời gian"
        actions={
          <>
            <Select
              value={month}
              onChange={setMonth}
              style={{ width: 130 }}
              options={Array.from({ length: 12 }, (_, index) => ({ value: index + 1, label: `Tháng ${index + 1}` }))}
            />
            <Select value={year} onChange={setYear} style={{ width: 120 }} options={yearOptions} />
          </>
        }
      />

      <OverviewSection deviceStats={deviceStats} requestStats={requestStats} studentStats={studentStats} />

      <Tabs
        items={[
          {
            key: 'devices',
            label: 'Theo thiết bị',
            children: <DeviceSection data={deviceStats} loading={deviceLoading} />
          },
          {
            key: 'requests',
            label: 'Theo yêu cầu',
            children: <RequestSection data={requestStats} loading={requestLoading} />
          },
          {
            key: 'students',
            label: 'Theo sinh viên',
            children: <StudentSection data={studentStats} loading={studentLoading} />
          },
          {
            key: 'time',
            label: 'Theo thời gian',
            children: <TimeSection data={timeStats} loading={timeLoading} />
          }
        ]}
      />
    </div>
  );
}
