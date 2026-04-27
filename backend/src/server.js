require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const initializeDatabase = require('./config/dbInit');

const app = express();
const PORT = process.env.PORT || 5000;
let requestCount = 0;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  requestCount += 1;
  next();
});

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'medical_dashboard',
});

global.db = pool;

// Initialize database schema on startup
initializeDatabase(pool)
  .then(() => {
    console.log('✅ Database ready, starting server...');

    app.get('/', (req, res) => {
      res.json({
        service: 'medical-dashboard-api',
        status: 'ok',
        uptimeSeconds: Math.round(process.uptime()),
        endpoints: ['/health', '/metrics', '/auth', '/patients', '/prescriptions', '/appointments', '/admin'],
      });
    });

    app.get('/health', (req, res) => {
      res.json({ status: 'Server is running' });
    });

    app.get('/metrics', (req, res) => {
      res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');

      res.send([
        '# HELP medical_dashboard_requests_total Total HTTP requests handled by the API',
        '# TYPE medical_dashboard_requests_total counter',
        `medical_dashboard_requests_total ${requestCount}`,
        '# HELP medical_dashboard_uptime_seconds Process uptime in seconds',
        '# TYPE medical_dashboard_uptime_seconds gauge',
        `medical_dashboard_uptime_seconds ${process.uptime().toFixed(3)}`,
        '# HELP medical_dashboard_memory_rss_bytes Resident set size in bytes',
        '# TYPE medical_dashboard_memory_rss_bytes gauge',
        `medical_dashboard_memory_rss_bytes ${process.memoryUsage().rss}`,
        '# HELP medical_dashboard_db_ready Database initialization completed successfully',
        '# TYPE medical_dashboard_db_ready gauge',
        'medical_dashboard_db_ready 1',
        '',
      ].join('\n'));
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
  })
  .catch((err) => {
    console.error('❌ Failed to initialize database:', err);
    process.exit(1);
  });

module.exports = app;
