const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const BillingService = require('../services/BillingService');
const crypto = require('crypto');
const config = require('../config');
const { logActivity } = require('./activityLogs');

const router = express.Router();

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
  } catch (e) { console.error("[billing]", e.message); res.status(500).json({ message: 'Failed', _route: 'billing' }); }
});

// GET /api/billing/my-invoices  (parent)
router.get('/my-invoices', authenticate, async (req, res) => {
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
  } catch (e) { console.error("[billing]", e.message); res.status(500).json({ message: 'Failed', _route: 'billing' }); }
});

// POST /api/billing/change-plan
// POST /api/billing/upgrade (Alias for change-plan)
router.post(['/upgrade', '/change-plan'], authenticate, async (req, res) => {
  try {
    if (!['super_admin', 'academy_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
    const { academyId } = req.body;
    const planName = req.body.planName || req.body.plan;
    if (!planName) return res.status(400).json({ message: 'Plan name is required' });
    
    const plan = await query('SELECT * FROM subscription_plans WHERE name=$1', [planName]);
    if (!plan.rows.length) return res.status(404).json({ message: 'Plan not found' });
    await query(
      'UPDATE academies SET plan=$1, max_students=$2, updated_at=NOW() WHERE id=$3',
      [planName, plan.rows[0].max_students, academyId]
    );
    res.json({ message: 'Plan updated' });
    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId, action: 'plan_changed', entityType: 'academy', entityId: academyId, metadata: { planName }, ip: req.ip });
  } catch (e) { console.error("[billing]", e.message); res.status(500).json({ message: 'Failed', _route: 'billing' }); }
});

// ─── Subscription Plan CRUD (Super Admin only) ───────────────────────────────

// GET /api/billing/plans (Public-ish)
router.get('/plans', async (req, res) => {
  try {
    const result = await query('SELECT * FROM subscription_plans WHERE is_active=true ORDER BY price_monthly ASC NULLS LAST');
    res.json({ plans: result.rows });
  } catch (e) {
    console.error('[billing plans]', e.message);
    res.status(500).json({ message: 'Failed to fetch plans' });
  }
});

router.get('/plans/all', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM subscription_plans ORDER BY price_monthly ASC NULLS LAST');
    res.json({ plans: result.rows });
  } catch (e) { console.error('[billing]', e.message); res.status(500).json({ message: 'Failed' }); }
});

router.post('/plans', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name, slug, price_monthly, price_yearly, max_students, max_coaches, features } = req.body;
    if (!name || !slug) return res.status(400).json({ message: 'Name and slug are required' });
    const existing = await query('SELECT id FROM subscription_plans WHERE slug=$1', [slug]);
    if (existing.rows.length) return res.status(409).json({ message: 'Slug already exists' });
    const id = uuidv4();
    await query(
      `INSERT INTO subscription_plans (id, name, slug, price_monthly, price_yearly, max_students, max_coaches, features, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())`,
      [id, name, slug, price_monthly || null, price_yearly || null, max_students || 50, max_coaches || 5, JSON.stringify(features || [])]
    );
    res.status(201).json({ message: 'Plan created', id });
  } catch (e) { console.error('[billing]', e.message); res.status(500).json({ message: 'Failed' }); }
});

router.put('/plans/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    const { name, price_monthly, price_yearly, max_students, max_coaches, features, is_active } = req.body;
    const fields = []; const vals = [];
    if (name !== undefined) { vals.push(name); fields.push(`name=$${vals.length}`); }
    if (price_monthly !== undefined) { vals.push(price_monthly); fields.push(`price_monthly=$${vals.length}`); }
    if (price_yearly !== undefined) { vals.push(price_yearly); fields.push(`price_yearly=$${vals.length}`); }
    if (max_students !== undefined) { vals.push(max_students); fields.push(`max_students=$${vals.length}`); }
    if (max_coaches !== undefined) { vals.push(max_coaches); fields.push(`max_coaches=$${vals.length}`); }
    if (features !== undefined) { vals.push(JSON.stringify(features)); fields.push(`features=$${vals.length}`); }
    if (is_active !== undefined) { vals.push(is_active); fields.push(`is_active=$${vals.length}`); }
    if (!fields.length) return res.json({ message: 'Nothing to update' });
    vals.push(req.params.id);
    await query(`UPDATE subscription_plans SET ${fields.join(',')} WHERE id=$${vals.length}`, vals);
    res.json({ message: 'Plan updated' });
  } catch (e) { console.error('[billing]', e.message); res.status(500).json({ message: 'Failed' }); }
});

