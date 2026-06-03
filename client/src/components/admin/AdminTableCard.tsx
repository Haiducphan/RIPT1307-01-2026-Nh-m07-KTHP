import type { ReactNode } from 'react';
import { Card } from 'antd';

interface AdminTableCardProps {
  title?: ReactNode;
  extra?: ReactNode;
  children: ReactNode;
}

export default function AdminTableCard({ title, extra, children }: AdminTableCardProps) {
  return (
    <Card
      title={title}
      extra={extra}
      variant="borderless"
      style={{ borderRadius: 14, border: '1px solid #E5DECB', overflow: 'hidden', boxShadow: '0 1px 2px rgba(45, 74, 62, 0.04)' }}
      styles={{ body: { padding: 18 } }}
    >
      {children}
    </Card>
  );
}
