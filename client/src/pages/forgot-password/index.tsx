import { useState } from 'react';
import { Button, Card, Form, Input, message, Typography } from 'antd';
import { Link } from 'umi';
import { forgotPassword } from '@/services/auth';

interface ForgotPasswordFormValues {
  email: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
}

export default function ForgotPasswordPage() {
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (values: ForgotPasswordFormValues) => {
    setSubmitting(true);

    try {
      const response = await forgotPassword(values.email);
      message.success(response.message || 'Đã gửi yêu cầu đặt lại mật khẩu. Vui lòng kiểm tra email.', 3);
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể gửi yêu cầu đặt lại mật khẩu.'), 3);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F5F1E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
      }}
    >
      <Card
        variant="borderless"
        style={{ width: '100%', maxWidth: 480, borderRadius: 24, border: '1px solid #E5DECB', boxShadow: '0 18px 48px rgba(45, 74, 62, 0.08)' }}
        styles={{ body: { padding: 36 } }}
      >
        <Typography.Title
          level={1}
          style={{ fontFamily: 'Georgia, serif', fontSize: 38, color: '#1A1F1B', margin: '0 0 12px' }}
        >
          Quên mật khẩu
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#7B7F7A', fontSize: 16, marginBottom: 28 }}>
          Nhập email tài khoản để nhận đường dẫn đặt lại mật khẩu.
        </Typography.Paragraph>

        <Form<ForgotPasswordFormValues> layout="vertical" requiredMark={false} onFinish={handleSubmit}>
          <Form.Item
            name="email"
            label={<span style={{ fontWeight: 700, color: '#1A1F1B' }}>Email</span>}
            rules={[
              { required: true, message: 'Nhập email' },
              { type: 'email', message: 'Email không hợp lệ' }
            ]}
          >
            <Input placeholder="student@school.edu.vn" style={{ height: 48, borderRadius: 12, borderColor: '#E5DECB' }} />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            loading={submitting}
            style={{ height: 48, background: '#2D4A3E', borderColor: '#2D4A3E', borderRadius: 12, fontWeight: 700 }}
          >
            Gửi yêu cầu đặt lại mật khẩu
          </Button>
        </Form>

        <Typography.Text style={{ display: 'block', textAlign: 'center', marginTop: 24, color: '#8A8E88' }}>
          Nhớ mật khẩu rồi?{' '}
          <Link to="/login" style={{ color: '#2D4A3E', fontWeight: 700 }}>
            Quay lại đăng nhập
          </Link>
        </Typography.Text>
      </Card>
    </div>
  );
}
