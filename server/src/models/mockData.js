const users = [
  {
    id: 'u1',
    fullName: 'Nguyen Van A',
    email: 'student@example.com',
    role: 'student',
    // bcrypt hash of 'studentpass' (for demo)
    password: '$2a$08$QmvtilfTe6mI6ueDCCOcDu1SoggWtmtO7pRGailPWImhviQQd3Rqa'
  },
  {
    id: 'admin1',
    fullName: 'Quan tri vien',
    email: 'admin@example.com',
    role: 'admin',
    // bcrypt hash of 'adminpass' (for demo)
    password: '$2a$08$LtA0jIzPIeaPBggo3HM48.r1NEa2ojcl1fOle0jq1GQoFEsXDX3U2'
  }
];

const devices = [
  {
    id: 'd1',
    name: 'May chieu',
    category: 'Thiet bi trinh chieu',
    totalQuantity: 5,
    availableQuantity: 3,
    status: 'available',
    description: 'Dung cho phong hoc va su kien cau lac bo'
  },
  {
    id: 'd2',
    name: 'Micro khong day',
    category: 'Am thanh',
    totalQuantity: 10,
    availableQuantity: 6,
    status: 'available'
  },
  {
    id: 'd3',
    name: 'Loa keo',
    category: 'Am thanh',
    totalQuantity: 2,
    availableQuantity: 1,
    status: 'available'
  }
];

const borrowRequests = [
  {
    id: 'br1',
    studentId: 'u1',
    studentName: 'Nguyen Van A',
    deviceId: 'd1',
    deviceName: 'May chieu',
    quantity: 1,
    borrowDate: '2026-05-12',
    returnDate: '2026-05-15',
    status: 'pending',
    note: 'Muon cho su kien CLB'
  },
  {
    id: 'br2',
    studentId: 'u1',
    studentName: 'Nguyen Van A',
    deviceId: 'd2',
    deviceName: 'Micro khong day',
    quantity: 2,
    borrowDate: '2026-05-01',
    returnDate: '2026-05-03',
    status: 'returned'
  }
];

module.exports = {
  users,
  devices,
  borrowRequests
};
