import { useEffect, useMemo, useState } from 'react';
import { Avatar, Button, Card, Col, Empty, Image, Modal, Progress, Row, Skeleton, Table, Tag, Typography, Upload, message } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { getMe, normalizeUploadUrl, uploadMyAvatar } from '@/services/auth';
import { getMyBorrowRequests } from '@/services/borrowRequests';
import type { NormalizedBorrowRequest } from '@/services/borrowRequests';
import { getMyTrustScoreLogs } from '@/services/students';
import type { TrustScoreLogRecord } from '@/services/students';
import { useAsyncData } from '@/hooks/useAsyncData';
import { useAuthStore } from '@/stores/authStore';
import type { BorrowStatus, User } from '@/types';

const RANK_LABEL: Record<string, string> = {
  diamond: 'Kim cương',
  gold: 'Vàng',
  silver: 'Bạc',
  bronze: 'Đồng',
  stone: 'Đá cuội',
  pebble: 'Đá cuội'
};

const STATUS_LABEL: Record<BorrowStatus, { label: string; color: string }> = {
  pending: { label: 'Chờ duyệt', color: 'gold' },
  approved: { label: 'Đã duyệt', color: 'blue' },
  rejected: { label: 'Từ chối', color: 'red' },
  borrowed: { label: 'Đang mượn', color: 'purple' },
  borrowing: { label: 'Đang mượn', color: 'purple' },
  returned: { label: 'Đã trả', color: 'green' },
  returned_ontime: { label: 'Đã trả đúng hạn', color: 'green' },
  returned_late: { label: 'Đã trả trễ', color: 'orange' },
  overdue: { label: 'Quá hạn', color: 'red' },
  cancelled: { label: 'Đã huỷ', color: 'default' },
  canceled: { label: 'Đã huỷ', color: 'default' },
  cancelled_noshow: { label: 'Không đến nhận', color: 'default' }
};

const RETURNED_STATUSES: BorrowStatus[] = ['returned', 'returned_ontime', 'returned_late'];
const ACTIVE_STATUSES: BorrowStatus[] = ['borrowed', 'borrowing', 'overdue'];
const BORROW_HISTORY_PREVIEW_LIMIT = 6;
type TrustRankKey = 'diamond' | 'gold' | 'silver' | 'bronze' | 'stone';

const TRUST_RANKS: Array<{ key: TrustRankKey; label: string; min: number; permission: string; locked: boolean }> = [
  { key: 'diamond', label: 'Kim cương', min: 90, permission: 'Mượn được mọi cấp thiết bị', locked: false },
  { key: 'gold', label: 'Vàng', min: 80, permission: 'Mượn được thiết bị cấp A trở xuống', locked: false },
  { key: 'silver', label: 'Bạc', min: 66, permission: 'Mượn được thiết bị cấp B trở xuống', locked: false },
  { key: 'bronze', label: 'Đồng', min: 50, permission: 'Mượn được thiết bị cấp C', locked: false },
  { key: 'stone', label: 'Đá cuội', min: 0, permission: 'Tạm khóa tính năng mượn', locked: true }
];

const TRUST_LOG_REASON_LABEL: Record<string, string> = {
  initial: 'Khởi tạo điểm uy tín',
  return_ontime: 'Trả đúng hạn',
  streak_3: 'Thưởng chuỗi tốt 3 lần',
  streak_5: 'Thưởng chuỗi tốt 5 lần',
  admin_manual_add: 'Điều chỉnh cộng điểm',
  admin_manual_deduct: 'Điều chỉnh trừ điểm',
  cancel_approved: 'Huỷ đơn sau duyệt',
  noshow: 'Không đến nhận thiết bị',
  late_return: 'Trả trễ hạn',
  minor_damage: 'Thiết bị hư hỏng nhẹ',
  major_damage: 'Thiết bị hư hỏng nặng hoặc mất'
};

function getDisplayName(user?: User | null) {
  return user?.fullName?.trim() || user?.name?.trim() || 'Người dùng';
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join('')
    .toUpperCase();
}

function formatDate(value?: string) {
  if (!value) return 'Chưa cập nhật';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY') : value;
}

function formatDateTime(value?: string) {
  if (!value) return 'Chưa cập nhật';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : value;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span style={{ color: '#6B6F6C' }}>{label}</span>
      <span style={{ color: '#1A1F1B', fontWeight: 500, textAlign: 'right' }}>{value || 'Chưa cập nhật'}</span>
    </div>
  );
}

function SmallStatCard({ title, value, meta }: { title: string; value: string | number; meta: string }) {
  return (
    <Card
      variant="borderless"
      style={{ borderRadius: 14, border: '1px solid #E5DECB', boxShadow: '0 1px 2px rgba(45, 74, 62, 0.04)' }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ fontSize: 11, color: '#6B6F6C', letterSpacing: 0, textTransform: 'uppercase', marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ fontFamily: 'var(--app-heading-font)', fontSize: 34, lineHeight: 1, color: '#1A1F1B', marginBottom: 8 }}>
        {value}
      </div>
      <div style={{ color: '#6B6F6C', fontSize: 12 }}>{meta}</div>
    </Card>
  );
}

