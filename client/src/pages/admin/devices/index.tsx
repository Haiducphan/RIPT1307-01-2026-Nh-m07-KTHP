import { Button, Card, Space, Table, Tag } from 'antd';
import PageTitle from '@/components/PageTitle';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getDevices } from '@/services/devices';
import type { Device } from '@/types';

export default function AdminDevicesPage() {
  const { data, loading } = useAsyncData(getDevices);

  return (
    <>
      <div className="page-toolbar">
        <PageTitle title="Quan ly kho thiet bi" description="Them, sua, xoa va cap nhat so luong ton kho." />
        <Button type="primary">Them thiet bi</Button>
      </div>
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
              render: (status: Device['status']) => <Tag>{status}</Tag>
            },
            {
              title: 'Thao tac',
              render: () => (
                <Space>
                  <Button size="small">Sua</Button>
                  <Button size="small" danger>
                    Xoa
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
