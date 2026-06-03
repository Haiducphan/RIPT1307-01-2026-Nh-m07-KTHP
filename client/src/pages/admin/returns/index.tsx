import { useMemo, useState } from 'react';
import { Button, Col, Empty, Input, Row, Table, message } from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import StatusTag from '@/components/StatusTag';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getReturnableBorrowRequests, markReturned } from '@/services/borrowRequests';
import type { NormalizedBorrowRequest } from '@/services/borrowRequests';
import { formatDate } from '@/utils/format';
import AdminEmptyState from '@/components/admin/AdminEmptyState';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminStatCard from '@/components/admin/AdminStatCard';
import AdminTableCard from '@/components/admin/AdminTableCard';

function normalizeText(value?: string | null) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

function renderDate(value?: string) {
  if (!value) return 'Chưa có dữ liệu';

  const formattedDate = formatDate(value);
  return formattedDate === 'Invalid Date' ? 'Chưa có dữ liệu' : formattedDate;
}

export default function AdminReturnsPage() {
  const { data: returnableRequests = [], loading, refresh } = useAsyncData(getReturnableBorrowRequests);
  const [searchText, setSearchText] = useState('');
  const returningStatuses = new Set(['borrowing', 'overdue']);
  const borrowedRequests = returnableRequests.filter((item) => returningStatuses.has(item.status));
  const filteredRequests = useMemo(() => {
    const keyword = normalizeText(searchText.trim());
    if (!keyword) return borrowedRequests;
    return borrowedRequests.filter((request) =>
      normalizeText(`${request.requestCode} ${request.studentName} ${request.studentCode} ${request.deviceName}`).includes(keyword)
    );
  }, [borrowedRequests, searchText]);
  const borrowingCount = borrowedRequests.filter((item) => item.status === 'borrowing').length;
  const overdueCount = borrowedRequests.filter((item) => item.status === 'overdue').length;

  const handleReturn = async (id: string) => {
    try {
      await markReturned(id, { returnCondition: 'perfect' });
      message.success('Đã ghi nhận trả thiết bị');
      await refresh();
    } catch {
      message.error('Không thể ghi nhận trả thiết bị');
    }
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      <AdminPageHeader title="Ghi nhận trả thiết bị" description="Cập nhật các đơn đang mượn hoặc đã quá hạn." />

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Tổng cần xử lý" value={borrowedRequests.length} meta="đơn cần ghi nhận trả" icon={<CheckCircleOutlined />} />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Đang mượn" value={borrowingCount} meta="đơn trong hạn" icon={<ClockCircleOutlined />} accent="#355D8E" />
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <AdminStatCard title="Quá hạn" value={overdueCount} meta="cần ưu tiên xử lý" icon={<WarningOutlined />} accent="#B05A4D" danger={overdueCount > 0} />
        </Col>
      </Row>

      <AdminTableCard
        extra={
          <Input.Search
            allowClear
            placeholder="Tìm mã đơn, sinh viên, thiết bị..."
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            style={{ width: 320, maxWidth: '100%' }}
          />
        }
      >
        <Table<NormalizedBorrowRequest>
          rowKey="id"
          loading={loading}
          dataSource={filteredRequests}
          locale={{
            emptyText: borrowedRequests.length === 0 ? (
              <AdminEmptyState title="Chưa có đơn cần ghi nhận trả" description="Các đơn đang mượn hoặc quá hạn sẽ xuất hiện tại đây." icon="✓" />
            ) : (
              <Empty description="Không tìm thấy đơn phù hợp" />
            )
          }}
          scroll={{ x: 760 }}
          columns={[
            { title: 'Mã đơn', dataIndex: 'requestCode' },
            { title: 'Sinh viên', render: (_, record) => record.studentName || `Sinh viên #${record.studentId}` },
            { title: 'Thiết bị', render: (_, record) => `${record.deviceName || `Thiết bị #${record.deviceId}`} × ${record.quantity}` },
            { title: 'Ngày mượn', dataIndex: 'borrowDate', render: renderDate },
            { title: 'Ngày trả dự kiến', dataIndex: 'returnDate', render: renderDate },
            { title: 'Trạng thái', dataIndex: 'status', render: (status) => <StatusTag status={status} /> },
            {
              title: 'Thao tác',
              render: (_, record) => (
                <Button type="primary" size="small" onClick={() => handleReturn(record.id)}>
                  Ghi nhận trả
                </Button>
              )
            }
          ]}
        />
      </AdminTableCard>
    </div>
  );
}
