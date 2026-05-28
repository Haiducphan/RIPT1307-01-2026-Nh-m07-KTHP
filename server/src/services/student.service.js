const Student = require('../models/student.model');
const User = require('../models/user.models');
const TrustScoreLog = require('../models/trustScoreLog.model');

const TRUST_RANK = [
  { rank: 'diamond', min: 100 },
  { rank: 'gold', min: 90 },
  { rank: 'silver', min: 75 },
  { rank: 'bronze', min: 50 },
  { rank: 'locked', min: 0 }
];

function calcRank(score) {
  for (const r of TRUST_RANK) {
    if (score >= r.min) return r.rank;
  }
  return 'locked';
}

async function adjustTrustScore(studentId, delta, adminId, note) {
  if (!delta || delta === 0) {
    const err = new Error('delta khong duoc bang 0');
    err.status = 400;
    throw err;
  }

  const student = await Student.findByPk(studentId);
  if (!student) {
    const err = new Error('Khong tim thay sinh vien');
    err.status = 404;
    throw err;
  }

  const scoreBefore = student.trustScore;
  const rankBefore = student.trustRank;
  const scoreAfter = Math.min(100, Math.max(0, scoreBefore + delta));
  const rankAfter = calcRank(scoreAfter);

  await student.update({ trustScore: scoreAfter, trustRank: rankAfter });

  await TrustScoreLog.create({
    studentId: student.id,
    borrowRequestId: null,
    delta,
    scoreBefore,
    scoreAfter,
    rankBefore,
    rankAfter,
    reason: delta > 0 ? 'admin_manual_add' : 'admin_manual_deduct',
    note: note || null,
    createdBy: adminId
  });

  return { studentId: student.id, scoreBefore, scoreAfter, delta, rankBefore, rankAfter };
}

async function setBorrowLock(studentId, locked) {
  const student = await Student.findByPk(studentId);
  if (!student) {
    const err = new Error('Khong tim thay sinh vien');
    err.status = 404;
    throw err;
  }

  const user = await User.findByPk(student.userId);
  if (!user) {
    const err = new Error('Khong tim thay user tuong ung');
    err.status = 404;
    throw err;
  }

  await user.update({ is_active: !locked });

  return {
    studentId: student.id,
    userId: user.id,
    email: user.email,
    isLocked: locked,
    is_active: !locked
  };
}

module.exports = { adjustTrustScore, setBorrowLock };