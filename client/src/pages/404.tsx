import { Button, Result } from 'antd';
import { history } from '@umijs/max';
import { ROUTES } from '@/constants/routes';

export default function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Khong tim thay trang"
      subTitle="Duong dan ban truy cap khong ton tai."
      extra={<Button onClick={() => history.push(ROUTES.login)}>Ve trang dang nhap</Button>}
    />
  );
}
