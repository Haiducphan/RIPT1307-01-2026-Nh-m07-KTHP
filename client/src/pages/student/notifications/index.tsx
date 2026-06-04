import { useMemo, useState } from 'react';
import { Avatar, Badge, Button, Empty, List, message, Space, Tabs, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import { history } from 'umi';
import { useAsyncData } from '@/hooks/useAsyncData';
import { getMyNotifications, markNotificationRead } from '@/services/notifications';
import type { NotificationCategory, NotificationItem } from '@/services/notifications';
import { ROUTES } from '@/constants/routes';

type NotificationTab = 'all' | 'unread' | NotificationCategory;

const TYPE_STYLE: Record<string, { color: string; bg: string; icon: string }> = {
  request_approved: { color: '#2F6F3E', bg: '#E1EFE3', icon: '✓' },
  request_rejected: { color: '#9B3E33', bg: '#F2DDD7', icon: '✗' },
  pickup_reminder: { color: '#8B6A1F', bg: '#F5EBD0', icon: '!' },
  return_reminder: { color: '#8B6A1F', bg: '#F5EBD0', icon: '!' },
  overdue_warning: { color: '#9B3E33', bg: '#F2DDD7', icon: '!' },
  trust_point_added: { color: '#2F6F3E', bg: '#E1EFE3', icon: '+' },
  trust_point_deducted: { color: '#9B3E33', bg: '#F2DDD7', icon: '-' },
  streak_bonus: { color: '#2563EB', bg: '#DCE4F0', icon: '+' },
  account_locked: { color: '#9B3E33', bg: '#F2DDD7', icon: '!' },
  tier_changed: { color: '#2563EB', bg: '#DCE4F0', icon: '★' },
  new_request: { color: '#2563EB', bg: '#DCE4F0', icon: 'i' },
  system_announcement: { color: '#2563EB', bg: '#DCE4F0', icon: 'i' }
};

const CATEGORY_LABEL: Record<NotificationCategory, string> = {
  request: 'Đơn mượn',
  trust: 'Điểm uy tín',
  system: 'Hệ thống'
};

function getFilteredNotifications(notifications: NotificationItem[], activeTab: NotificationTab) {
  if (activeTab === 'unread') return notifications.filter((item) => !item.isRead);
  if (activeTab === 'request' || activeTab === 'trust' || activeTab === 'system') {
    return notifications.filter((item) => item.category === activeTab);
  }
  return notifications;
}

function formatNotificationTime(value?: string) {
  if (!value) return 'Chưa có thời gian';
  const date = dayjs(value);
  return date.isValid() ? date.format('DD/MM/YYYY HH:mm') : value;
}

function getTypeStyle(type: string) {
  return TYPE_STYLE[type] ?? TYPE_STYLE.system_announcement;
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');
  const [readingId, setReadingId] = useState<string>();
  const { data: notifications = [], loading, refresh } = useAsyncData(getMyNotifications, []);
  const counts = useMemo(
    () => ({
      all: notifications.length,
      unread: notifications.filter((item) => !item.isRead).length,
      request: notifications.filter((item) => item.category === 'request').length,
      trust: notifications.filter((item) => item.category === 'trust').length,
      system: notifications.filter((item) => item.category === 'system').length
    }),
    [notifications]
  );
  const filteredNotifications = useMemo(
    () => getFilteredNotifications(notifications, activeTab),
    [activeTab, notifications]
  );

  const markAsRead = async (item: NotificationItem) => {
    if (item.isRead || readingId) return true;

    setReadingId(item.id);
    try {
      await markNotificationRead(item.id);
      await refresh();
      return true;
    } catch {
      message.error('Không thể đánh dấu thông báo đã đọc', 3);
      return false;
    } finally {
      setReadingId(undefined);
    }
  };

  const handleNotificationClick = async (item: NotificationItem) => {
    const marked = await markAsRead(item);
    if (marked && item.relatedRequestId) {
      history.push(`${ROUTES.studentRequests}?requestId=${encodeURIComponent(item.relatedRequestId)}`);
    }
  };

  const tabItems = [
    { key: 'all', label: `Tất cả (${counts.all})` },
    { key: 'unread', label: `Chưa đọc (${counts.unread})` },
    { key: 'request', label: `Đơn mượn (${counts.request})` },
    { key: 'trust', label: `Điểm uy tín (${counts.trust})` },
    { key: 'system', label: `Hệ thống (${counts.system})` }
  ];

  return (
    <div style={{ paddingBottom: 48 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          gap: 16,
          marginBottom: 24,
          flexWrap: 'wrap'
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: 'var(--app-heading-font)',
              fontSize: 34,
              fontWeight: 500,
              lineHeight: 1.1,
              color: '#1A1F1B',
              margin: '0 0 8px'
            }}
          >
            Thông báo của tôi
          </h1>
          <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
            Cập nhật về các đơn mượn và điểm uy tín từ hệ thống
          </p>
        </div>
        <Tooltip title="Chức năng này sẽ khả dụng khi hệ thống hỗ trợ.">
          <span>
            <Button disabled>Đánh dấu đã đọc tất cả</Button>
          </span>
        </Tooltip>
      </div>
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={(key) => setActiveTab(key as NotificationTab)}
        style={{ marginBottom: 18 }}
      />
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E5DECB',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 1px 2px rgba(45, 74, 62, 0.04)'
        }}
      >
        {filteredNotifications.length === 0 ? (
          <Empty
            description={
              <div>
                <h3 style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>
                  {notifications.length === 0
                    ? 'Chưa có thông báo từ hệ thống'
                    : activeTab === 'unread'
                      ? 'Bạn đã đọc hết thông báo'
                      : 'Không có thông báo trong mục này'}
                </h3>
                <p style={{ color: '#6B6F6C', fontSize: 14, margin: 0 }}>
                  {notifications.length === 0
                    ? 'Khi có thông báo mới, danh sách sẽ hiển thị tại đây.'
                    : activeTab === 'unread'
                      ? 'Không còn thông báo chưa đọc nào.'
                      : 'Chuyển sang tab khác để xem các thông báo phù hợp.'}
                </p>
              </div>
            }
            style={{ padding: '72px 0' }}
          />
        ) : (
          <List
            loading={loading}
            dataSource={filteredNotifications}
            split={false}
            renderItem={(item) => {
              const typeStyle = getTypeStyle(item.type);
              return (
                <List.Item
                  onClick={() => handleNotificationClick(item)}
                  style={{
                    cursor: item.relatedRequestId || (!item.isRead && !readingId) ? 'pointer' : 'default',
                    padding: '18px 20px',
                    background: item.isRead ? '#FFFFFF' : '#FBF8F2',
                    borderBottom: '1px solid #EFEADA',
                    alignItems: 'flex-start',
                    opacity: readingId === item.id ? 0.72 : 1
                  }}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={48}
                        style={{
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          fontWeight: 700,
                          fontSize: 22
                        }}
                      >
                        {typeStyle.icon}
                      </Avatar>
                    }
                    title={
                      <Space size={8} wrap>
                        <Typography.Text strong={!item.isRead} style={{ color: '#1A1F1B' }}>
                          {item.title}
                        </Typography.Text>
                        <Tag style={{ margin: 0, borderRadius: 999, borderColor: '#E5DECB', color: '#6B6F6C' }}>
                          {CATEGORY_LABEL[item.category]}
                        </Tag>
                      </Space>
                    }
                    description={
                      <div>
                        <Typography.Paragraph
                          ellipsis={{ rows: 2 }}
                          style={{ color: '#6B6F6C', fontSize: 13, lineHeight: 1.6, marginBottom: 6 }}
                        >
                          {item.content || 'Không có nội dung thông báo'}
                        </Typography.Paragraph>
                        <Typography.Text style={{ color: '#9A9D98', fontSize: 12 }}>{formatNotificationTime(item.createdAt)}</Typography.Text>
                      </div>
                    }
                  />
                  {!item.isRead && <Badge color="#B05A4D" style={{ marginTop: 8 }} />}
                </List.Item>
              );
            }}
          />
        )}
      </div>
    </div>
  );
}
