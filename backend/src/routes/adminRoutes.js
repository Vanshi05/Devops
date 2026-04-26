const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/patients', authenticate, authorize('admin', 'provider'), async (req, res) => {
  const { limit = 20, offset = 0, search } = req.query;

  try {
    let query = `SELECT u.id, u.email, u.first_name, u.last_name, p.id as patient_id, p.date_of_birth, p.blood_type
                 FROM users u
                 JOIN patients p ON u.id = p.user_id
                 WHERE 1=1`;
    const params = [];

    if (search) {
      query += ` AND (u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1)`;
      params.push(`%${search}%`);
    }

    query += ` LIMIT ${limit} OFFSET ${offset}`;

    const result = await global.db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/statistics', authenticate, authorize('admin'), async (req, res) => {
  try {
    const stats = await global.db.query(
      `SELECT
        (SELECT COUNT(*) FROM users WHERE role = 'patient') as total_patients,
        (SELECT COUNT(*) FROM users WHERE role = 'provider') as total_providers,
        (SELECT COUNT(*) FROM medical_records) as total_records,
        (SELECT COUNT(*) FROM prescriptions) as total_prescriptions,
        (SELECT COUNT(*) FROM appointments) as total_appointments,
        (SELECT COUNT(*) FROM appointments WHERE status = 'scheduled') as upcoming_appointments,
        (SELECT COUNT(*) FROM prescriptions WHERE status = 'active') as active_prescriptions`
    );

    res.json(stats.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/reports', authenticate, authorize('admin'), async (req, res) => {
  const { startDate, endDate } = req.query;

  try {
    let query = `SELECT
                  DATE_TRUNC('day', mr.date) as report_date,
                  COUNT(DISTINCT mr.id) as records_added,
                  COUNT(DISTINCT pr.id) as prescriptions_issued,
                  COUNT(DISTINCT ap.id) as appointments_scheduled
                 FROM medical_records mr
                 FULL OUTER JOIN prescriptions pr ON DATE_TRUNC('day', pr.created_at) = DATE_TRUNC('day', mr.date)
                 FULL OUTER JOIN appointments ap ON DATE_TRUNC('day', ap.created_at) = DATE_TRUNC('day', mr.date)
                 WHERE 1=1`;
    const params = [];

    if (startDate) {
      params.push(startDate);
      query += ` AND mr.date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND mr.date <= $${params.length}`;
    }

    query += ` GROUP BY report_date ORDER BY report_date DESC`;

    const result = await global.db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/users', authenticate, authorize('admin'), async (req, res) => {
  const { email, password, role, firstName, lastName, licenseNumber, specialization } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  try {
    const { hashPassword, generateToken } = require('../utils/auth');

    const passwordHash = await hashPassword(password);

    const userResult = await global.db.query(
      'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role',
      [email, passwordHash, role, firstName, lastName]
    );

    const userId = userResult.rows[0].id;

    if (role === 'provider' && licenseNumber) {
      await global.db.query(
        'INSERT INTO providers (user_id, license_number, specialization) VALUES ($1, $2, $3)',
        [userId, licenseNumber, specialization]
      );
    }

    res.status(201).json({
      message: 'User created successfully',
      user: userResult.rows[0],
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
