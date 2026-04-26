const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.get('/:patientId/records', authenticate, async (req, res) => {
  const { patientId } = req.params;
  const { limit = 10, offset = 0 } = req.query;

  try {
    const authResult = await global.db.query(
      'SELECT user_id FROM patients WHERE id = $1',
      [patientId]
    );

    if (authResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (req.user.role === 'patient' && authResult.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await global.db.query(
      `SELECT mr.*, u.first_name, u.last_name
       FROM medical_records mr
       LEFT JOIN providers p ON mr.provider_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE mr.patient_id = $1
       ORDER BY mr.date DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:patientId/records', authenticate, authorize('provider', 'admin'), async (req, res) => {
  const { patientId } = req.params;
  const { recordType, description, diagnosis, date, fileUrl } = req.body;

  if (!recordType || !description || !date) {
    return res.status(400).json({ error: 'recordType, description, and date are required' });
  }

  try {
    const providerResult = await global.db.query(
      'SELECT id FROM providers WHERE user_id = $1',
      [req.user.userId]
    );

    const providerId = providerResult.rows.length > 0 ? providerResult.rows[0].id : null;

    const result = await global.db.query(
      `INSERT INTO medical_records (patient_id, provider_id, record_type, description, diagnosis, date, file_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patientId, providerId, recordType, description, diagnosis, date, fileUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:patientId/records/:recordId', authenticate, async (req, res) => {
  const { patientId, recordId } = req.params;

  try {
    const authResult = await global.db.query(
      'SELECT user_id FROM patients WHERE id = $1',
      [patientId]
    );

    if (authResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (req.user.role === 'patient' && authResult.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await global.db.query(
      `SELECT mr.*, u.first_name, u.last_name
       FROM medical_records mr
       LEFT JOIN providers p ON mr.provider_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE mr.id = $1 AND mr.patient_id = $2`,
      [recordId, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:patientId/records/:recordId', authenticate, authorize('provider', 'admin'), async (req, res) => {
  const { patientId, recordId } = req.params;
  const { recordType, description, diagnosis, date } = req.body;

  try {
    const result = await global.db.query(
      `UPDATE medical_records
       SET record_type = COALESCE($1, record_type),
           description = COALESCE($2, description),
           diagnosis = COALESCE($3, diagnosis),
           date = COALESCE($4, date),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND patient_id = $6
       RETURNING *`,
      [recordType, description, diagnosis, date, recordId, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:patientId/records/:recordId', authenticate, authorize('provider', 'admin'), async (req, res) => {
  const { patientId, recordId } = req.params;

  try {
    const result = await global.db.query(
      'DELETE FROM medical_records WHERE id = $1 AND patient_id = $2 RETURNING id',
      [recordId, patientId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    res.json({ message: 'Record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:patientId/medical-history', authenticate, async (req, res) => {
  const { patientId } = req.params;

  try {
    const authResult = await global.db.query(
      'SELECT user_id FROM patients WHERE id = $1',
      [patientId]
    );

    if (authResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (req.user.role === 'patient' && authResult.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await global.db.query(
      `SELECT
        COUNT(DISTINCT mr.id) as total_records,
        COUNT(DISTINCT CASE WHEN mr.record_type = 'diagnosis' THEN mr.id END) as diagnoses,
        COUNT(DISTINCT pr.id) as total_prescriptions,
        COUNT(DISTINCT ap.id) as total_appointments
       FROM patients p
       LEFT JOIN medical_records mr ON p.id = mr.patient_id
       LEFT JOIN prescriptions pr ON p.id = pr.patient_id
       LEFT JOIN appointments ap ON p.id = ap.patient_id
       WHERE p.id = $1`,
      [patientId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
