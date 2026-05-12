import { Card, DatePicker, Table } from 'antd';
import dayjs from 'dayjs';
import { useState } from 'react';
import PageTitle from '@/components/PageTitle';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getTopBorrowedDevices } from '@/services/statistics';
import type { StatisticItem } from '@/types';

export default function AdminStatisticsPage() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'));
  const { data, loading } = useAsyncData(() => getTopBorrowedDevices(month), [month]);

  return (
    <>
      <PageTitle title="Thong ke" description="Thong ke thiet bi duoc muon nhieu trong thang." />
      <Card>
        <DatePicker
          picker="month"
          value={dayjs(month)}
          onChange={(value) => setMonth(value ? value.format('YYYY-MM') : dayjs().format('YYYY-MM'))}
          style={{ marginBottom: 16 }}
        />
        <Table<StatisticItem>
          rowKey="deviceId"
          loading={loading}
          dataSource={data || []}
          columns={[
            { title: 'Thiet bi', dataIndex: 'deviceName' },
            { title: 'So luot muon', dataIndex: 'borrowCount' }
          ]}
        />
      </Card>
    </>
  );
}
