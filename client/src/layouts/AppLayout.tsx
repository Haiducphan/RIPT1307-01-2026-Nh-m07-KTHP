import { Button, Layout, Menu, Space, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { history, Outlet, useLocation } from '@umijs/max';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/stores/authStore';

const { Header, Content, Sider } = Layout;

export default function AppLayout() {
  const location = useLocation();
  const { currentUser, signOut } = useAuthStore();
  const isAdmin = currentUser?.role === 'admin';

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={240}>
        <Typography.Title level={4} style={{ padding: '20px 16px 8px' }}>
          Muon do dung
        </Typography.Title>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={isAdmin ? adminItems : studentItems}
          onClick={({ key }) => history.push(String(key))}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', display: 'flex', justifyContent: 'flex-end' }}>
          <Space>
            <Typography.Text>{currentUser?.fullName}</Typography.Text>
            <Button onClick={handleSignOut}>Dang xuat</Button>
          </Space>
        </Header>
        <Content style={{ padding: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
