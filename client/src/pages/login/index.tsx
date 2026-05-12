import { Button, Card, Form, Input, message, Radio } from 'antd';
import { history } from '@umijs/max';
import { ROUTES } from '@/constants/routes';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface LoginFormValues {
  email: string;
  password: string;
  role: UserRole;
}

export default function LoginPage() {
  const signIn = useAuthStore((state) => state.signIn);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const user = await login(values);
      signIn(user);
      history.push(user.role === 'admin' ? ROUTES.adminRequests : ROUTES.studentDevices);
    } catch {
      message.error('Dang nhap that bai');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card title="Dang nhap he thong" style={{ width: 420, maxWidth: '100%' }}>
        <Form<LoginFormValues>
          layout="vertical"
          initialValues={{ email: 'student@example.com', password: '123456', role: 'student' }}
          onFinish={handleSubmit}
        >
          <Form.Item name="role" label="Vai tro">
            <Radio.Group
              options={[
                { label: 'Sinh vien', value: 'student' },
                { label: 'Quan tri vien', value: 'admin' }
              ]}
            />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Mat khau" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Dang nhap
          </Button>
        </Form>
      </Card>
    </div>
  );
}
