import { useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Col,
  Dropdown,
  Empty,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography
} from 'antd';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import { useAsyncData } from '@/hooks/useAsyncData';
import {
  getStudentStats,
  getStudentTrustScoreLogs,
  getStudents,
  restoreStudentTrustScore,
  toggleStudentLock
} from '@/services/students';
import type { StudentRank, StudentRecord, TrustScoreLogRecord } from '@/services/students';

type StudentStatus = 'active' | 'locked' | 'warning';

interface RestoreFormValues {
  points: number;
  reason: string;
}

interface PermanentLockFormValues {
  deduction?: number;
  reason: string;
}

interface UnlockFormValues {
  trustScore: number;
  reason: string;
}

const RANK_CONFIG: Record<StudentRank, { label: string; color: string; bg: string }> = {
  diamond: { label: 'Kim cương', color: '#075985', bg: '#E0F2FE' },
  gold: { label: 'Vàng', color: '#8B6A1F', bg: '#F5EBD0' },
  silver: { label: 'Bạc', color: '#4A5568', bg: '#ECEEF2' },
  bronze: { label: 'Đồng', color: '#8C4A36', bg: '#F7E8DF' },
  pebble: { label: 'Đá cuội', color: '#3F403D', bg: '#EFE9DD' }
};

const STATUS_CONFIG: Record<StudentStatus, { label: string; color: string }> = {
  active: { label: 'Hoạt động', color: 'green' },
  locked: { label: 'Bị khoá', color: 'red' },
  warning: { label: 'Có cảnh báo', color: 'gold' }
};

const TRUST_REASON_LABEL: Record<string, string> = {
  initial: 'Khởi tạo điểm',
  return_ontime: 'Trả đúng hạn',
  streak_3: 'Thưởng chuỗi 3 lần trả tốt',
  streak_5: 'Thưởng chuỗi 5 lần trả tốt',
  admin_manual_add: 'Admin cộng điểm thủ công',
  admin_manual_deduct: 'Admin trừ điểm thủ công',
  cancel_approved: 'Huỷ đơn sau khi đã duyệt',
  noshow: 'Không đến nhận thiết bị',
  late_return: 'Quá hạn trả thiết bị',
  minor_damage: 'Thiết bị hư hỏng nhẹ',
  major_damage: 'Thiết bị hư hỏng nặng hoặc mất'
};

function normalizeText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
}

function getInitials(name: string) {
  return name.split(/\s+/).map((part) => part[0]).slice(-2).join('').toUpperCase();
}

function getStudentStatus(student: StudentRecord): StudentStatus {
  if (student.borrowLocked || student.isPermanentlyLocked) return 'locked';
  if (student.totalLate > 0) return 'warning';
  return 'active';
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa có dữ liệu';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : value;
}

function RankTag({ rank }: { rank: StudentRank }) {
  const config = RANK_CONFIG[rank];
  return <Tag style={{ border: 'none', borderRadius: 999, color: config.color, background: config.bg, fontWeight: 700 }}>{config.label}</Tag>;
}

function StatusTag({ status }: { status: StudentStatus }) {
  const config = STATUS_CONFIG[status];
  return <Tag color={config.color}>{config.label}</Tag>;
}

function MutedValue({ children }: { children: string }) {
  return <span style={{ color: '#9A9D98' }}>{children}</span>;
}

function StatCard({ title, value, meta, danger }: { title: string; value: number; meta: string; danger?: boolean }) {
  return (
    <Card variant="borderless" style={{ borderRadius: 14, border: danger ? '1px solid #B05A4D' : '1px solid #E5DECB' }} styles={{ body: { padding: 20 } }}>
      <div style={{ color: '#6B6F6C', fontSize: 11, letterSpacing: 0 }}>{title}</div>
      <div style={{ fontFamily: 'Georgia, serif', fontSize: 34, color: danger ? '#B05A4D' : '#1A1F1B', marginTop: 8 }}>{value}</div>
      <div style={{ color: '#6B6F6C', fontSize: 12 }}>{meta}</div>
    </Card>
  );
}

