import { Button, Card, Table, message } from 'antd';
import PageTitle from '@/components/PageTitle';
import StatusTag from '@/components/StatusTag';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getBorrowRequests, markReturned } from '@/services/borrowRequests';
import { formatDate } from '@/utils/format';
import type { BorrowRequest } from '@/types';

export default function AdminReturnsPage() {
  const { data, loading, refresh } = useAsyncData(getBorrowRequests);
  const borrowedRequests = (data || []).filter((item) => item.status === 'borrowed' || item.status === 'overdue');

  const handleReturn = async (id: string) => {
    await markReturned(id);
    message.success('Da ghi nhan tra thiet bi');
    refresh();
  };

  return (
    <>
      <PageTitle title="Ghi nhan tra thiet bi" description="Cap nhat yeu cau da tra va so luong trong kho." />
      <Card>
        <Table<BorrowRequest>
          rowKey="id"
          loading={loading}
          dataSource={borrowedRequests}
          columns={[
            { title: 'Sinh vien', dataIndex: 'studentName' },
            { title: 'Thiet bi', dataIndex: 'deviceName' },
            { title: 'Ngay tra du kien', dataIndex: 'returnDate', render: formatDate },
            { title: 'Trang thai', dataIndex: 'status', render: (status) => <StatusTag status={status} /> },
            {
              title: 'Thao tac',
              render: (_, record) => (
                <Button type="primary" size="small" onClick={() => handleReturn(record.id)}>
                  Da tra
                </Button>
              )
            }
          ]}
        />
      </Card>
    </>
  );
}
