import { Card, Table } from 'antd';
import PageTitle from '@/components/PageTitle';
import StatusTag from '@/components/StatusTag';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMyBorrowRequests } from '@/services/borrowRequests';
import { formatDate } from '@/utils/format';
import type { BorrowRequest } from '@/types';

export default function StudentRequestsPage() {
  const { data, loading } = useAsyncData(getMyBorrowRequests);
  const requests = data?.data ?? [];

  return (
    <>
      <PageTitle title="Lich su muon" description="Theo doi cac yeu cau da gui va trang thai xu ly." />
      <Card>
        <Table<BorrowRequest>
          rowKey="id"
          loading={loading}
          dataSource={requests}
          columns={[
            { title: 'Ma don', dataIndex: 'requestCode' },
            { title: 'So luong', dataIndex: 'quantity' },
            { title: 'Ngay muon', dataIndex: 'borrowDate', render: formatDate },
            { title: 'Ngay tra', dataIndex: 'returnDate', render: formatDate },
            { title: 'Trang thai', dataIndex: 'status', render: (status) => <StatusTag status={status} /> }
          ]}
        />
      </Card>
    </>
  );
}