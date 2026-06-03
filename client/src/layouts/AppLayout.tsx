import { useEffect, useState } from 'react';
import {
  AppstoreOutlined,
  BarChartOutlined,
  BellOutlined,
  CheckSquareOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  FolderOpenOutlined,
  HomeOutlined,
  LogoutOutlined,
  LoadingOutlined,
  MenuOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  TeamOutlined,
  WarningOutlined,
  UserOutlined
} from '@ant-design/icons';
import { Avatar, Button, Drawer, Layout, Menu, message, Space, Tooltip, Typography, Upload } from 'antd';
import type { MenuProps } from 'antd';
import { history, Outlet, useLocation } from 'umi';
import { ROUTES } from '@/constants/routes';
import ErrorBoundary from '@/components/ErrorBoundary';
import { getMe, normalizeUploadUrl, uploadCurrentUserAvatar, uploadMyAvatar } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

const { Header, Content, Sider } = Layout;
const MOBILE_BREAKPOINT = 768;
const RANK_LABEL: Record<string, string> = {
  diamond: 'Kim cương',
  gold: 'Vàng',
  silver: 'Bạc',
  bronze: 'Đồng',
  stone: 'Đá'
};

function getDisplayName(fullName?: string, name?: string) {
  const displayName = (fullName || name || '').trim();
  return displayName || 'Người dùng';
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

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return fallback;
}

