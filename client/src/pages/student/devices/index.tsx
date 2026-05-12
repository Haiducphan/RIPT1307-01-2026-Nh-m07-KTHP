import { Card, Table, Tag } from 'antd';
import PageTitle from '@/components/PageTitle';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getDevices } from '@/services/devices';
import type { Device } from '@/types';

export default function StudentDevicesPage() {
  const { data, loading } = useAsyncData(getDevices);

  return (
    <>
      <PageTitle title="Danh sach thiet bi" description="Sinh vien xem tinh trang va so luong con lai." />
      <Card>
        <Table<Device>
          rowKey="id"
          loading={loading}
          dataSource={data || []}
          columns={[
            { title: 'Ten thiet bi', dataIndex: 'name' },
            { title: 'Loai', dataIndex: 'category' },
            { title: 'Tong so', dataIndex: 'totalQuantity' },
            { title: 'Con lai', dataIndex: 'availableQuantity' },
            {
              title: 'Tinh trang',
              dataIndex: 'status',
              render: (status: Device['status']) => (
                <Tag color={status === 'available' ? 'green' : 'orange'}>{status}</Tag>
              )
            }
          ]}
        />
      </Card>
    </>
  );
}
