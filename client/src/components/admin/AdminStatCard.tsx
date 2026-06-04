import type { ReactNode } from 'react';
import { Card } from 'antd';

interface AdminStatCardProps {
  title: string;
  value: number | string;
  meta?: string;
  icon?: ReactNode;
  accent?: string;
  danger?: boolean;
  featured?: boolean;
}

export default function AdminStatCard({ title, value, meta, icon, accent = '#2D4A3E', danger, featured }: AdminStatCardProps) {
  const textColor = danger ? '#B05A4D' : featured ? '#FFFFFF' : '#1A1F1B';
  const mutedColor = featured ? 'rgba(255,255,255,0.72)' : '#6B6F6C';

  return (
    <Card
      variant="borderless"
      style={{
        borderRadius: 12,
        border: featured ? '1px solid #2D4A3E' : danger ? '1px solid #B05A4D' : '1px solid #E5DECB',
        background: featured ? '#2D4A3E' : '#FFFFFF',
        height: '100%',
        boxShadow: '0 1px 2px rgba(45, 74, 62, 0.04)'
      }}
      styles={{ body: { padding: 20 } }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ color: mutedColor, fontSize: 11, letterSpacing: 0, textTransform: 'uppercase' }}>{title}</div>
        {icon ? (
          <div style={{ width: 34, height: 34, borderRadius: 8, display: 'grid', placeItems: 'center', color: accent, background: featured ? 'rgba(255,255,255,0.12)' : `${accent}14`, fontSize: 18 }}>
            {icon}
          </div>
        ) : null}
      </div>
      <div style={{ fontFamily: 'var(--app-heading-font)', fontSize: 34, lineHeight: 1.1, color: textColor, marginTop: 12 }}>
        {typeof value === 'number' ? value.toLocaleString('vi-VN') : value}
      </div>
      {meta ? <div style={{ color: mutedColor, fontSize: 12, marginTop: 6 }}>{meta}</div> : null}
    </Card>
  );
}
