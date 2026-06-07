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