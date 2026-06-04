import { SafetyCertificateOutlined } from '@ant-design/icons';

interface TrustRulesContentProps {
  audience: 'student' | 'admin';
}

const rankRules = [
  {
    rank: 'Kim cương',
    range: '90 - 100',
    permission: 'Mượn được mọi thiết bị',
    className: 'diamond'
  },
  {
    rank: 'Vàng',
    range: '80 - 89',
    permission: 'Mượn được hạng A trở xuống',
    className: 'gold'
  },
  {
    rank: 'Bạc',
    range: '66 - 79',
    permission: 'Mượn được hạng B trở xuống',
    className: 'silver'
  },
  {
    rank: 'Đồng',
    range: '50 - 65',
    permission: 'Mượn được hạng C',
    className: 'bronze'
  },
  {
    rank: 'Đá cuội',
    range: '0 - 49',
    permission: 'Bị khoá tính năng mượn',
    className: 'stone'
  }
];

const penaltyRules = [
  {
    action: 'Tự huỷ đơn khi chờ duyệt',
    note: 'Không phạt vì yêu cầu chưa được xử lý',
    points: '0đ',
    tone: 'neutral'
  },
  {
    action: 'Tự huỷ đơn sau khi đã duyệt',
    note: 'Phạt nhẹ vì ảnh hưởng quy trình chuẩn bị',
    points: '-3đ',
    tone: 'warning'
  },
  {
    action: 'Quá hạn không nhận đồ/Bom',
    note: 'Áp dụng khi quá thời hạn nhận thiết bị',
    points: '-10đ',
    tone: 'danger'
  },
  {
    action: 'Trả trễ hạn',
    note: 'Nhân theo số ngày trễ',
    points: '-3đ/ngày',
    tone: 'danger'
  },
  {
    action: 'Hỏng nhẹ thiết bị, sửa được',
    note: 'Thiết bị vẫn có thể khắc phục',
    points: '-10đ',
    tone: 'danger'
  },
  {
    action: 'Mất/hỏng hoàn toàn',
    note: 'Thiết bị không thể tiếp tục sử dụng',
    points: '-30đ',
    tone: 'danger'
  }
];

const rewardRules = [
  {
    action: 'Trả đúng hạn, đồ hoàn hảo',
    note: 'Chỉ cộng nếu điểm hiện tại chưa đạt tối đa',
    points: '+2đ'
  },
  {
    action: 'Chuỗi tốt 3 lần liên tiếp',
    note: 'Thưởng khi duy trì lịch sử trả tốt',
    points: '+5đ'
  },
  {
    action: 'Chuỗi tốt 5 lần liên tiếp',
    note: 'Mốc thưởng cho thói quen mượn trả ổn định',
    points: '+7đ'
  },
  {
    action: 'Admin phục hồi thủ công',
    note: 'Áp dụng khi có lý do phù hợp',
    points: 'tuỳ chỉnh'
  }
];

const lockRules = [
  {
    from: 'Vàng',
    to: 'Bạc',
    fromClassName: 'gold',
    toClassName: 'silver',
    duration: 'Khoá 3 ngày',
    note: 'Cảnh cáo nhẹ, có thể khắc phục'
  },
  {
    from: 'Bạc',
    to: 'Đồng',
    fromClassName: 'silver',
    toClassName: 'bronze',
    duration: 'Khoá 7 ngày',
    note: 'Cần cẩn trọng hơn trong lần mượn tiếp theo'
  },
  {
    from: 'Đồng',
    to: 'Đá cuội',
    fromClassName: 'bronze',
    toClassName: 'stone',
    duration: 'Vĩnh viễn',
    note: 'Có thể kháng cáo và khắc phục',
    danger: true
  }
];

function RankBadge({ label, className }: { label: string; className: string }) {
  return <span className={`trust-rules__rank-badge trust-rules__rank-badge--${className}`}>★ {label}</span>;
}

function PointValue({ value, tone }: { value: string; tone?: string }) {
  return <span className={`trust-rules__points trust-rules__points--${tone || 'success'}`}>{value}</span>;
}

