import { Card, Col, Row, Table, Tag, Typography } from 'antd';
import AdminPageHeader from '@/components/admin/AdminPageHeader';
import AdminTableCard from '@/components/admin/AdminTableCard';

interface TrustRulesContentProps {
  audience: 'student' | 'admin';
}

interface ScoreRule {
  key: string;
  event: string;
  score: string;
  note: string;
}

const SCORE_RULES: ScoreRule[] = [
  {
    key: 'return_ontime',
    event: 'Trả thiết bị tình trạng hoàn hảo và đúng hạn',
    score: '+2',
    note: 'Cộng khi admin ghi nhận trả, ngày trả thực tế không vượt ngày hẹn.'
  },
  {
    key: 'minor_damage',
    event: 'Trả thiết bị trầy/hư hỏng nhẹ',
    score: '-10',
    note: 'Chuỗi trả tốt được tính lại khi thiết bị có hư hỏng.'
  },
  {
    key: 'major_damage',
    event: 'Thiết bị hư hỏng nặng hoặc mất',
    score: '-30',
    note: 'Áp dụng khi admin ghi nhận thiết bị hư hỏng nặng hoặc bị mất.'
  },
  {
    key: 'late_return',
    event: 'Đơn quá hạn trả',
    score: '-3 mỗi ngày',
    note: 'Hệ thống kiểm tra hằng ngày và trừ điểm với các đơn đã quá ngày trả.'
  },
  {
    key: 'cancel_approved',
    event: 'Sinh viên huỷ đơn sau khi đã được duyệt',
    score: '-3',
    note: 'Huỷ khi đơn còn pending không trừ điểm.'
  },
  {
    key: 'noshow',
    event: 'Không đến nhận thiết bị sau hạn nhận',
    score: '-10',
    note: 'Hệ thống kiểm tra các đơn đã duyệt nhưng quá hạn nhận thiết bị.'
  },
  {
    key: 'streak_3',
    event: 'Chuỗi 3 lần trả đồ hoàn hảo',
    score: '+5',
    note: 'Thưởng khi goodReturnStreak đạt đúng mốc 3.'
  },
  {
    key: 'streak_5',
    event: 'Chuỗi 5 lần trả đồ hoàn hảo',
    score: '+7',
    note: 'Thưởng khi goodReturnStreak đạt đúng mốc 5.'
  },
  {
    key: 'admin_manual',
    event: 'Admin điều chỉnh điểm thủ công',
    score: 'Theo số điểm nhập',
    note: 'Điều chỉnh thủ công bởi admin và lưu lại lịch sử thay đổi.'
  }
];

const RANK_RULES = [
  { rank: 'Kim cương', condition: 'Điểm uy tín từ 90', color: '#075985', bg: '#E0F2FE' },
  { rank: 'Vàng', condition: 'Điểm uy tín từ 80', color: '#8B6A1F', bg: '#F5EBD0' },
  { rank: 'Bạc', condition: 'Điểm uy tín từ 65', color: '#4A5568', bg: '#ECEEF2' },
  { rank: 'Đồng', condition: 'Điểm uy tín từ 50', color: '#8C4A36', bg: '#F7E8DF' },
  { rank: 'Đá cuội', condition: 'Điểm uy tín dưới 50', color: '#3F403D', bg: '#EFE9DD' }
];

function ScoreTag({ value }: { value: string }) {
  const isPenalty = value.startsWith('-');
  const isReward = value.startsWith('+');

  return (
    <Tag
      style={{
        border: 'none',
        borderRadius: 999,
        margin: 0,
        color: isPenalty ? '#9B3E33' : isReward ? '#2F6F3E' : '#4A5568',
        background: isPenalty ? '#F2DDD7' : isReward ? '#E1EFE3' : '#ECEEF2',
        fontWeight: 700
      }}
    >
      {value}
    </Tag>
  );
}

