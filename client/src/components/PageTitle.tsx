import { Typography } from 'antd';

interface PageTitleProps {
  title: string;
  description?: string;
}

export default function PageTitle({ title, description }: PageTitleProps) {
  return (
    <div className="page-header">
      <Typography.Title level={3}>{title}</Typography.Title>
      {description ? <Typography.Text type="secondary">{description}</Typography.Text> : null}
    </div>
  );
}
