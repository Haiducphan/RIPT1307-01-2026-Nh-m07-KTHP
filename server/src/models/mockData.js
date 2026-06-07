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

const borrowRequests = [
  {
    id: 'br1',
    studentId: 'u1',
    studentName: 'Nguyen Van A',
    deviceId: '1',
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
    deviceId: '2',
    deviceName: 'Micro khong day',
    quantity: 2,
    borrowDate: '2026-05-01',
    returnDate: '2026-05-03',
    status: 'returned'
  }
];

module.exports = {
  users,
  borrowRequests
};
