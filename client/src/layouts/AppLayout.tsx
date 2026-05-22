import { useEffect, useState } from 'react';
import { MenuOutlined } from '@ant-design/icons';
import { Button, Drawer, Layout, Menu, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { history, Outlet, useLocation } from '@umijs/max';
import { ROUTES } from '@/constants/routes';
import ErrorBoundary from '@/components/ErrorBoundary';
import { useAuthStore } from '@/stores/authStore';

const { Header, Content, Sider } = Layout;
const MOBILE_BREAKPOINT = 768;

export default function AppLayout() {
  const location = useLocation();
  const { currentUser, signOut } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT : false
  );
  const [drawerOpen, setDrawerOpen] = useState(false);

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

  const studentItems: MenuProps['items'] = [
    { key: ROUTES.studentDevices, label: 'Danh sach thiet bi' },
    { key: ROUTES.studentBorrow, label: 'Gui yeu cau muon' },
    { key: ROUTES.studentRequests, label: 'Lich su muon' }
  ];

  const adminItems: MenuProps['items'] = [
    { key: ROUTES.adminRequests, label: 'Yeu cau muon' },
    { key: ROUTES.adminDevices, label: 'Quan ly kho' },
    { key: ROUTES.adminReturns, label: 'Ghi nhan tra' },
    { key: ROUTES.adminStatistics, label: 'Thong ke' }
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
            Muon do dung
          </Typography.Title>
          {renderMenu()}
        </Sider>
      )}

      <Drawer
        title="Muon do dung"
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
          <Space style={{ marginLeft: 'auto' }} size={isMobile ? 8 : 12}>
            <Typography.Text ellipsis style={{ maxWidth: isMobile ? 130 : 240 }}>
              {currentUser?.fullName}
            </Typography.Text>
            <Button onClick={handleSignOut}>Dang xuat</Button>
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
