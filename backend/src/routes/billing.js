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
  } catch (e) { console.error("[billing]", e.message); res.status(500).json({ message: 'Failed', _route: 'billing' }); }
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
  } catch (e) { console.error("[billing]", e.message); res.status(500).json({ message: 'Failed', _route: 'billing' }); }
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
  } catch (e) { console.error("[billing]", e.message); res.status(500).json({ message: 'Failed', _route: 'billing' }); }
});


// ─── Subscription Plan CRUD (Super Admin only) ───────────────────────────────

// GET /api/billing/plans/all — all plans including inactive
router.get('/plans/all', authorize('super_admin'), async (req, res) => {
  try {
    const result = await query('SELECT * FROM subscription_plans ORDER BY price_monthly ASC NULLS LAST');
    res.json({ plans: result.rows });
  } catch (e) { console.error('[billing]', e.message); res.status(500).json({ message: 'Failed' }); }
});

// POST /api/billing/plans — create plan
router.post('/plans', authorize('super_admin'), async (req, res) => {
  try {
    const { name, slug, price_monthly, price_yearly, max_students, max_coaches, features } = req.body;
    if (!name || !slug) return res.status(400).json({ message: 'Name and slug are required' });
    const existing = await query('SELECT id FROM subscription_plans WHERE slug=$1', [slug]);
    if (existing.rows.length) return res.status(409).json({ message: 'Slug already exists' });
    const id = require('uuid').v4();
    await query(
      `INSERT INTO subscription_plans (id, name, slug, price_monthly, price_yearly, max_students, max_coaches, features, is_active, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,true,NOW())`,
      [id, name, slug, price_monthly || null, price_yearly || null, max_students || 50, max_coaches || 5, JSON.stringify(features || [])]
    );
    res.status(201).json({ message: 'Plan created', id });
  } catch (e) { console.error('[billing]', e.message); res.status(500).json({ message: 'Failed' }); }
});

// PUT /api/billing/plans/:id — update plan
router.put('/plans/:id', authorize('super_admin'), async (req, res) => {
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

// DELETE /api/billing/plans/:id — deactivate plan (soft delete)
router.delete('/plans/:id', authorize('super_admin'), async (req, res) => {
  try {
    await query('UPDATE subscription_plans SET is_active=false WHERE id=$1', [req.params.id]);
    res.json({ message: 'Plan deactivated' });
  } catch (e) { console.error('[billing]', e.message); res.status(500).json({ message: 'Failed' }); }
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

// GET /api/billing/invoice/:id/html — generate printable invoice HTML
router.get('/invoice/:id/html', async (req, res) => {
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

    const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency || 'INR' }).format(n || 0);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Invoice #${inv.id.slice(0, 8).toUpperCase()}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1C1107; background: #fff; padding: 48px; max-width: 760px; margin: auto; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 24px; border-bottom: 2px solid #C8961E; }
  .logo { font-size: 24px; font-weight: 800; color: #C8961E; letter-spacing: -0.5px; }
  .logo span { color: #1C1107; }
  .invoice-title { font-size: 32px; font-weight: 700; color: #1C1107; }
  .invoice-meta { color: #9B8575; font-size: 13px; margin-top: 4px; }
  .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;
    background: ${inv.status === 'paid' ? '#DCFCE7' : inv.status === 'failed' ? '#FEE2E2' : '#FEF3C7'};
    color: ${inv.status === 'paid' ? '#15803D' : inv.status === 'failed' ? '#DC2626' : '#9A6E00'}; }
  .section { margin: 28px 0; }
  .section-title { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #9B8575; margin-bottom: 8px; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .info-block p { font-size: 14px; color: #5C4A38; line-height: 1.6; }
  .info-block strong { font-weight: 600; color: #1C1107; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #9B8575; text-align: left; padding: 8px 12px; background: #F7F4EF; }
  td { padding: 12px; font-size: 14px; border-bottom: 1px solid #E2D8CE; }
  .text-right { text-align: right; }
  .totals { margin-top: 16px; }
  .total-row { display: flex; justify-content: space-between; padding: 8px 0; font-size: 14px; color: #5C4A38; }
  .total-row.grand { font-size: 18px; font-weight: 700; color: #1C1107; border-top: 2px solid #C8961E; padding-top: 12px; margin-top: 4px; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #E2D8CE; text-align: center; font-size: 12px; color: #9B8575; }
  @media print {
    body { padding: 24px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
<div class="no-print" style="position:fixed;top:16px;right:16px;z-index:10">
  <button onclick="window.print()" style="background:#C8961E;color:white;border:none;padding:10px 20px;border-radius:8px;font-weight:600;cursor:pointer;font-size:14px;">⬇ Download / Print</button>
</div>

<div class="header">
  <div>
    <div class="logo">♔ Chess<span>Academy</span></div>
    <div style="font-size:13px;color:#9B8575;margin-top:4px">${inv.academy_name || 'Chess Academy'}</div>
  </div>
  <div style="text-align:right">
    <div class="invoice-title">INVOICE</div>
    <div class="invoice-meta">#${inv.id.slice(0, 8).toUpperCase()}</div>
    <div style="margin-top:8px"><span class="status-badge">${inv.status}</span></div>
  </div>
</div>

<div class="info-grid">
  <div class="info-block">
    <div class="section-title">Billed To</div>
    <p><strong>${inv.academy_name || 'N/A'}</strong><br>
    ${inv.academy_email || ''}<br>
    ${inv.gst_number ? 'GST: ' + inv.gst_number : ''}</p>
  </div>
  <div class="info-block">
    <div class="section-title">Invoice Details</div>
    <p><strong>Date:</strong> ${formatDate(inv.created_at)}<br>
    <strong>Plan:</strong> ${inv.plan || 'Standard'}<br>
    ${inv.razorpay_payment_id ? '<strong>Payment ID:</strong> ' + inv.razorpay_payment_id : ''}
    ${inv.billing_period_start ? '<br><strong>Period:</strong> ' + formatDate(inv.billing_period_start) + ' – ' + formatDate(inv.billing_period_end) : ''}</p>
  </div>
</div>

<div class="section">
  <table>
    <thead><tr>
      <th>Description</th>
      <th class="text-right">Amount</th>
    </tr></thead>
    <tbody>
      <tr>
        <td>${inv.description || inv.plan + ' Plan Subscription'}<br>
          <span style="font-size:12px;color:#9B8575">${inv.billing_period_start ? formatDate(inv.billing_period_start) + ' to ' + formatDate(inv.billing_period_end) : ''}</span>
        </td>
        <td class="text-right">${formatINR(inv.amount - (inv.gst_amount || 0))}</td>
      </tr>
      ${inv.gst_amount ? `<tr><td>GST (18%)</td><td class="text-right">${formatINR(inv.gst_amount)}</td></tr>` : ''}
    </tbody>
  </table>
  <div class="totals">
    <div class="total-row grand">
      <span>Total Amount</span>
      <span>${formatINR(inv.amount)}</span>
    </div>
  </div>
</div>

<div class="footer">
  <p>Thank you for your subscription to Chess Academy Pro.</p>
  <p style="margin-top:4px">Questions? Contact us at support@chessacademy.pro</p>
</div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (e) {
    console.error('[billing invoice]', e.message);
    res.status(500).json({ message: 'Failed to generate invoice' });
  }
});