export default function TrustRulesContent({ audience }: TrustRulesContentProps) {
  return (
    <div style={{ paddingBottom: 48, maxWidth: 1180 }}>
      <AdminPageHeader
        title="Quy tắc điểm uy tín"
        description={
          audience === 'admin'
            ? 'Các mức điểm được áp dụng khi xử lý đơn mượn, trả và điều chỉnh thủ công.'
            : 'Các mức điểm được áp dụng cho quá trình mượn, trả và giữ thiết bị.'
        }
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 18 }}>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ border: '1px solid #E5DECB', borderRadius: 14, height: '100%' }}>
            <Typography.Text style={{ color: '#6B6F6C', fontSize: 12 }}>GIỚI HẠN ĐIỂM</Typography.Text>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: '#1A1F1B', marginTop: 8 }}>0-100</div>
            <Typography.Paragraph style={{ color: '#6B6F6C', marginBottom: 0 }}>
              Hệ thống giới hạn điểm uy tín trong khoảng 0 đến 100.
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ border: '1px solid #E5DECB', borderRadius: 14, height: '100%' }}>
            <Typography.Text style={{ color: '#6B6F6C', fontSize: 12 }}>TRẢ ĐÚNG HẠN</Typography.Text>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: '#2F6F3E', marginTop: 8 }}>+2</div>
            <Typography.Paragraph style={{ color: '#6B6F6C', marginBottom: 0 }}>
              Chỉ cộng khi thiết bị được trả hoàn hảo và không quá ngày trả dự kiến.
            </Typography.Paragraph>
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card variant="borderless" style={{ border: '1px solid #E5DECB', borderRadius: 14, height: '100%' }}>
            <Typography.Text style={{ color: '#6B6F6C', fontSize: 12 }}>QUÁ HẠN</Typography.Text>
            <div style={{ fontFamily: 'Georgia, serif', fontSize: 36, color: '#B05A4D', marginTop: 8 }}>-3/ngày</div>
            <Typography.Paragraph style={{ color: '#6B6F6C', marginBottom: 0 }}>
              Hệ thống kiểm tra hằng ngày và trừ điểm với các đơn đã quá ngày trả.
            </Typography.Paragraph>
          </Card>
        </Col>
      </Row>

      <div style={{ marginBottom: 18 }}>
        <AdminTableCard>
          <Typography.Title level={4} style={{ marginTop: 0 }}>Biến động điểm</Typography.Title>
          <Table<ScoreRule>
            rowKey="key"
            pagination={false}
            dataSource={SCORE_RULES}
            scroll={{ x: 'max-content' }}
            columns={[
              { title: 'Sự kiện', dataIndex: 'event' },
              { title: 'Điểm', dataIndex: 'score', render: (value: string) => <ScoreTag value={value} /> },
              { title: 'Cách áp dụng', dataIndex: 'note' }
            ]}
          />
        </AdminTableCard>
      </div>

      <Card variant="borderless" style={{ border: '1px solid #E5DECB', borderRadius: 14 }}>
        <Typography.Title level={4} style={{ marginTop: 0 }}>Xếp hạng</Typography.Title>
        <Row gutter={[12, 12]}>
          {RANK_RULES.map((rule) => (
            <Col xs={24} sm={12} lg={8} xl={4} key={rule.rank}>
              <div style={{ border: '1px solid #EFEADA', borderRadius: 12, padding: 14, height: '100%', background: '#FFFFFF' }}>
                <Tag style={{ border: 'none', borderRadius: 999, color: rule.color, background: rule.bg, fontWeight: 700, marginBottom: 10 }}>
                  {rule.rank}
                </Tag>
                <div style={{ color: '#1A1F1B', fontWeight: 700 }}>{rule.condition}</div>
              </div>
            </Col>
          ))}
        </Row>
        <Typography.Paragraph style={{ color: '#6B6F6C', margin: '18px 0 0' }}>
          Hạng được cập nhật tự động dựa trên điểm uy tín hiện tại.
        </Typography.Paragraph>
      </Card>
    </div>
  );
}
