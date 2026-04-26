const express = require('express');
const router = express.Router();
const { hashPassword, comparePassword, generateToken } = require('../utils/auth');
const { authenticate } = require('../middleware/auth');

router.post('/register', async (req, res) => {
  const { email, password, role, firstName, lastName, specialization, licenseNumber } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ error: 'Email, password, and role are required' });
  }

  try {
    const passwordHash = await hashPassword(password);

    const userResult = await global.db.query(
      'INSERT INTO users (email, password_hash, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, role',
      [email, passwordHash, role, firstName, lastName]
    );

    const userId = userResult.rows[0].id;
    let patientId = null;

    if (role === 'patient') {
      const patientResult = await global.db.query(
        'INSERT INTO patients (user_id) VALUES ($1) RETURNING id',
        [userId]
      );
      patientId = patientResult.rows[0].id;
    } else if (role === 'provider') {
      if (!licenseNumber) {
        return res.status(400).json({ error: 'License number required for providers' });
      }
      await global.db.query(
        'INSERT INTO providers (user_id, license_number, specialization) VALUES ($1, $2, $3)',
        [userId, licenseNumber, specialization]
      );
    }

    const token = generateToken(userId, role);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: userResult.rows[0].id,
        email: userResult.rows[0].email,
        role: userResult.rows[0].role,
        patientId: patientId
      },
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await global.db.query(
      'SELECT u.id, u.email, u.password_hash, u.role, p.id as patient_id FROM users u LEFT JOIN patients p ON u.id = p.user_id WHERE u.email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const isPasswordValid = await comparePassword(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user.id, user.role);
    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        patientId: user.patient_id
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/profile', authenticate, async (req, res) => {
  try {
    const result = await global.db.query(
      'SELECT id, email, role, first_name, last_name FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
