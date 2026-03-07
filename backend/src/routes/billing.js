const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { billingRouter } = require('./_combined');
const router = billingRouter;

// GET /api/billing/subscription/:academyId
router.get('/subscription/:academyId', async (req, res) => {
  try {
    const result = await query(
      `SELECT a.plan, a.max_students, a.is_active, a.trial_ends_at,
        sp.name as plan_name, sp.price_monthly, sp.features
       FROM academies a
       LEFT JOIN subscription_plans sp ON sp.name = a.plan
       WHERE a.id=$1`,
      [req.params.academyId]
    );
    res.json({ subscription: result.rows[0] || null });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/billing/my-invoices  (parent)
router.get('/my-invoices', async (req, res) => {
  try {
    const result = await query(
      `SELECT i.* FROM invoices i
       JOIN parent_student ps ON ps.student_id IN (
         SELECT student_id FROM parent_student WHERE parent_id=$1
       )
       JOIN users u ON u.id=ps.student_id
       WHERE i.academy_id=u.academy_id
       ORDER BY i.created_at DESC LIMIT 20`,
      [req.user.id]
    );
    res.json({ invoices: result.rows });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/billing/change-plan
router.post('/change-plan', async (req, res) => {
  try {
    if (!['super_admin','academy_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { academyId, planName } = req.body;
    const plan = await query('SELECT * FROM subscription_plans WHERE name=$1', [planName]);
    if (!plan.rows.length) return res.status(404).json({ message: 'Plan not found' });
    await query(
      'UPDATE academies SET plan=$1, max_students=$2, updated_at=NOW() WHERE id=$3',
      [planName, plan.rows[0].max_students, academyId]
    );
    res.json({ message: 'Plan updated' });
  } catch { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;