function EmptyStudentState({ hasFilters, onClearFilters }: { hasFilters: boolean; onClearFilters: () => void }) {
  return (
    <Empty
      description={
        <div>
          <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
            {hasFilters ? 'Không tìm thấy sinh viên nào' : 'Chưa có dữ liệu sinh viên từ hệ thống'}
          </h3>
          <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
            {hasFilters ? 'Thử thay đổi từ khoá hoặc bộ lọc khác.' : 'Danh sách sẽ hiển thị khi hệ thống có dữ liệu sinh viên.'}
          </p>
        </div>
      }
      style={{ padding: '60px 0' }}
    >
      {hasFilters && <Button onClick={onClearFilters}>Xoá bộ lọc</Button>}
    </Empty>
  );
}

export default function AdminStudentsPage() {
  const [restoreForm] = Form.useForm<RestoreFormValues>();
  const [permanentLockForm] = Form.useForm<PermanentLockFormValues>();
  const [unlockForm] = Form.useForm<UnlockFormValues>();
  const { data: studentList, loading, refresh } = useAsyncData(() => getStudents({ page: 1, limit: 1000 }), []);
  const { data: studentStats } = useAsyncData(getStudentStats, []);
  const [searchText, setSearchText] = useState('');
  const [rankFilter, setRankFilter] = useState<StudentRank | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<StudentStatus | 'all'>('all');
  const [detailStudent, setDetailStudent] = useState<StudentRecord>();
  const [restoreStudent, setRestoreStudent] = useState<StudentRecord>();
  const [permanentLockStudent, setPermanentLockStudent] = useState<StudentRecord>();
  const [unlockStudent, setUnlockStudent] = useState<StudentRecord>();
  const [scoreLogs, setScoreLogs] = useState<TrustScoreLogRecord[]>([]);
  const [scoreLogsLoading, setScoreLogsLoading] = useState(false);
  const [actionSaving, setActionSaving] = useState(false);
  const students = studentList?.students ?? [];

  const loadTrustScoreLogs = async (studentId: string) => {
    setScoreLogsLoading(true);
    try {
      setScoreLogs(await getStudentTrustScoreLogs(studentId));
    } catch {
      setScoreLogs([]);
      message.error('Không thể tải lịch sử điểm uy tín', 3);
    } finally {
      setScoreLogsLoading(false);
    }
  };

  useEffect(() => {
    if (!detailStudent?.id) {
      setScoreLogs([]);
      return;
    }

    void loadTrustScoreLogs(detailStudent.id);
  }, [detailStudent?.id]);

  const filteredStudents = useMemo(() => {
    const keyword = normalizeText(searchText.trim());
    return students.filter((student) => {
      const status = getStudentStatus(student);
      const matchesSearch = !keyword || normalizeText(`${student.fullName} ${student.studentCode} ${student.email ?? ''}`).includes(keyword);
      const matchesRank = rankFilter === 'all' || student.trustRank === rankFilter;
      const matchesStatus = statusFilter === 'all' || status === statusFilter;
      return matchesSearch && matchesRank && matchesStatus;
    });
  }, [rankFilter, searchText, statusFilter, students]);

  const stats = useMemo(() => {
    const totalStudents = studentList?.totalItems ?? studentStats?.totalStudents ?? students.length;
    const currentlyBorrowing = studentStats?.currentlyBorrowing ?? 0;
    const lateStudents = students.filter((student) => student.totalLate > 0).length;
    const trustedStudents = students.filter((student) => student.trustRank === 'diamond' || student.trustRank === 'gold').length;

    return { totalStudents, currentlyBorrowing, lateStudents, trustedStudents };
  }, [studentList?.totalItems, studentStats?.currentlyBorrowing, studentStats?.totalStudents, students]);

  const hasFilters = Boolean(searchText.trim()) || rankFilter !== 'all' || statusFilter !== 'all';

  const clearFilters = () => {
    setSearchText('');
    setRankFilter('all');
    setStatusFilter('all');
  };

  const syncSelectedStudent = (nextStudents: StudentRecord[], targetId: string) => {
    const nextStudent = nextStudents.find((student) => student.id === targetId);
    if (nextStudent) setDetailStudent(nextStudent);
  };

  const refreshStudents = async (targetId?: string) => {
    const nextList = await refresh();
    if (targetId && nextList?.students) syncSelectedStudent(nextList.students, targetId);
  };

  const handleRestore = async (values: RestoreFormValues) => {
    if (!restoreStudent) return;

    try {
      const response = await restoreStudentTrustScore(restoreStudent.id, {
        pointsToAdd: values.points,
        reason: values.reason
      });
      setRestoreStudent(undefined);
      restoreForm.resetFields();
      await refreshStudents(restoreStudent.id);
      await loadTrustScoreLogs(restoreStudent.id);
      message.success(response.message || 'Đã cập nhật điểm uy tín');
    } catch {
      message.error('Không thể cập nhật điểm uy tín', 3);
    }
  };

  const handleLock = (student: StudentRecord) => {
    let days = 7;
    Modal.confirm({
      title: `Khoá tính năng mượn đồ của ${student.fullName}`,
      content: (
        <div>
          <p>Sinh viên sẽ không thể mượn đồ trong thời gian bị khoá.</p>
          <InputNumber min={1} defaultValue={7} addonAfter="ngày" onChange={(value) => { days = Number(value || 7); }} />
        </div>
      ),
      okText: 'Đồng ý',
      cancelText: 'Huỷ',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await toggleStudentLock(student.id, {
            isLocked: true,
            lockDays: days,
            reason: `Admin khoá thủ công ${days} ngày`
          });
          await refreshStudents(student.id);
          message.success(response.message || `Đã khoá tính năng mượn đồ ${days} ngày`);
        } catch {
          message.error('Không thể khoá tính năng mượn đồ', 3);
        }
      }
    });
  };

  const handleUnlock = (student: StudentRecord) => {
    setUnlockStudent(student);
    unlockForm.setFieldsValue({
      trustScore: student.trustScore,
      reason: ''
    });
  };

  const handlePermanentLock = (student: StudentRecord) => {
    setPermanentLockStudent(student);
    permanentLockForm.setFieldsValue({
      deduction: undefined,
      reason: ''
    });
  };

  const handlePermanentLockSubmit = async (values: PermanentLockFormValues) => {
    if (!permanentLockStudent) return;

    setActionSaving(true);
    try {
      const deduction = Number(values.deduction || 0);
      if (deduction > 0) {
        await restoreStudentTrustScore(permanentLockStudent.id, {
          pointsToAdd: -deduction,
          reason: values.reason
        });
      }

      const response = await toggleStudentLock(permanentLockStudent.id, {
        isLocked: true,
        isPermanent: true,
        reason: values.reason
      });
      await refreshStudents(permanentLockStudent.id);
      await loadTrustScoreLogs(permanentLockStudent.id);
      message.success(response.message || 'Đã khoá tài khoản vĩnh viễn');
      setPermanentLockStudent(undefined);
      permanentLockForm.resetFields();
    } catch {
      message.error('Không thể khoá tài khoản vĩnh viễn', 3);
    } finally {
      setActionSaving(false);
    }
  };

  const handleUnlockSubmit = async (values: UnlockFormValues) => {
    if (!unlockStudent) return;

    setActionSaving(true);
    try {
      const nextScore = Number(values.trustScore);
      const scoreDelta = nextScore - unlockStudent.trustScore;
      if (scoreDelta !== 0) {
        await restoreStudentTrustScore(unlockStudent.id, {
          pointsToAdd: scoreDelta,
          reason: values.reason
        });
      }

      const response = await toggleStudentLock(unlockStudent.id, {
        isLocked: false,
        reason: values.reason
      });
      await refreshStudents(unlockStudent.id);
      await loadTrustScoreLogs(unlockStudent.id);
      message.success(response.message || 'Đã mở khoá tài khoản');
      setUnlockStudent(undefined);
      unlockForm.resetFields();
    } catch {
      message.error('Không thể mở khoá tài khoản', 3);
    } finally {
      setActionSaving(false);
    }
  };

  const studentMenu = (student: StudentRecord): MenuProps['items'] => {
    const status = getStudentStatus(student);

    return [
      status === 'locked'
        ? { key: 'unlock', label: 'Mở khoá và cập nhật điểm', onClick: () => handleUnlock(student) }
        : { key: 'lock', label: 'Khoá mượn đồ', danger: true, onClick: () => handleLock(student) },
      !student.isPermanentlyLocked
        ? { key: 'permanent-lock', label: 'Khoá tài khoản vĩnh viễn', danger: true, onClick: () => handlePermanentLock(student) }
        : null,
      { key: 'restore', label: 'Phục hồi điểm', onClick: () => setRestoreStudent(student) }
    ].filter(Boolean) as MenuProps['items'];
  };

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 500, margin: '0 0 8px', color: '#1A1F1B' }}>Quản lý sinh viên</h1>
          <p style={{ color: '#6B6F6C', margin: 0 }}>Theo dõi điểm uy tín và lịch sử vi phạm từ dữ liệu hệ thống</p>
        </div>
        <Tooltip title="Chức năng chưa khả dụng">
          <Button disabled>Xuất Excel</Button>
        </Tooltip>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}><StatCard title="Tổng sinh viên" value={stats.totalStudents} meta="tài khoản đã đăng ký" /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard title="Đang mượn" value={stats.currentlyBorrowing} meta="đang mượn thiết bị" /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard title="Từng trễ hạn" value={stats.lateStudents} meta="theo hồ sơ sinh viên" danger={stats.lateStudents > 0} /></Col>
        <Col xs={24} sm={12} xl={6}><StatCard title="Hạng vàng trở lên" value={stats.trustedStudents} meta="hạng uy tín cao" /></Col>
      </Row>

      <Card variant="borderless" style={{ borderRadius: 14, border: '1px solid #E5DECB' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <Input.Search allowClear placeholder="Tìm theo MSSV, tên, email..." value={searchText} onChange={(event) => setSearchText(event.target.value)} style={{ width: 320, maxWidth: '100%' }} />
          <Select
            value={rankFilter}
            onChange={setRankFilter}
            style={{ width: 170 }}
            options={[
              { value: 'all', label: 'Tất cả hạng' },
              { value: 'diamond', label: 'Kim cương' },
              { value: 'gold', label: 'Vàng' },
              { value: 'silver', label: 'Bạc' },
              { value: 'bronze', label: 'Đồng' },
              { value: 'pebble', label: 'Đá cuội' }
            ]}
          />
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            style={{ width: 170 }}
            options={[
              { value: 'all', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Hoạt động' },
              { value: 'locked', label: 'Bị khoá' },
              { value: 'warning', label: 'Có cảnh báo' }
            ]}
          />
        </div>

        <Table<StudentRecord>
          rowKey="id"
          loading={loading}
          dataSource={filteredStudents}
          pagination={{ pageSize: 8 }}
          scroll={{ x: 'max-content' }}
          locale={{
            emptyText: <EmptyStudentState hasFilters={hasFilters && students.length > 0} onClearFilters={clearFilters} />
          }}
          columns={[
            {
              title: 'Sinh viên',
              render: (_, student) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar style={{ background: '#2D4A3E', color: '#F5EBD0' }}>{getInitials(student.fullName)}</Avatar>
                  <div>
                    <div style={{ fontWeight: 700 }}>{student.fullName}</div>
                    <div style={{ color: '#9A9D98', fontSize: 12 }}>{student.studentCode}</div>
                  </div>
                </div>
              )
            },
            { title: 'Email', render: (_, student) => student.email || <MutedValue>Chưa có dữ liệu</MutedValue> },
            { title: 'Lớp', render: (_, student) => student.className || <MutedValue>Chưa có dữ liệu</MutedValue> },
            { title: 'Hạng', dataIndex: 'trustRank', render: (rank: StudentRank) => <RankTag rank={rank} /> },
            {
              title: 'Điểm',
              render: (_, student) => (
                <div style={{ minWidth: 100 }}>
                  <Typography.Text strong>{student.trustScore}</Typography.Text>
                  <Progress percent={Math.min(100, Math.max(0, student.trustScore))} size="small" showInfo={false} strokeColor="#C99A3F" />
                </div>
              )
            },
            {
              title: 'Trạng thái tài khoản',
              render: (_, student) => <StatusTag status={getStudentStatus(student)} />
            },
            {
              title: 'Lịch sử',
              render: (_, student) => (
                <Tooltip title={`${student.totalBorrowed} lượt mượn / ${student.totalLate} lượt trễ`}>
                  <Tag>{student.totalBorrowed} lượt</Tag>
                </Tooltip>
              )
            },
            {
              title: 'Hành động',
              align: 'right',
              render: (_, student) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <Button onClick={() => setDetailStudent(student)}>Chi tiết</Button>
                  <Dropdown menu={{ items: studentMenu(student) }} trigger={['click']}>
                    <Button>...</Button>
                  </Dropdown>
                </div>
              )
            }
          ]}
        />
      </Card>

      <Modal
        title="Chi tiết sinh viên"
        open={Boolean(detailStudent)}
        width={860}
        onCancel={() => setDetailStudent(undefined)}
        footer={[
          <Button key="close" onClick={() => setDetailStudent(undefined)}>Đóng</Button>,
          <Button key="restore" type="primary" onClick={() => detailStudent && setRestoreStudent(detailStudent)}>Phục hồi điểm</Button>
        ]}
      >
        {detailStudent && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <Avatar size={72} style={{ background: '#2D4A3E', color: '#F5EBD0', fontWeight: 700 }}>{getInitials(detailStudent.fullName)}</Avatar>
              <div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{detailStudent.fullName}</div>
                <div style={{ color: '#6B6F6C' }}>{detailStudent.studentCode} · {detailStudent.email || 'Chưa có email'}</div>
              </div>
            </div>
            <Tabs
              items={[
                {
                  key: 'overview',
                  label: 'Tổng quan',
                  children: (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} md={10}>
                        <Card style={{ background: '#2D4A3E', color: '#fff', borderRadius: 14 }}>
                          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 11 }}>HẠNG HIỆN TẠI</div>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: 28, color: '#F5EBD0', marginTop: 8 }}>★ {RANK_CONFIG[detailStudent.trustRank].label}</div>
                          <div style={{ fontFamily: 'Georgia, serif', fontSize: 48 }}>{detailStudent.trustScore}</div>
                          <Progress percent={Math.min(100, Math.max(0, detailStudent.trustScore))} showInfo={false} strokeColor="#C99A3F" />
                        </Card>
                      </Col>
                      <Col xs={24} md={14}>
                        <Row gutter={[12, 12]}>
                          <Col span={8}><StatCard title="Tổng mượn" value={detailStudent.totalBorrowed} meta="lượt" /></Col>
                          <Col span={8}><StatCard title="Chuỗi tốt" value={detailStudent.goodReturnStreak} meta="lần" /></Col>
                          <Col span={8}><StatCard title="Trễ" value={detailStudent.totalLate} meta="lượt" danger={detailStudent.totalLate > 0} /></Col>
                        </Row>
                        <Card style={{ marginTop: 12 }}>
                          <div>SĐT: {detailStudent.phone || <MutedValue>Chưa có dữ liệu</MutedValue>}</div>
                          <div>Lớp: {detailStudent.className || <MutedValue>Chưa có dữ liệu</MutedValue>}</div>
                          <div>Trạng thái mượn đồ: {STATUS_CONFIG[getStudentStatus(detailStudent)].label}</div>
                          <div>Lý do khoá: {detailStudent.borrowLockReason || detailStudent.permanentLockReason || 'Không có'}</div>
                          <div>Ngày tham gia: {formatDateTime(detailStudent.createdAt)}</div>
                        </Card>
                      </Col>
                    </Row>
                  )
                },
                {
                  key: 'borrow',
                  label: 'Lịch sử mượn',
                  children: (
                    <Empty
                      description={
                        <div>
                          <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Chưa có dữ liệu lịch sử mượn từ hệ thống</h3>
                          <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>Lịch sử mượn chi tiết của sinh viên sẽ hiển thị khi hệ thống cung cấp dữ liệu.</p>
                        </div>
                      }
                      style={{ padding: '44px 0' }}
                    />
                  )
                },
                {
                  key: 'score',
                  label: 'Lịch sử điểm',
                  children: (
                    <Table<TrustScoreLogRecord>
                      rowKey="id"
                      loading={scoreLogsLoading}
                      pagination={false}
                      dataSource={scoreLogs}
                      scroll={{ x: 'max-content' }}
                      locale={{ emptyText: <Empty description="Chưa có dữ liệu lịch sử điểm từ hệ thống" /> }}
                      columns={[
                        { title: 'Thời gian', render: (_, log) => formatDateTime(log.createdAt) },
                        { title: 'Hành động', render: (_, log) => TRUST_REASON_LABEL[log.reason] ?? log.reason },
                        { title: '+/-', render: (_, log) => <Typography.Text type={log.delta < 0 ? 'danger' : 'success'}>{log.delta > 0 ? `+${log.delta}` : log.delta}</Typography.Text> },
                        { title: 'Số dư', render: (_, log) => log.scoreAfter },
                        { title: 'Ghi chú', render: (_, log) => log.note || 'Không có' }
                      ]}
                    />
                  )
                }
              ]}
            />
          </>
        )}
      </Modal>

      <Modal
        title={`Phục hồi điểm uy tín${restoreStudent ? ` cho SV ${restoreStudent.fullName}` : ''}`}
        open={Boolean(restoreStudent)}
        okText="Phục hồi"
        cancelText="Huỷ"
        onOk={() => restoreForm.submit()}
        onCancel={() => setRestoreStudent(undefined)}
      >
        {restoreStudent && (
          <Form<RestoreFormValues> form={restoreForm} layout="vertical" onFinish={handleRestore}>
            <p>Điểm hiện tại: <strong>{restoreStudent.trustScore}</strong> / 100</p>
            <Form.Item name="points" label="Số điểm muốn cộng" rules={[{ required: true, message: 'Nhập số điểm' }]}>
              <InputNumber min={1} max={Math.max(1, 100 - restoreStudent.trustScore)} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="reason" label="Lý do phục hồi" rules={[{ required: true, whitespace: true, message: 'Nhập lý do phục hồi' }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={`Khoá tài khoản vĩnh viễn${permanentLockStudent ? `: ${permanentLockStudent.fullName}` : ''}`}
        open={Boolean(permanentLockStudent)}
        okText="Khoá vĩnh viễn"
        cancelText="Huỷ"
        confirmLoading={actionSaving}
        okButtonProps={{ danger: true }}
        onOk={() => permanentLockForm.submit()}
        onCancel={() => setPermanentLockStudent(undefined)}
      >
        {permanentLockStudent && (
          <Form<PermanentLockFormValues> form={permanentLockForm} layout="vertical" onFinish={handlePermanentLockSubmit}>
            <p>
              Điểm hiện tại: <strong>{permanentLockStudent.trustScore}</strong> / 100
            </p>
            <Form.Item name="deduction" label="Số điểm uy tín muốn trừ">
              <InputNumber min={0} max={Math.max(0, permanentLockStudent.trustScore)} style={{ width: '100%' }} placeholder="Không trừ điểm nếu để trống" />
            </Form.Item>
            <Form.Item name="reason" label="Lý do khoá" rules={[{ required: true, whitespace: true, message: 'Nhập lý do khoá tài khoản' }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        )}
      </Modal>

      <Modal
        title={`Mở khoá tài khoản${unlockStudent ? `: ${unlockStudent.fullName}` : ''}`}
        open={Boolean(unlockStudent)}
        okText="Mở khoá"
        cancelText="Huỷ"
        confirmLoading={actionSaving}
        onOk={() => unlockForm.submit()}
        onCancel={() => setUnlockStudent(undefined)}
      >
        {unlockStudent && (
          <Form<UnlockFormValues> form={unlockForm} layout="vertical" onFinish={handleUnlockSubmit}>
            <p>
              Điểm hiện tại: <strong>{unlockStudent.trustScore}</strong> / 100
            </p>
            <Form.Item name="trustScore" label="Điểm uy tín sau khi mở khoá" rules={[{ required: true, message: 'Nhập điểm uy tín' }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="reason" label="Lý do mở khoá" rules={[{ required: true, whitespace: true, message: 'Nhập lý do mở khoá' }]}>
              <Input.TextArea rows={3} />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </div>
  );
}
