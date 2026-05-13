# He thong Quan ly Muon Do Dung

Du an web cho phep sinh vien/cau lac bo dang ky muon thiet bi, quan tri vien duyet yeu cau, ghi nhan muon tra, theo doi ton kho, lich su va thong ke.

## Cong nghe de xuat

- Frontend: UmiJS + ReactJS + TypeScript + Ant Design
- Backend: Node.js + Express + JavaScript
- Database de xuat: MySQL + Sequelize
- Routing: UmiJS routes
- State management: Zustand
- API: frontend goi backend Node.js/Express qua `/api`, backend dang co mock data de demo truoc khi noi database that
- Deploy frontend: Netlify

## Huong dan setup va chay

### 1. Clone va cai dat dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd DA\ WEB

# Cai dat server
cd server
npm install

# Cai dat client (terminal moi)
cd client
npm install
```

### 2. Setup environment variables

```bash
# Server
cd server
cp .env.example .env
# Cap nhat .env voi thong tin database va email

# Client
cd client
cp .env.example .env
# Neu can thay doi API_BASE_URL
```

### 3. Chay ung dung

```bash
# Terminal 1 - Server (port 4000)
cd server
npm run dev

# Terminal 2 - Client (port 8000 hoac 8001)
cd client
npm run dev
```

### 4. Truy cap

- **Frontend**: http://localhost:8000 (hoac 8001)
- **Backend API**: http://localhost:4000/api

## Cau truc thu muc

```txt
.
├── client/                 # Ung dung frontend UmiJS
│   ├── config/             # Cau hinh UmiJS va routes
│   │   ├── config.ts
│   │   └── routes.ts
│   └── src/
│       ├── app.tsx         # Entry setup cua UmiJS
│       ├── assets/         # Anh, icon, logo
│       ├── components/     # Component dung lai
│       ├── constants/      # Hang so trang thai, route path
│       ├── hooks/          # Custom hooks
│       ├── layouts/        # Layout chung/admin/student
│       ├── pages/          # Man hinh theo route
│       ├── services/       # Goi API
│       ├── stores/         # State management bang Zustand
│       ├── types/          # TypeScript types
│       ├── utils/          # Ham tien ich
│       └── wrappers/       # Route guard theo role
├── server/                 # Backend Node.js/Express
│   └── src/
│       ├── config/
│       ├── controllers/
│       ├── middleware/
│       ├── models/
│       ├── routes/
│       ├── services/
│       ├── utils/
│       └── server.js
└── docs/                   # Tai lieu nhom va bao cao
```

Tai lieu de gui cho nhom: `docs/BASE_STRUCTURE_FOR_TEAM.md`.

## Chay backend

Backend chay cong `4000`, UmiJS se proxy `/api` sang backend.

```bash
cd server
npm install
npm run dev
```

## Chay frontend

```bash
cd client
npm install
npm run dev
```

Frontend UmiJS mac dinh chay o `http://localhost:8000`.

## Quy uoc lam viec Git

- Moi thanh vien tao nhanh rieng: `feature/ten-chuc-nang-ten-ban`
- Moi nhanh phai co commit rieng de dua vao bang phan cong bao cao
- Code on dinh thi tao pull request hoac merge ve `main`
- Khong sua truc tiep vao phan cua thanh vien khac neu chua thong nhat

## Phan chia module goi y

- Auth: dang nhap, phan quyen sinh vien/admin
- Student: xem thiet bi, gui yeu cau muon, xem lich su muon
- Admin Request: xem/duyet/tu choi yeu cau
- Inventory: them/sua/xoa thiet bi, cap nhat so luong
- Return: ghi nhan tra thiet bi, cap nhat ton kho
- Statistics: thong ke thiet bi duoc muon nhieu trong thang
- Notification: canh bao qua han tren he thong, mock email
