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
    if (!['super_admin', 'academy_admin'].includes(req.user.role)) return res.status(403).json({ message: 'Not authorized' });
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

// ─────────────────────────────────────────────────────────────────────────────
// RAZORPAY PAYMENT INTEGRATION
// ─────────────────────────────────────────────────────────────────────────────
let Razorpay;
try { Razorpay = require('razorpay'); } catch (e) { }

const crypto = require('crypto');

function getRazorpayInstance() {
  if (!Razorpay) throw new Error('Razorpay module not installed');
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) throw new Error('Razorpay credentials not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env');
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

// POST /api/billing/razorpay/create-order
// Creates a Razorpay order for academy subscription
router.post('/razorpay/create-order', authorize('academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { planName, academyId } = req.body;
    const plan = await query('SELECT * FROM subscription_plans WHERE name=$1', [planName]);
    if (!plan.rows.length) return res.status(404).json({ message: 'Plan not found' });

    const p = plan.rows[0];
    if (!p.price_monthly || p.price_monthly <= 0) {
      return res.status(400).json({ message: 'This plan requires manual setup. Contact support.' });
    }

    const instance = getRazorpayInstance();
    const order = await instance.orders.create({
      amount: Math.round(p.price_monthly * 100), // paise
      currency: 'INR',
      receipt: `acad_${academyId}_${Date.now()}`,
      notes: { academyId, planName, plan_id: p.id }
    });

    // Store pending payment
    await query(
      `INSERT INTO invoices (id, academy_id, amount, status, description, razorpay_order_id, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'pending', $3, $4, NOW())
       ON CONFLICT DO NOTHING`,
      [academyId, p.price_monthly, `${p.name} Plan - Monthly`, order.id]
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
      planName: p.name,
      planPrice: p.price_monthly,
    });
  } catch (e) {
    console.error('[Razorpay create-order]', e.message);
    res.status(500).json({ message: e.message || 'Failed to create payment order' });
  }
});

// POST /api/billing/razorpay/verify
// Verifies Razorpay payment signature and activates subscription
router.post('/razorpay/verify', authorize('academy_admin', 'super_admin'), async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, academyId, planName } = req.body;

    // Verify HMAC signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keySecret) return res.status(500).json({ message: 'Razorpay not configured' });

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' });
    }

    // Activate subscription
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

    // Update invoice to paid
    await query(
      `UPDATE invoices
       SET status='paid', razorpay_payment_id=$1, paid_at=NOW()
       WHERE razorpay_order_id=$2`,
      [razorpay_payment_id, razorpay_order_id]
    );

    console.log(`[Payment] Academy ${academyId} upgraded to ${planName} via ${razorpay_payment_id}`);
    res.json({ message: 'Payment verified! Plan activated.', planName, activeUntil: trialEndsAt });
  } catch (e) {
    console.error('[Razorpay verify]', e.message);
    res.status(500).json({ message: 'Payment verification failed' });
  }
});

// POST /api/billing/razorpay/webhook
// Razorpay webhook for async events (payment.captured, subscription.charged etc.)
router.post('/razorpay/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
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
    console.log(`[Razorpay Webhook] Event: ${event}`);

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

// GET /api/billing/invoices/:academyId (academy admin view)
router.get('/invoices/:academyId', authorize('academy_admin', 'super_admin'), async (req, res) => {
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