const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/user.model');
const Student = require('../models/student.model');
const sequelize = require('../config/database');
const emailService = require('./email.service');

const JWT_SECRET = process.env.JWT_SECRET || 'borrow-equipment-secret';

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
  
  // Nếu là sinh viên, lấy tên thật từ bảng students
  if (user.role === 'student') {
    const student = await Student.findOne({ where: { userId: user.id } });
    if (student) fullName = student.fullName;
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
    throw { status: 404, message: 'Email không tồn tại trong hệ thống hoặc đã bị khóa!' };
  }

  // Tạo một token đặc biệt, chỉ có thời hạn 15 phút
  const resetToken = jwt.sign(
    { id: user.id, purpose: 'reset_password' },
    JWT_SECRET,
    { expiresIn: '15m' }
  );

  // Tạo đường link dẫn tới màn hình Frontend
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  // Gửi email
  const isSent = await emailService.sendDynamicEmail(
    'forgot_password', 
    user.email, 
    { reset_link: resetLink },
    user.id
  );

  if (!isSent) {
    throw { status: 500, message: 'Không thể gửi email lúc này. Vui lòng thử lại sau.' };
  }

  return { message: 'Đã gửi đường dẫn đặt lại mật khẩu qua email của bạn.' };
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