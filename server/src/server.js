const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const express = require('express');

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const routes = require('./routes');

const app = express();
const port = Number(process.env.PORT || 4000);

const clientUrl = process.env.CLIENT_URL || 'http://localhost:8000';
app.use(
  cors({
    origin: [clientUrl, 'http://localhost:8001', 'http://127.0.0.1:8001']
  })
);
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