router.delete('/plans/:id', authenticate, authorize('super_admin'), async (req, res) => {
  try {
    await query('UPDATE subscription_plans SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Plan deactivated' });
  } catch (e) { console.error('[billing]', e.message); res.status(500).json({ message: 'Failed' }); }
});

// ─── RAZORPAY INTEGRATION ───────────────────────────────

router.post('/razorpay/create-order', authenticate, authorize('academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { planName, academyId } = req.body;
    const { order, plan } = await BillingService.createSubscriptionOrder(academyId, planName);

    await query(
      `INSERT INTO invoices (id, academy_id, amount, status, description, razorpay_order_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'pending', $3, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [academyId, plan.price_monthly, `${plan.name} Plan - Monthly`, order.id]
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      planName: plan.name,
      planPrice: plan.price_monthly,
    });
  } catch (e) {
    console.error('[Razorpay create-order]', e.message);
    res.status(500).json({ message: e.message || 'Failed to create payment order' });
  }
});

router.post('/razorpay/verify', authenticate, authorize('academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, academyId, planName } = req.body;

    if (!BillingService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
    }

    const plan = await query('SELECT * FROM subscription_plans WHERE name=$1', [planName]);
    if (!plan.rows.length) return res.status(404).json({ message: 'Plan not found' });
    const p = plan.rows[0];

    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 1);

    await query(
      `UPDATE academies
       SET plan=$1, max_students=$2, is_active=true, trial_ends_at=$3, updated_at=NOW()
       WHERE id=$4`,
      [planName, p.max_students, trialEndsAt.toISOString(), academyId]
    );

    await query(
      `UPDATE invoices
       SET status='paid', razorpay_payment_id=$1, paid_at=NOW()
       WHERE razorpay_order_id=$2`,
      [razorpay_payment_id, razorpay_order_id]
    );

    logActivity({ actorId: req.user.id, actorName: req.user.name, actorRole: req.user.role, academyId, action: 'payment_verified', entityType: 'academy', entityId: academyId, metadata: { planName, amount: p.price_monthly }, ip: req.ip });

    res.json({ message: 'Payment verified! Plan activated.', planName, activeUntil: trialEndsAt });
  } catch (e) {
    console.error('[Razorpay verify]', e.message);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = config.razorpay.webhookSecret;
    if (webhookSecret) {
      const signature = req.headers['x-razorpay-signature'];
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(req.body)
        .digest('hex');
      if (signature !== expected) {
        return res.status(400).json({ message: 'Invalid webhook signature' });
      }
    }

    const payload = JSON.parse(req.body.toString());
    const event = payload.event;

    if (event === 'payment.captured') {
      const payment = payload.payload.payment.entity;
      const { academyId, planName } = payment.notes || {};
      if (academyId && planName) {
        const plan = await query('SELECT * FROM subscription_plans WHERE name=$1', [planName]);
        if (plan.rows.length) {
          await query(
            'UPDATE academies SET plan=$1, max_students=$2, is_active=true, updated_at=NOW() WHERE id=$3',
            [planName, plan.rows[0].max_students, academyId]
          );
          await query(
            `UPDATE invoices SET status='paid', razorpay_payment_id=$1, paid_at=NOW()
             WHERE razorpay_order_id=$2`,
            [payment.id, payment.order_id]
          );
        }
      }
    }

    if (event === 'payment.failed') {
      const payment = payload.payload.payment.entity;
      await query(
        `UPDATE invoices SET status='failed' WHERE razorpay_order_id=$1`,
        [payment.order_id]
      );
    }

    res.json({ status: 'ok' });
  } catch (e) {
    console.error('[Razorpay Webhook Error]', e.message);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

router.get('/invoices/:academyId', authenticate, authorize('academy_admin', 'super_admin'), async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM invoices WHERE academy_id=$1 ORDER BY created_at DESC LIMIT 50`,
      [req.params.academyId]
    );
    res.json({ invoices: result.rows });
  } catch (e) {
    res.status(500).json({ message: 'Failed to get invoices' });
  }
});

router.get('/invoice/:id/html', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT i.*, a.name as academy_name, a.subdomain, a.email as academy_email
       FROM invoices i
       LEFT JOIN academies a ON i.academy_id = a.id
       WHERE i.id = $1 AND (i.academy_id = $2 OR $3 = 'super_admin')`,
      [req.params.id, req.user.academyId, req.user.role]
    );
    if (!result.rows.length) return res.status(404).json({ message: 'Invoice not found' });
    const inv = result.rows[0];

    const html = BillingService.generateInvoiceHTML(inv);

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (e) {
    console.error('[billing invoice]', e.message);
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
});

module.exports = router;