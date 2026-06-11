const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');
const { startCronJobs } = require('./services/cron.service');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const routes = require('./routes');
const { syncDatabase } = require('./config/syncDatabase');

const app = express();
const port = Number(process.env.PORT || 4000);
const LOCAL_ALLOWED_ORIGINS = [
  'http://localhost:8000',
  'http://localhost:8001',
  'http://127.0.0.1:8000',
  'http://127.0.0.1:8001',
  'http://localhost:4000',
  'http://127.0.0.1:4000'
];

function normalizeOrigin(origin) {
  if (!origin) return '';

  try {
    return new URL(origin).origin;
  } catch {
    return String(origin).replace(/\/$/, '');
  }
}

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CLIENT_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .map(normalizeOrigin);

  return new Set([
    ...LOCAL_ALLOWED_ORIGINS,
    ...configuredOrigins
  ]);
}

const allowedOrigins = getAllowedOrigins();

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.has(normalizeOrigin(origin))) {
      callback(null, true);
      return;
    }

    const error = new Error(`CORS blocked origin: ${origin}`);
    error.name = 'CorsNotAllowedError';
    callback(error);
  },
  credentials: true
}));

app.use((error, _req, res, next) => {
  if (error?.name === 'CorsNotAllowedError') {
    res.status(403).json({ message: error.message });
    return;
  }

  next(error);
});

app.use(express.json());

// Cấp quyền truy cập công khai cho thư mục uploads
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

syncDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      // startCronJobs();    // test cronjob
    });
  })
  .catch((error) => {
    console.error('Database sync failed:', error.message);
    process.exit(1);
  });