export default function AppLayout() {
  const location = useLocation();
  const { currentUser, signIn, signOut } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';
  const displayName = getDisplayName(currentUser?.fullName, currentUser?.name);
  const avatarUrl = normalizeUploadUrl(currentUser?.avatarUrl || currentUser?.avatar);
  const trustScore = typeof currentUser?.trustScore === 'number' ? currentUser.trustScore : 0;
  const trustRank = currentUser?.trustRank ? RANK_LABEL[currentUser.trustRank] ?? currentUser.trustRank : 'Đá';
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);

  useEffect(() => {
    const handler = () => {
      const nextIsMobile = window.innerWidth < MOBILE_BREAKPOINT;
      setIsMobile(nextIsMobile);
      if (!nextIsMobile) setDrawerOpen(false);
    };

    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const handleSignOut = () => {
    signOut();
    history.push(ROUTES.login);
  };

  const handleAvatarUpload = async (file: File) => {
    if (!currentUser) return false;

    if (!file.type?.startsWith('image/')) {
      message.error('Vui lòng chọn file ảnh.', 3);
      return false;
    }

    setAvatarUploading(true);
    try {
      const response = isAdmin ? await uploadCurrentUserAvatar(file) : await uploadMyAvatar(file);
      let latestUser = currentUser;
      try {
        latestUser = await getMe();
      } catch {
        latestUser = currentUser;
      }
      const nextAvatarUrl = normalizeUploadUrl(response.avatarUrl ?? latestUser.avatarUrl ?? latestUser.avatar);

      signIn({
        ...currentUser,
        ...latestUser,
        token: currentUser.token,
        avatarUrl: nextAvatarUrl,
        avatar: nextAvatarUrl
      });

      message.success('Đã cập nhật ảnh đại diện.', 2);
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể cập nhật ảnh đại diện. Vui lòng thử lại.'), 3);
    } finally {
      setAvatarUploading(false);
    }

    return false;
  };

  const studentItems: MenuProps['items'] = [
    { key: ROUTES.studentDevices, icon: <AppstoreOutlined />, label: 'Trang chủ' },
    { key: ROUTES.studentBorrow, icon: <SendOutlined />, label: 'Gửi yêu cầu mượn' },
    { key: ROUTES.studentNotifications, icon: <BellOutlined />, label: 'Thông báo' },
    { key: ROUTES.studentRequests, icon: <ClockCircleOutlined />, label: 'Lịch sử mượn' },
    { key: ROUTES.studentTrustRules, icon: <SafetyCertificateOutlined />, label: 'Quy tắc điểm uy tín' }
  ];

  const adminItems: MenuProps['items'] = [
    { key: ROUTES.adminDashboard, icon: <HomeOutlined />, label: 'Trang chủ' },
    { key: ROUTES.adminRequests, icon: <CheckSquareOutlined />, label: 'Yêu cầu mượn' },
    { key: ROUTES.adminDevices, icon: <DatabaseOutlined />, label: 'Quản lý kho' },
    { key: ROUTES.adminCategories, icon: <FolderOpenOutlined />, label: 'Danh mục thiết bị' },
    { key: ROUTES.adminStudents, icon: <TeamOutlined />, label: 'Tài khoản sinh viên' },
    { key: ROUTES.adminReturns, icon: <ClockCircleOutlined />, label: 'Ghi nhận trả' },
    { key: ROUTES.adminStatistics, icon: <BarChartOutlined />, label: 'Thống kê' },
    { key: ROUTES.adminAlerts, icon: <WarningOutlined />, label: 'Cảnh báo' },
    { key: ROUTES.adminTrustRules, icon: <SafetyCertificateOutlined />, label: 'Quy tắc điểm uy tín' }
  ];

  const menuItems = isAdmin ? adminItems : studentItems;

  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    history.push(String(key));
    setDrawerOpen(false);
  };

  const renderMenu = () => (
    <Menu
      mode="inline"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={handleMenuClick}
      style={{ borderInlineEnd: 0 }}
    />
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider theme="light" width={240}>
          <Typography.Title level={4} style={{ padding: '20px 16px 8px' }}>
            Mượn đồ dùng
          </Typography.Title>
          {renderMenu()}
        </Sider>
      )}

      <Drawer
        title="Mượn đồ dùng"
        placement="left"
        width={240}
        open={isMobile && drawerOpen}
        onClose={() => setDrawerOpen(false)}
        styles={{ body: { padding: 0 } }}
      >
        {renderMenu()}
      </Drawer>

      <Layout>
        <Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            paddingInline: isMobile ? 12 : 24
          }}
        >
          {isMobile ? (
            <Button type="text" icon={<MenuOutlined />} onClick={() => setDrawerOpen(true)} aria-label="Menu" />
          ) : (
            <span />
          )}
          <Space style={{ marginLeft: 'auto', minWidth: 0 }} size={isMobile ? 8 : 12} align="center">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <Tooltip title="Đổi ảnh đại diện">
                <Upload showUploadList={false} accept="image/*" beforeUpload={(file) => handleAvatarUpload(file)} disabled={avatarUploading}>
                  <Avatar
                    src={avatarUploading ? undefined : avatarUrl}
                    icon={avatarUploading ? <LoadingOutlined /> : !avatarUrl ? <UserOutlined /> : undefined}
                    style={{ flex: '0 0 auto', background: '#2D4A3E', color: '#F5EBD0', cursor: 'pointer', opacity: avatarUploading ? 0.78 : 1 }}
                  >
                    {!avatarUploading && !avatarUrl ? getInitials(displayName) : null}
                  </Avatar>
                </Upload>
              </Tooltip>
              <div style={{ display: isMobile ? 'none' : 'grid', minWidth: 0, lineHeight: 1.25 }}>
                <Typography.Text ellipsis style={{ maxWidth: 240, fontWeight: 700, color: '#1A1F1B' }}>
                  {displayName}
                </Typography.Text>
                {!isAdmin && (
                  <Typography.Text ellipsis style={{ maxWidth: 240, color: '#6B6F6C', fontSize: 12 }}>
                    Hạng {trustRank} · {trustScore} điểm uy tín
                  </Typography.Text>
                )}
                <Typography.Text style={{ color: '#8A8E88', fontSize: 11 }}>
                  {avatarUploading ? 'Đang tải ảnh...' : 'Bấm avatar để đổi ảnh'}
                </Typography.Text>
              </div>
            </div>
            <Button icon={<LogoutOutlined />} onClick={handleSignOut}>
              {isMobile ? '' : 'Đăng xuất'}
            </Button>
          </Space>
        </Header>
        <Content style={{ padding: isMobile ? 12 : 24, overflowX: 'hidden' }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Content>
      </Layout>
    </Layout>
  );
}
