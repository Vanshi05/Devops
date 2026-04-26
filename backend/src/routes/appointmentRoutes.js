const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, async (req, res) => {
  const { patientId, providerId, scheduledDate, reason } = req.body;

  if (!patientId || !scheduledDate) {
    return res.status(400).json({ error: 'patientId and scheduledDate are required' });
  }

  try {
    if (req.user.role === 'patient') {
      const patientResult = await global.db.query(
        'SELECT user_id FROM patients WHERE id = $1',
        [patientId]
      );

      if (patientResult.rows.length === 0 || patientResult.rows[0].user_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const result = await global.db.query(
      `INSERT INTO appointments (patient_id, provider_id, scheduled_date, reason)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [patientId, providerId, scheduledDate, reason]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  const { patientId, providerId, limit = 10, offset = 0 } = req.query;

  try {
    let query = 'SELECT ap.*, pat.date_of_birth, u.first_name, u.last_name FROM appointments ap LEFT JOIN patients pat ON ap.patient_id = pat.id LEFT JOIN users u ON u.id IN (SELECT user_id FROM patients WHERE id = pat.id) WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (patientId) {
      if (req.user.role === 'patient') {
        const patientResult = await global.db.query(
          'SELECT user_id FROM patients WHERE id = $1',
          [patientId]
        );
        if (patientResult.rows.length === 0 || patientResult.rows[0].user_id !== req.user.userId) {
          return res.status(403).json({ error: 'Not authorized' });
        }
      }
      paramCount++;
      params.push(patientId);
      query += ` AND ap.patient_id = $${paramCount}`;
    } else if (req.user.role === 'patient') {
      const patientResult = await global.db.query(
        'SELECT id FROM patients WHERE user_id = $1',
        [req.user.userId]
      );
      if (patientResult.rows.length > 0) {
        paramCount++;
        params.push(patientResult.rows[0].id);
        query += ` AND ap.patient_id = $${paramCount}`;
      }
    }

    if (providerId && req.user.role !== 'patient') {
      paramCount++;
      params.push(providerId);
      query += ` AND ap.provider_id = $${paramCount}`;
    }

    query += ` ORDER BY ap.scheduled_date DESC LIMIT ${limit} OFFSET ${offset}`;

    const result = await global.db.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:appointmentId', authenticate, async (req, res) => {
  const { appointmentId } = req.params;
  const { scheduledDate, reason, status, notes } = req.body;

  try {
    const appointmentResult = await global.db.query(
      'SELECT patient_id FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.user.role === 'patient') {
      const patientResult = await global.db.query(
        'SELECT user_id FROM patients WHERE id = $1',
        [appointmentResult.rows[0].patient_id]
      );

      if (patientResult.rows[0].user_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    const result = await global.db.query(
      `UPDATE appointments
       SET scheduled_date = COALESCE($1, scheduled_date),
           reason = COALESCE($2, reason),
           status = COALESCE($3, status),
           notes = COALESCE($4, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [scheduledDate, reason, status, notes, appointmentId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:appointmentId', authenticate, async (req, res) => {
  const { appointmentId } = req.params;

  try {
    const appointmentResult = await global.db.query(
      'SELECT patient_id FROM appointments WHERE id = $1',
      [appointmentId]
    );

    if (appointmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.user.role === 'patient') {
      const patientResult = await global.db.query(
        'SELECT user_id FROM patients WHERE id = $1',
        [appointmentResult.rows[0].patient_id]
      );

      if (patientResult.rows[0].user_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    await global.db.query('DELETE FROM appointments WHERE id = $1', [appointmentId]);
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
