const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Student = require('../models/student.model');
const Admin = require('../models/admin.model');
const sequelize = require('../config/database');
const emailService = require('./email.service');

const JWT_SECRET = process.env.JWT_SECRET || 'borrow-equipment-secret';
const DEFAULT_FRONTEND_URL = 'http://localhost:8000';
const FORGOT_PASSWORD_SAFE_MESSAGE = 'Nếu email tồn tại trong hệ thống, hướng dẫn đặt lại mật khẩu đã được gửi đến email của bạn.';

function getFrontendUrl() {
  const configuredUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || DEFAULT_FRONTEND_URL;
  return configuredUrl.replace(/\/+$/, '');
}

async function getUserDisplayName(user) {
  if (user.role === 'student') {
    const student = await Student.findOne({ where: { userId: user.id } });
    return student?.fullName?.trim() || 'bạn';
  }

  if (user.role === 'admin') {
    const admin = await Admin.findOne({ where: { userId: user.id } });
    return admin?.fullName?.trim() || 'bạn';
  }

  return 'bạn';
}

// Đang nhập
async function loginUser(email, password) {
  const user = await User.findOne({ where: { email } });
  
  if (!user) {
    throw { status: 401, message: 'Sai email hoặc mật khẩu' };
  }

  if (!bcrypt.compareSync(password, user.password)) {
    throw { status: 401, message: 'Sai email hoặc mật khẩu' };
  }

  let fullName = user.email.split('@')[0];
  let avatarUrl = null;
  
  // Nếu là sinh viên, lấy tên thật từ bảng students
  if (user.role === 'student') {
    const student = await Student.findOne({ where: { userId: user.id } });
    if (student) {
      fullName = student.fullName;
      avatarUrl = student.avatarUrl;
    }
  }

  if (user.role === 'admin') {
    const admin = await Admin.findOne({ where: { userId: user.id } });
    if (admin) {
      fullName = admin.fullName || fullName;
      avatarUrl = admin.avatarUrl;
    }
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, fullName, email: user.email },
    JWT_SECRET,
    { expiresIn: '1d' }
  );

  return {
    id: user.id,
    fullName,
    email: user.email,
    role: user.role,
    avatarUrl,
    token
  };
}

// Đăng ký
async function registerStudent(payload) {
  const { email, password, fullName, studentCode, className, phone } = payload;

  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) throw { status: 400, message: 'Email này đã được sử dụng!' };

  const existingStudent = await Student.findOne({ where: { studentCode } });
  if (existingStudent) throw { status: 400, message: 'Mã sinh viên này đã được đăng ký!' };

  const transaction = await sequelize.transaction();

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Tạo User
    const newUser = await User.create({
      email: email,
      password: hashedPassword,
      role: 'student',
      isActive: true
    }, { transaction });

    // Tạo Student Profile
    const newStudent = await Student.create({
      userId: newUser.id,
      fullName: fullName,
      studentCode: studentCode,
      className: className || null,
      phone: phone || null,
      trustScore: 100,
      trustRank: 'diamond'
    }, { transaction });

    await transaction.commit();

    return {
      userId: newUser.id,
      email: newUser.email,
      studentProfile: newStudent
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

// Quên mật khẩu
async function forgotPassword(email) {
  const user = await User.findOne({ where: { email, isActive: true } });
  
  if (!user) {
    return { message: FORGOT_PASSWORD_SAFE_MESSAGE };
  }

  // Tạo một token đặc biệt, chỉ có thời hạn 15 phút
  const resetToken = jwt.sign(
    { id: user.id, purpose: 'reset_password' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Tạo đường link dẫn tới màn hình Frontend
  const frontendUrl = getFrontendUrl();
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  const displayName = await getUserDisplayName(user);

  // Gửi email
  const isSent = await emailService.sendDynamicEmail(
    'forgot_password', 
    user.email, 
    {
      reset_link: resetLink,
      resetLink,
      name: displayName,
      fullName: displayName,
      appName: 'Hệ thống Quản lý Thiết bị',
      year: new Date().getFullYear()
    },
    user.id
  );

  if (!isSent) {
    console.error(`[FORGOT PASSWORD] Không thể gửi email đặt lại mật khẩu tới ${email}`);
    throw { status: 500, message: 'Không thể gửi email lúc này. Vui lòng thử lại sau.' };
  }

  return { message: FORGOT_PASSWORD_SAFE_MESSAGE };
}

// Hàm Xác nhận đổi mật khẩu mới
async function resetPassword(token, newPassword) {
  try {
    // Xác thực xem token còn hạn 15 phút hay không, có bị làm giả không
    const decoded = jwt.verify(token, JWT_SECRET);
    
    if (decoded.purpose !== 'reset_password') {
      throw new Error('Token không hợp lệ');
    }

    const user = await User.findByPk(decoded.id);
    if (!user) throw new Error('Không tìm thấy tài khoản');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({ password: hashedPassword });

    return { message: 'Đổi mật khẩu thành công! Bạn có thể đăng nhập ngay bây giờ.' };
  } catch (error) {
    throw { status: 400, message: 'Đường dẫn đặt lại mật khẩu không hợp lệ hoặc đã hết hạn (Quá 15 phút).' };
  }
}

module.exports = { loginUser, registerStudent, forgotPassword, resetPassword };
