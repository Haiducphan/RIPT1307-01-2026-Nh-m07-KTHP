import { Button, Card, Space, Table, message } from 'antd';
import PageTitle from '@/components/PageTitle';
import StatusTag from '@/components/StatusTag';
import { useAsyncData } from '@/hooks/useAsyncData';
import { approveBorrowRequest, getBorrowRequests, rejectBorrowRequest } from '@/services/borrowRequests';
import { formatDate } from '@/utils/format';
import type { BorrowRequest } from '@/types';

export default function AdminRequestsPage() {
  const { data, loading, refresh } = useAsyncData(getBorrowRequests);

  const handleApprove = async (id: string) => {
    await approveBorrowRequest(id);
    message.success('Da duyet yeu cau');
    refresh();
  };

  const handleReject = async (id: string) => {
    await rejectBorrowRequest(id);
    message.success('Da tu choi yeu cau');
    refresh();
  };

  return (
    <>
      <PageTitle title="Quan ly yeu cau muon" description="Xem danh sach, duyet hoac tu choi yeu cau." />
      <Card>
        <Table<BorrowRequest>
          rowKey="id"
          loading={loading}
          dataSource={data || []}
          columns={[
            { title: 'Sinh vien', dataIndex: 'studentName' },
            { title: 'Thiet bi', dataIndex: 'deviceName' },
            { title: 'So luong', dataIndex: 'quantity' },
            { title: 'Ngay muon', dataIndex: 'borrowDate', render: formatDate },
            { title: 'Ngay tra', dataIndex: 'returnDate', render: formatDate },
            { title: 'Trang thai', dataIndex: 'status', render: (status) => <StatusTag status={status} /> },
            {
              title: 'Thao tac',
              render: (_, record) => (
                <Space>
                  <Button size="small" type="primary" onClick={() => handleApprove(record.id)}>
                    Duyet
                  </Button>
                  <Button size="small" danger onClick={() => handleReject(record.id)}>
                    Tu choi
                  </Button>
                </Space>
              )
            }
          ]}
        />
      </Card>
    </>
  );
}
