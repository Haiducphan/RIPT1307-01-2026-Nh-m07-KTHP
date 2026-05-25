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

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:8000' }));
app.use(express.json());

app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

syncDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
      startCronJobs();    // test cronjob
    });
  })
  .catch((error) => {
    console.error('Database sync failed:', error.message);
    process.exit(1);
  });
