import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export default function AdminPageHeader({ title, description, actions }: AdminPageHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, marginBottom: 24, flexWrap: 'wrap' }}>
      <div>
        <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 34, fontWeight: 500, lineHeight: 1.12, margin: '0 0 8px', color: '#1A1F1B' }}>
          {title}
        </h1>
        {description ? <p style={{ color: '#6B6F6C', margin: 0 }}>{description}</p> : null}
      </div>
      {actions ? <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div> : null}
    </div>
  );
}
