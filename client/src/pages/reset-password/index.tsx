import { useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Input, message, Typography } from 'antd';
import { history, Link } from 'umi';
import { resetPassword } from '@/services/auth';

interface ResetPasswordFormValues {
  newPassword: string;
  confirmPassword: string;
}

function getErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { message?: string } } }).response;
    if (response?.data?.message) return response.data.message;
  }

  return error instanceof Error ? error.message : fallback;
}

export default function ResetPasswordPage() {
  const [submitting, setSubmitting] = useState(false);
  const token = useMemo(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('token') || '';
  }, []);

  const handleSubmit = async (values: ResetPasswordFormValues) => {
    if (!token) {
      message.error('Đường dẫn đặt lại mật khẩu thiếu token.', 3);
      return;
    }

    setSubmitting(true);

    try {
      const response = await resetPassword(token, values.newPassword);
      message.success(response.message || 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay.', 3);
      history.push('/login');
    } catch (error) {
      message.error(getErrorMessage(error, 'Không thể đặt lại mật khẩu.'), 3);
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
          Đặt lại mật khẩu
        </Typography.Title>
        <Typography.Paragraph style={{ color: '#7B7F7A', fontSize: 16, marginBottom: 24 }}>
          Nhập mật khẩu mới cho tài khoản BorrowIt của bạn.
        </Typography.Paragraph>

        {!token ? (
          <Alert
            type="error"
            showIcon
            message="Đường dẫn không hợp lệ"
            description="Link đặt lại mật khẩu thiếu token hoặc đã bị lỗi. Vui lòng gửi lại yêu cầu quên mật khẩu."
            style={{ marginBottom: 24 }}
          />
        ) : null}

        <Form<ResetPasswordFormValues> layout="vertical" requiredMark={false} onFinish={handleSubmit} scrollToFirstError>
          <Form.Item
            name="newPassword"
            label={<span style={{ fontWeight: 700, color: '#1A1F1B' }}>Mật khẩu mới</span>}
            rules={[
              { required: true, message: 'Nhập mật khẩu mới' },
              { min: 6, message: 'Mật khẩu tối thiểu 6 ký tự' }
            ]}
          >
            <Input.Password placeholder="Tối thiểu 6 ký tự" style={{ height: 48, borderRadius: 12, borderColor: '#E5DECB' }} />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label={<span style={{ fontWeight: 700, color: '#1A1F1B' }}>Xác nhận mật khẩu</span>}
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Nhập lại mật khẩu mới' },
              ({ getFieldValue }) => ({
                validator(_, value: string) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu xác nhận không khớp'));
                }
              })
            ]}
          >
            <Input.Password placeholder="Nhập lại mật khẩu mới" style={{ height: 48, borderRadius: 12, borderColor: '#E5DECB' }} />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            block
            disabled={!token}
            loading={submitting}
            style={{ height: 48, background: '#2D4A3E', borderColor: '#2D4A3E', borderRadius: 12, fontWeight: 700 }}
          >
            Đổi mật khẩu
          </Button>
        </Form>

        <Typography.Text style={{ display: 'block', textAlign: 'center', marginTop: 24, color: '#8A8E88' }}>
          <Link to="/login" style={{ color: '#2D4A3E', fontWeight: 700 }}>
            Quay lại đăng nhập
          </Link>
        </Typography.Text>
      </Card>
    </div>
  );
}