function getTrustRankByScore(score: number) {
  return TRUST_RANKS.find((rank) => score >= rank.min) ?? TRUST_RANKS[TRUST_RANKS.length - 1];
}

function getNextTrustMilestone(score?: number) {
  if (score === undefined) return 'Chưa cập nhật điểm uy tín.';
  if (score >= TRUST_RANKS[0].min) return 'Bạn đang ở hạng cao nhất';

  const nextRank = [...TRUST_RANKS].reverse().find((rank) => score < rank.min);
  if (!nextRank) return 'Bạn đang ở hạng cao nhất';

  return `Cần thêm ${nextRank.min - score} điểm để lên hạng ${nextRank.label}`;
}

function getTrustLogReasonLabel(reason?: string) {
  return reason ? TRUST_LOG_REASON_LABEL[reason] ?? 'Điều chỉnh điểm uy tín' : 'Điều chỉnh điểm uy tín';
}

export default function StudentProfilePage() {
  const { currentUser, signIn } = useAuthStore();
  const { data: borrowRequests = [], loading: requestsLoading } = useAsyncData(getMyBorrowRequests);
  const { data: trustScoreLogs = [], loading: logsLoading } = useAsyncData(getMyTrustScoreLogs);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileUser, setProfileUser] = useState<User | null>(currentUser);
  const [showAllBorrowHistory, setShowAllBorrowHistory] = useState(false);

  useEffect(() => {
    let mounted = true;

    const refreshProfile = async () => {
      if (!currentUser?.token) {
        setLoadingProfile(false);
        return;
      }

      try {
        const latestUser = await getMe();
        const syncedUser = { ...latestUser, token: currentUser.token };
        if (!mounted) return;
        setProfileUser(syncedUser);
        signIn(syncedUser);
      } catch {
        if (mounted) setProfileUser(currentUser);
      } finally {
        if (mounted) setLoadingProfile(false);
      }
    };

    void refreshProfile();
    return () => {
      mounted = false;
    };
  }, [currentUser?.token]);

  const displayName = getDisplayName(profileUser);
  const avatarUrl = normalizeUploadUrl(profileUser?.avatarUrl || profileUser?.avatar);
  const trustScoreValue = typeof profileUser?.trustScore === 'number' ? profileUser.trustScore : undefined;
  const trustScore = trustScoreValue ?? 0;
  const derivedTrustRank = trustScoreValue !== undefined ? getTrustRankByScore(trustScoreValue) : undefined;
  const trustRank = derivedTrustRank?.label ?? (profileUser?.trustRank ? RANK_LABEL[profileUser.trustRank] ?? profileUser.trustRank : 'Chưa cập nhật');
  const nextMilestone = getNextTrustMilestone(trustScoreValue);
  const initials = getInitials(displayName);
  const displayedBorrowRequests = showAllBorrowHistory ? borrowRequests : borrowRequests.slice(0, BORROW_HISTORY_PREVIEW_LIMIT);
  const isBorrowLocked = Boolean(profileUser?.borrowLocked || profileUser?.isPermanentlyLocked || derivedTrustRank?.locked);
  const borrowLockStatus = isBorrowLocked
    ? profileUser?.borrowLockReason || profileUser?.permanentLockReason || 'Tạm khóa theo điểm uy tín'
    : 'Được phép gửi yêu cầu mượn';

  const stats = useMemo(() => {
    const total = borrowRequests.length;
    const returned = borrowRequests.filter((request) => RETURNED_STATUSES.includes(request.status)).length;
    const active = borrowRequests.filter((request) => ACTIVE_STATUSES.includes(request.status)).length;
    const late = borrowRequests.filter((request) => request.status === 'returned_late' || request.status === 'overdue').length;
    const onTimeRate = returned > 0 ? Math.round(((returned - late) / returned) * 100) : 0;

    return {
      total,
      active,
      returned,
      onTimeRate,
      streak: profileUser?.goodReturnStreak ?? 0
    };
  }, [borrowRequests, profileUser?.goodReturnStreak]);

  const handleAvatarUpload = async (file: File) => {
    if (!profileUser?.token && !currentUser?.token) return false;

    if (!file.type?.startsWith('image/')) {
      message.error('Vui lòng chọn file ảnh.', 3);
      return false;
    }

    setAvatarUploading(true);
    try {
      const response = await uploadMyAvatar(file);
      const latestUser = await getMe();
      const nextAvatarUrl = normalizeUploadUrl(response.avatarUrl ?? latestUser.avatarUrl ?? latestUser.avatar);
      const syncedUser = {
        ...latestUser,
        token: profileUser?.token ?? currentUser?.token,
        avatarUrl: nextAvatarUrl,
        avatar: nextAvatarUrl
      };

      setProfileUser(syncedUser);
      signIn(syncedUser);
      message.success(response.message || 'Đã cập nhật ảnh đại diện', 2);
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể cập nhật ảnh đại diện'), 3);
    } finally {
      setAvatarUploading(false);
    }

    return false;
  };

  if (loadingProfile) {
    return (
      <div style={{ paddingBottom: 48 }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 48 }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontFamily: 'var(--app-heading-font)', fontSize: 34, fontWeight: 500, lineHeight: 1.1, color: '#1A1F1B', margin: '0 0 8px' }}>
          Hồ sơ cá nhân
        </h1>
        <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
          Quản lý thông tin tài khoản và theo dõi điểm uy tín.
        </p>
      </div>

      <Row gutter={[24, 24]} align="top">
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ borderRadius: 18, background: '#2D4A3E', color: '#FFFFFF', overflow: 'hidden' }} styles={{ body: { padding: 26 } }}>
            <div style={{ fontSize: 11, letterSpacing: 0, textTransform: 'uppercase', color: 'rgba(255,255,255,0.58)' }}>
              HẠNG HIỆN TẠI
            </div>
            <div style={{ fontFamily: 'var(--app-heading-font)', fontSize: 30, color: '#F5EBD0', marginTop: 10 }}>
              {trustRank}
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 22 }}>
              <strong style={{ fontFamily: 'var(--app-heading-font)', fontSize: trustScoreValue !== undefined ? 64 : 28, lineHeight: 1 }}>
                {trustScoreValue ?? 'Chưa cập nhật'}
              </strong>
              {trustScoreValue !== undefined ? <span style={{ color: 'rgba(255,255,255,0.68)' }}>/100 điểm uy tín</span> : null}
            </div>
            <Progress percent={Math.max(0, Math.min(100, trustScore))} showInfo={false} strokeColor="#C99A3F" trailColor="rgba(255,255,255,0.18)" />
            <div style={{ marginTop: 12, color: 'rgba(255,255,255,0.78)', fontSize: 13, lineHeight: 1.5 }}>
              {nextMilestone}
            </div>
          </Card>

          <Card variant="borderless" style={{ borderRadius: 14, border: '1px solid #E5DECB', marginTop: 16 }} styles={{ body: { padding: 22 } }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <Avatar
                size={64}
                src={avatarUrl}
                icon={!avatarUrl ? <UserOutlined /> : undefined}
                onClick={() => setAvatarModalOpen(true)}
                style={{ background: '#2D4A3E', color: '#F5EBD0', fontWeight: 700, cursor: 'pointer' }}
              >
                {!avatarUrl ? initials : null}
              </Avatar>
              <div>
                <div style={{ fontWeight: 700, fontSize: 16, color: '#1A1F1B' }}>{displayName}</div>
                <div style={{ color: '#6B6F6C', fontSize: 12, marginTop: 3 }}>
                  {profileUser?.studentCode || 'Chưa cập nhật'} · {profileUser?.className || 'Chưa cập nhật'}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gap: 11 }}>
              <InfoRow label="Email" value={profileUser?.email} />
              <InfoRow label="SĐT" value={profileUser?.phone} />
              <InfoRow label="MSSV" value={profileUser?.studentCode} />
              <InfoRow label="Lớp" value={profileUser?.className} />
            </div>
            <Button block style={{ marginTop: 18, height: 40 }} onClick={() => setAvatarModalOpen(true)}>
              Đổi ảnh đại diện
            </Button>
          </Card>

          {derivedTrustRank ? (
            <Card variant="borderless" style={{ borderRadius: 14, border: '1px solid #E5DECB', marginTop: 16 }} styles={{ body: { padding: 22 } }}>
              <div style={{ fontFamily: 'var(--app-heading-font)', fontSize: 20, fontWeight: 600, color: '#1A1F1B', marginBottom: 14 }}>
                Quyền mượn hiện tại
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                <InfoRow label="Hạng hiện tại" value={derivedTrustRank.label} />
                <InfoRow label="Được mượn" value={derivedTrustRank.permission} />
                <InfoRow label="Tình trạng" value={borrowLockStatus} />
                <InfoRow label="Mốc tiếp theo" value={nextMilestone} />
              </div>
            </Card>
          ) : null}
        </Col>

        <Col xs={24} md={16}>
          <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
            <Col xs={24} lg={8}>
              <SmallStatCard title="Tổng lượt mượn" value={stats.total} meta={`${stats.returned} lượt đã hoàn tất`} />
            </Col>
            <Col xs={24} lg={8}>
              <SmallStatCard title="Tỷ lệ đúng hạn" value={`${stats.onTimeRate}%`} meta="tính từ lịch sử mượn của bạn" />
            </Col>
            <Col xs={24} lg={8}>
              <SmallStatCard title="Chuỗi tốt" value={stats.streak} meta="từ hồ sơ hệ thống" />
            </Col>
          </Row>

          <Card
            variant="borderless"
            style={{ borderRadius: 14, border: '1px solid #E5DECB', marginBottom: 20 }}
            title={<span style={{ fontFamily: 'var(--app-heading-font)', fontSize: 20, fontWeight: 500 }}>Lịch sử mượn</span>}
            extra={
              !showAllBorrowHistory && borrowRequests.length > BORROW_HISTORY_PREVIEW_LIMIT ? (
                <Button type="link" onClick={() => setShowAllBorrowHistory(true)} style={{ paddingInline: 0, color: '#2D4A3E', fontWeight: 700 }}>
                  Xem tất cả
                </Button>
              ) : null
            }
          >
            <Table<NormalizedBorrowRequest>
              rowKey="id"
              loading={requestsLoading}
              dataSource={displayedBorrowRequests}
              scroll={{ x: 'max-content' }}
              pagination={showAllBorrowHistory ? { pageSize: BORROW_HISTORY_PREVIEW_LIMIT } : false}
              locale={{ emptyText: <Empty description="Chưa có lịch sử mượn." /> }}
              columns={[
                { title: 'Mã đơn', dataIndex: 'requestCode' },
                { title: 'Thiết bị', dataIndex: 'deviceName' },
                { title: 'Ngày mượn', dataIndex: 'borrowDate', render: formatDate },
                { title: 'Ngày trả', dataIndex: 'returnDate', render: formatDate },
                {
                  title: 'Trạng thái',
                  dataIndex: 'status',
                  render: (status: BorrowStatus) => {
                    const config = STATUS_LABEL[status] ?? STATUS_LABEL.pending;
                    return <Tag color={config.color}>{config.label}</Tag>;
                  }
                }
              ]}
            />
          </Card>

          <Card
            variant="borderless"
            style={{ borderRadius: 14, border: '1px solid #E5DECB' }}
            title={<span style={{ fontFamily: 'var(--app-heading-font)', fontSize: 20, fontWeight: 500 }}>Lịch sử điểm uy tín</span>}
          >
            <Table<TrustScoreLogRecord>
              rowKey="id"
              loading={logsLoading}
              dataSource={trustScoreLogs}
              pagination={trustScoreLogs.length > BORROW_HISTORY_PREVIEW_LIMIT ? { pageSize: BORROW_HISTORY_PREVIEW_LIMIT } : false}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: <Empty description="Chưa có biến động điểm uy tín." /> }}
              columns={[
                { title: 'Thời gian', dataIndex: 'createdAt', render: formatDateTime },
                {
                  title: 'Lý do',
                  render: (_, log) => (
                    <div>
                      <Typography.Text strong>{getTrustLogReasonLabel(log.reason)}</Typography.Text>
                      {log.requestCode || log.note ? (
                        <div style={{ color: '#6B6F6C', fontSize: 12, marginTop: 3 }}>
                          {[log.requestCode, log.note].filter(Boolean).join(' · ')}
                        </div>
                      ) : null}
                    </div>
                  )
                },
                {
                  title: 'Thay đổi',
                  dataIndex: 'delta',
                  render: (delta: number) => (
                    <Tag color={delta >= 0 ? 'green' : 'red'}>{delta >= 0 ? `+${delta}` : delta}</Tag>
                  )
                },
                {
                  title: 'Điểm',
                  render: (_, log) => `${log.scoreBefore} → ${log.scoreAfter}`
                }
              ]}
            />
          </Card>
        </Col>
      </Row>

      <Modal
        title="Ảnh đại diện"
        open={avatarModalOpen}
        onCancel={() => setAvatarModalOpen(false)}
        footer={[
          <Upload key="upload" showUploadList={false} accept="image/*" beforeUpload={(file) => handleAvatarUpload(file)}>
            <Button loading={avatarUploading}>Chọn ảnh từ thiết bị</Button>
          </Upload>,
          <Button key="close" onClick={() => setAvatarModalOpen(false)}>Đóng</Button>
        ]}
      >
        <div style={{ display: 'grid', placeItems: 'center', minHeight: 260 }}>
          {avatarUrl ? (
            <Image src={avatarUrl} alt={displayName} style={{ maxHeight: 320, objectFit: 'contain', borderRadius: 12 }} />
          ) : (
            <Avatar size={128} icon={<UserOutlined />} style={{ background: '#2D4A3E', color: '#F5EBD0', fontSize: 42 }}>
              {initials}
            </Avatar>
          )}
        </div>
      </Modal>
    </div>
  );
}
