import { Card, Table, Tag } from 'antd';
import PageTitle from '@/components/PageTitle';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getDevices } from '@/services/equipment';
import type { Device } from '@/types';

export default function StudentDevicesPage() {
  const { data, loading } = useAsyncData(getDevices);
  const devices = data?.data ?? [];

  return (
    <>
      <PageTitle title="Danh sach thiet bi" description="Sinh vien xem tinh trang va so luong con lai." />
      <Card>
        <Table<Device>
          rowKey="id"
          loading={loading}
          dataSource={devices}
          columns={[
            { title: 'Ten thiet bi', dataIndex: 'name' },
            { title: 'Ma', dataIndex: 'code' },
            { title: 'Hang', dataIndex: 'tier' },
            { title: 'Tong so', dataIndex: 'totalQuantity' },
            { title: 'Con lai', dataIndex: 'availableQuantity' },
            { title: 'Dang muon', dataIndex: 'borrowingQuantity' },
            {
              title: 'Tinh trang',
              dataIndex: 'conditionStatus',
              render: (val: string) => (
                <Tag color={val === 'good' ? 'green' : val === 'fair' ? 'orange' : 'red'}>{val}</Tag>
              )
            }
          ]}
        />
      </Card>
    </>
  );
}