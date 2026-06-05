import { Button, Form, Input, message, Radio } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types';

interface LoginFormValues {
  email: string;
  password: string;
  role: UserRole;
}

export default function LoginPage() {
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();

  const handleSubmit = async (values: LoginFormValues) => {
    try {
      
      navigate('/dashboard'); 
    } catch {
      message.error('Đăng nhập thất bại');
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#fcfbfa] font-sans antialiased">
      
      {}
      <div className="relative hidden w-[42%] flex-col justify-between bg-[#233a30] p-12 text-white md:flex">
        {}
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/10 font-serif text-xl italic font-bold">
            B
          </div>
        </div>

        {}
        <div className="max-w-md space-y-4 mb-20">
          <h1 className="text-4xl font-medium leading-tight tracking-tight text-white">
            Mượn đồ <span className="text-[#c5876c] italic font-serif">thông minh</span>,<br />
            quản lý <span className="text-[#c5876c] italic font-serif">dễ dàng</span>.
          </h1>
          <p className="text-sm text-gray-300/90 font-light leading-relaxed">
            Hệ thống quản lý mượn – trả thiết bị dành cho câu lạc bộ, với cơ chế điểm uy tín giúp xây dựng văn hóa mượn trả lành mạnh.
          </p>
        </div>

        {}
        <div className="text-xs text-gray-400/80 font-light">
          CLB · BorrowIt v1.0 · 2026
        </div>
      </div>

      {}
      <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-24 lg:px-36">
        <div className="w-full max-w-md space-y-6">
          
          {}
          <div className="space-y-1">
            <h2 className="text-3xl font-serif font-medium text-gray-900 m-0">Chào mừng trở lại</h2>
            <p className="text-sm text-gray-400 font-light m-0">
              Đăng nhập bằng tài khoản sinh viên hoặc admin của CLB
            </p>
          </div>

          {}
          <Form<LoginFormValues>
            layout="vertical"
            initialValues={{ email: 'student@example.com', password: '123456', role: 'student' }}
            onFinish={handleSubmit}
            requiredMark={false} 
            className="space-y-4"
          >
            {}
            <Form.Item name="role" label={<span className="text-xs font-medium text-gray-500">Vai trò hệ thống</span>} className="mb-3">
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                className="w-full flex"
                options={[
                  { label: 'Sinh viên', value: 'student' },
                  { label: 'Quản trị viên', value: 'admin' }
                ]}
                style={{ width: '100%' }}
              />
            </Form.Item>

            {}
            <Form.Item 
              name="email" 
              label={<span className="text-xs font-medium text-gray-700">Mã sinh viên / Email</span>}
              rules={[{ required: true, message: 'Vui lòng nhập email!' }]}
              className="mb-4"
            >
              <Input 
                className="hover:border-[#233a30] focus:border-[#233a30] rounded-md py-2 text-sm" 
                placeholder="22000123"
              />
            </Form.Item>

            {}
            <Form.Item 
              name="password" 
              label={<span className="text-xs font-medium text-gray-700">Mật khẩu</span>}
              rules={[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]}
              className="mb-2"
            >
              <Input.Password 
                className="hover:border-[#233a30] focus:border-[#233a30] rounded-md py-2 text-sm"
                placeholder="********"
              />
            </Form.Item>

            {}
            <div className="flex items-center justify-between text-xs pt-1 pb-2">
              <label className="flex items-center space-x-2 cursor-pointer text-gray-500">
                <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 accent-[#233a30]" />
                <span>Ghi nhớ đăng nhập</span>
              </label>
              <a href="#forgot" className="font-medium text-gray-600 hover:text-[#233a30] hover:underline">
                Quên mật khẩu?
              </a>
            </div>

            {}
            <Form.Item className="mb-0">
              <Button 
                type="primary" 
                htmlType="submit" 
                block
                className="rounded-md border-none py-5.5 text-sm font-medium text-white flex items-center justify-center transition"
                style={{ backgroundColor: '#233a30' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#1a2c24')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#233a30')}
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>

          {}
          <div className="relative flex items-center justify-center py-1">
            <div className="absolute w-full border-t border-gray-200"></div>
            <span className="relative bg-[#fcfbfa] px-3 text-xs text-gray-400">hoặc</span>
          </div>

          {}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 active:scale-[0.99]"
          >
            <svg className="h-4 w-4 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3z" />
              <path d="M21 13.51v3.99c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2v-3.99l9 4.91 9-4.91z" />
            </svg>
            Đăng nhập bằng tài khoản trường
          </button>

          {}
          <div className="text-center text-xs text-gray-500">
            Chưa có tài khoản?{' '}
            <a href="#register" className="font-semibold text-gray-800 hover:text-[#233a30] hover:underline">
              Đăng ký ngay
            </a>
          </div>

        </div>
      </div>

    </div>
  );
}