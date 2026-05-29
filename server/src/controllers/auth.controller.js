const authService = require('../services/auth.service');

// Đăng nhập
async function login(req, res) {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu' });
  }

  try {
    const data = await authService.loginUser(email, password);
    res.json(data);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Lỗi đăng nhập:', error.message);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng nhập' });
  }
}

// Đăng ký
async function register(req, res) {
  try {
    const { email, password, fullName, studentCode } = req.body;

    if (!email || !password || !fullName || !studentCode) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ email, mật khẩu, họ tên và mã SV' });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const result = await authService.registerStudent(req.body);
    res.status(201).json({ message: 'Đăng ký thành công', data: result });
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Lỗi đăng ký:', error.message);
    res.status(500).json({ message: 'Lỗi hệ thống khi đăng ký' });
  }
}

// Quên mật khẩu
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Vui lòng cung cấp email của bạn' });

    const result = await authService.forgotPassword(email);
    res.json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Lỗi forgotPassword:', error.message);
    res.status(500).json({ message: 'Lỗi hệ thống khi yêu cầu quên mật khẩu' });
  }
}

// Tạo mật khẩu mới
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Thiếu thông tin token hoặc mật khẩu mới' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
    }

    const result = await authService.resetPassword(token, newPassword);
    res.json(result);
  } catch (error) {
    if (error.status) return res.status(error.status).json({ message: error.message });
    console.error('Lỗi resetPassword:', error.message);
    res.status(500).json({ message: 'Lỗi hệ thống khi đặt lại mật khẩu' });
  }
}

function me(req, res) {
  if (!req.user) return res.status(401).json({ message: 'Chưa xác thực' });
  res.json(req.user);
}


module.exports = { login, register, forgotPassword, resetPassword, me, };