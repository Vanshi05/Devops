require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'medical_dashboard',
});

global.db = pool;

app.get('/health', (req, res) => {
  res.json({ status: 'Server is running' });
});

app.use('/auth', require('./routes/authRoutes'));
app.use('/patients', require('./routes/patientRoutes'));
app.use('/prescriptions', require('./routes/prescriptionRoutes'));
app.use('/appointments', require('./routes/appointmentRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