export default function TrustRulesContent({ audience }: TrustRulesContentProps) {
  return (
    <div className="trust-rules">
      <style>{`
        .trust-rules {
          max-width: 1180px;
          padding: 8px 0 48px;
          color: #1A1F1B;
          font-family: var(--app-font);
        }

        .trust-rules__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          gap: 18px;
          margin-bottom: 32px;
          flex-wrap: wrap;
        }

        .trust-rules__title {
          margin: 0 0 8px;
          font-family: var(--app-heading-font);
          font-size: clamp(30px, 4vw, 42px);
          line-height: 1.12;
          font-weight: 750;
          letter-spacing: 0;
        }

        .trust-rules__title-accent {
          color: #2D4A3E;
          font-style: italic;
        }

        .trust-rules__subtitle {
          margin: 0;
          color: #6B6F6C;
          font-size: 15px;
        }

        .trust-rules__admin-note {
          display: flex;
          align-items: center;
          gap: 10px;
          max-width: 360px;
          border: 1px solid #D9E5DD;
          background: #F2F7F4;
          color: #35584A;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 13px;
          line-height: 1.5;
        }

        .trust-rules__section-title {
          margin: 0 0 14px;
          font-size: 17px;
          font-weight: 800;
          color: #1A1F1B;
        }

        .trust-rules__rank-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(168px, 1fr));
          gap: 12px;
          margin-bottom: 32px;
        }

        .trust-rules__rank-card,
        .trust-rules__panel,
        .trust-rules__lock-card {
          background: #FFFDF8;
          border: 1px solid #E5DECB;
          border-radius: 12px;
          box-shadow: 0 14px 36px rgba(45, 74, 62, 0.05);
        }

        .trust-rules__rank-card {
          min-height: 152px;
          padding: 18px 14px;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }

        .trust-rules__rank-card--diamond { border-color: #75BFE0; }
        .trust-rules__rank-card--gold { border-color: #D9B96A; }
        .trust-rules__rank-card--silver { border-color: #B8BFC8; }
        .trust-rules__rank-card--bronze { border-color: #D9A088; }

        .trust-rules__rank-badge {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 999px;
          padding: 5px 10px;
          font-size: 12px;
          font-weight: 800;
          margin-bottom: 12px;
          white-space: nowrap;
        }

        .trust-rules__rank-badge--diamond {
          color: #075985;
          background: #E0F2FE;
        }

        .trust-rules__rank-badge--gold {
          color: #8B6A1F;
          background: #F5EBD0;
        }

        .trust-rules__rank-badge--silver {
          color: #4A5568;
          background: #ECEEF2;
        }

        .trust-rules__rank-badge--bronze {
          color: #8C4A36;
          background: #F7E8DF;
        }

        .trust-rules__rank-badge--stone {
          color: #3F403D;
          background: #EFE9DD;
        }

        .trust-rules__rank-range {
          font-family: var(--app-heading-font);
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .trust-rules__rank-permission {
          color: #6B6F6C;
          font-size: 13px;
          line-height: 1.45;
        }

        .trust-rules__rules-grid {
          display: grid;
          grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
          gap: 24px;
        }

        .trust-rules__panel {
          overflow: hidden;
        }

        .trust-rules__panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 18px 22px;
          border-bottom: 1px solid #E5DECB;
        }

        .trust-rules__panel-title {
          font-size: 17px;
          font-weight: 800;
        }

        .trust-rules__rows {
          padding: 6px 22px 10px;
        }

        .trust-rules__row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          gap: 16px;
          align-items: center;
          padding: 14px 0;
          border-bottom: 1px solid #EFEADA;
        }

        .trust-rules__row:last-child {
          border-bottom: 0;
        }

        .trust-rules__action {
          font-weight: 700;
          line-height: 1.35;
        }

        .trust-rules__note {
          margin-top: 4px;
          color: #7B7F7A;
          font-size: 12px;
          line-height: 1.45;
        }

        .trust-rules__points {
          min-width: 72px;
          text-align: right;
          font-weight: 800;
          white-space: nowrap;
        }

        .trust-rules__points--success { color: #2F6F3E; }
        .trust-rules__points--danger { color: #9B3E33; }
        .trust-rules__points--warning { color: #8B6A1F; }
        .trust-rules__points--neutral { color: #3F403D; }

        .trust-rules__lock-section {
          margin-top: 32px;
        }

        .trust-rules__alert {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border: 1px solid #E5D0A0;
          background: #FFF7DD;
          color: #6B5018;
          border-radius: 10px;
          padding: 14px 16px;
          margin-bottom: 18px;
          line-height: 1.55;
          font-size: 13px;
        }

        .trust-rules__lock-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 16px;
        }

        .trust-rules__lock-card {
          padding: 18px;
        }

        .trust-rules__lock-card--danger {
          border-color: #E5C6BE;
        }

        .trust-rules__lock-flow {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 12px;
        }

        .trust-rules__lock-flow .trust-rules__rank-badge {
          margin-bottom: 0;
        }

        .trust-rules__arrow {
          color: #8A8E88;
        }

        .trust-rules__lock-duration {
          font-family: var(--app-heading-font);
          font-size: 24px;
          font-weight: 800;
          margin-bottom: 6px;
        }

        .trust-rules__lock-duration--danger {
          color: #9B3E33;
        }

        .trust-rules__lock-note {
          color: #7B7F7A;
          font-size: 13px;
          line-height: 1.5;
        }

        @media (max-width: 900px) {
          .trust-rules__rules-grid,
          .trust-rules__lock-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 560px) {
          .trust-rules {
            padding-top: 4px;
          }

          .trust-rules__header {
            margin-bottom: 24px;
          }

          .trust-rules__rank-grid {
            grid-template-columns: 1fr;
          }

          .trust-rules__row {
            grid-template-columns: 1fr;
            gap: 8px;
          }

          .trust-rules__points {
            text-align: left;
          }
        }
      `}</style>

      <header className="trust-rules__header">
        <div>
          <h1 className="trust-rules__title">Quy tắc điểm uy tín</h1>
          <p className="trust-rules__subtitle">Hệ thống xếp hạng và quy định mượn – trả thiết bị.</p>
        </div>

        {audience === 'admin' ? (
          <div className="trust-rules__admin-note">
            <SafetyCertificateOutlined />
            <span>Quản trị viên có thể mở hoặc khoá thủ công khi hệ thống hỗ trợ.</span>
          </div>
        ) : null}
      </header>

      <section>
        <h2 className="trust-rules__section-title">Xếp hạng điểm uy tín</h2>
        <div className="trust-rules__rank-grid">
          {rankRules.map((rule) => (
            <article className={`trust-rules__rank-card trust-rules__rank-card--${rule.className}`} key={rule.rank}>
              <RankBadge label={rule.rank} className={rule.className} />
              <div className="trust-rules__rank-range">{rule.range}</div>
              <div className="trust-rules__rank-permission">{rule.permission}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="trust-rules__rules-grid">
        <article className="trust-rules__panel">
          <div className="trust-rules__panel-header">
            <div className="trust-rules__panel-title">⚡ Quy tắc trừ điểm</div>
          </div>
          <div className="trust-rules__rows">
            {penaltyRules.map((rule) => (
              <div className="trust-rules__row" key={rule.action}>
                <div>
                  <div className="trust-rules__action">{rule.action}</div>
                  <div className="trust-rules__note">{rule.note}</div>
                </div>
                <PointValue value={rule.points} tone={rule.tone} />
              </div>
            ))}
          </div>
        </article>

        <article className="trust-rules__panel">
          <div className="trust-rules__panel-header">
            <div className="trust-rules__panel-title">✓ Quy tắc cộng điểm</div>
          </div>
          <div className="trust-rules__rows">
            {rewardRules.map((rule) => (
              <div className="trust-rules__row" key={rule.action}>
                <div>
                  <div className="trust-rules__action">{rule.action}</div>
                  <div className="trust-rules__note">{rule.note}</div>
                </div>
                <PointValue value={rule.points} />
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="trust-rules__lock-section">
        <h2 className="trust-rules__section-title">🔒 Quy tắc khoá tính năng mượn</h2>
        <div className="trust-rules__alert">
          <span>⚠️</span>
          <div>
            Khi tài khoản tụt hạng, hệ thống tự động khoá tính năng mượn để sinh viên có thời gian nhìn lại và cải thiện ý thức.
          </div>
        </div>

        <div className="trust-rules__lock-grid">
          {lockRules.map((rule) => (
            <article className={`trust-rules__lock-card${rule.danger ? ' trust-rules__lock-card--danger' : ''}`} key={`${rule.from}-${rule.to}`}>
              <div className="trust-rules__lock-flow">
                <RankBadge label={rule.from} className={rule.fromClassName} />
                <span className="trust-rules__arrow">→</span>
                <RankBadge label={rule.to} className={rule.toClassName} />
              </div>
              <div className={`trust-rules__lock-duration${rule.danger ? ' trust-rules__lock-duration--danger' : ''}`}>{rule.duration}</div>
              <div className="trust-rules__lock-note">{rule.note}</div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
