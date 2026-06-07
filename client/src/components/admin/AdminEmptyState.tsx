import type { ReactNode } from 'react';
import { Empty } from 'antd';

interface AdminEmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
}

export default function AdminEmptyState({ title, description, icon, children }: AdminEmptyStateProps) {
  return (
    <Empty
      image={icon ? <div style={{ fontSize: 58 }}>{icon}</div> : Empty.PRESENTED_IMAGE_SIMPLE}
      styles={{ image: { height: icon ? 78 : 60, marginBottom: 14 } }}
      description={
        <div>
          <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>{title}</h3>
          {description ? <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>{description}</p> : null}
        </div>
      }
      style={{ padding: '52px 0' }}
    >
      {children}
    </Empty>
  );
}
