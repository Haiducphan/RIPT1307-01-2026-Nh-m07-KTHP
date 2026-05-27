import { Button, Card, Select, Space, Table, Tag } from 'antd';
import { useEffect, useState } from 'react';
import PageTitle from '@/components/PageTitle';
import { getDevices } from '@/services/equipment';
import type { Device } from '@/types';

export default function StudentDevicesPage() {
  const [tier, setTier] = useState<string | undefined>();
  const [conditionStatus, setConditionStatus] = useState<string | undefined>();
  const [page, setPage] = useState(1);
  const [devices, setDevices] = useState<Device[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const fetchDevices = async (t: string | undefined, c: string | undefined, p: number) => {
    setLoading(true);
    try {
      const res = await getDevices({ tier: t, conditionStatus: c, page: p, limit: pageSize });
      setDevices(res.data);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchDevices(tier, conditionStatus, page);
  }, []);

  const handleSearch = () => {
    setPage(1);
    void fetchDevices(tier, conditionStatus, 1);
  };

  return (
    <>
      <PageTitle title="Danh sach thiet bi" description="Sinh vien xem tinh trang va so luong con lai." />
      <Card>
        <Space style={{ marginBottom: 16 }}>
          <Select
            allowClear
            placeholder="Loc theo hang"
            style={{ width: 160 }}
            options={[
              { label: 'Hang S', value: 'S' },
              { label: 'Hang A', value: 'A' },
              { label: 'Hang B', value: 'B' },
              { label: 'Hang C', value: 'C' }
            ]}
            onChange={(val) => setTier(val)}
          />
          <Select
            allowClear
            placeholder="Loc theo tinh trang"
            style={{ width: 180 }}
            options={[
              { label: 'Tot (good)', value: 'good' },
              { label: 'Binh thuong (fair)', value: 'fair' },
              { label: 'Kem (poor)', value: 'poor' }
            ]}
            onChange={(val) => setConditionStatus(val)}
          />
          <Button type="primary" loading={loading} onClick={handleSearch}>
            Tim kiem
          </Button>
        </Space>

        <Table<Device>
          rowKey="id"
          loading={loading}
          dataSource={devices}
          pagination={{
            current: page,
            pageSize,
            total,
            onChange: (p) => {
              setPage(p);
              void fetchDevices(tier, conditionStatus, p);
            },
            showTotal: (t) => `Tong ${t} thiet bi`
          }}
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