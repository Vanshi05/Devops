const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');

router.post('/:patientId/prescriptions', authenticate, authorize('provider', 'admin'), async (req, res) => {
  const { patientId } = req.params;
  const { medication, dosage, frequency, startDate, endDate, instructions } = req.body;

  if (!medication || !startDate) {
    return res.status(400).json({ error: 'Medication and startDate are required' });
  }

  try {
    const providerResult = await global.db.query(
      'SELECT id FROM providers WHERE user_id = $1',
      [req.user.userId]
    );

    const providerId = providerResult.rows.length > 0 ? providerResult.rows[0].id : null;

    const result = await global.db.query(
      `INSERT INTO prescriptions (patient_id, provider_id, medication, dosage, frequency, start_date, end_date, instructions)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [patientId, providerId, medication, dosage, frequency, startDate, endDate, instructions]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:patientId/prescriptions', authenticate, async (req, res) => {
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
      `SELECT pr.*, u.first_name, u.last_name
       FROM prescriptions pr
       LEFT JOIN providers p ON pr.provider_id = p.id
       LEFT JOIN users u ON p.user_id = u.id
       WHERE pr.patient_id = $1
       ORDER BY pr.start_date DESC
       LIMIT $2 OFFSET $3`,
      [patientId, limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:prescriptionId', authenticate, async (req, res) => {
  const { prescriptionId } = req.params;

  try {
    const result = await global.db.query(
      `SELECT pr.*, u.first_name, u.last_name, p.id as patient_id
       FROM prescriptions pr
       LEFT JOIN providers prov ON pr.provider_id = prov.id
       LEFT JOIN users u ON prov.user_id = u.id
       LEFT JOIN patients p ON pr.patient_id = p.id
       WHERE pr.id = $1`,
      [prescriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    const prescription = result.rows[0];

    if (req.user.role === 'patient') {
      const patientResult = await global.db.query(
        'SELECT user_id FROM patients WHERE id = $1',
        [prescription.patient_id]
      );
      if (patientResult.rows[0].user_id !== req.user.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
    }

    res.json(prescription);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:prescriptionId/status', authenticate, authorize('provider', 'admin'), async (req, res) => {
  const { prescriptionId } = req.params;
  const { status } = req.body;

  const validStatuses = ['active', 'filled', 'expired', 'cancelled'];
  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    const result = await global.db.query(
      `UPDATE prescriptions
       SET status = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, prescriptionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
