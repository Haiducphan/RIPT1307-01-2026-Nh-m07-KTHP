import { Button, Card, Form, Input, message } from 'antd';
import { useNavigate } from '@umijs/max';
import { ROUTES } from '@/constants/routes';
import { login } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';

interface LoginFormValues {
  email: string;
  password: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const signIn = useAuthStore((state) => state.signIn);

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      const user = await login(values);
      signIn(user);
      navigate(user.role === 'admin' ? ROUTES.adminRequests : ROUTES.studentDevices);
    } catch {
      message.error('Dang nhap that bai');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <Card title="Dang nhap he thong" style={{ width: 420, maxWidth: '100%' }}>
        <Form<LoginFormValues>
          layout="vertical"
          onFinish={handleSubmit}
        >
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