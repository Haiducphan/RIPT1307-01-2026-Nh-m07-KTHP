const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Kiểm tra thư mục lưu trữ
const uploadDir = path.join(__dirname, '../../public/uploads/equipment');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ (Storage)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'eqp-' + uniqueSuffix + ext);
  }
});

// Bộ lọc file
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file định dạng hình ảnh!'), false);
  }
};

// Khởi tạo middleware
const uploadEquipmentImages = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});


module.exports = uploadEquipmentImages;