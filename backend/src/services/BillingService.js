const crypto = require('crypto');
const { query } = require('../config/database');
const config = require('../config');

let Razorpay;
try { Razorpay = require('razorpay'); } catch (e) { }

class BillingService {
  static getRazorpayInstance() {
    if (!Razorpay) throw new Error('Razorpay module not installed');
    const { keyId, keySecret } = config.razorpay;
    if (!keyId || !keySecret) throw new Error('Razorpay credentials not configured.');
    return new Razorpay({ key_id: keyId, key_secret: keySecret });
  }

  static async createSubscriptionOrder(academyId, planName) {
    const planResult = await query('SELECT * FROM subscription_plans WHERE name=$1', [planName]);
    if (!planResult.rows.length) throw new Error('Plan not found');
    const p = planResult.rows[0];

    if (!p.price_monthly || p.price_monthly <= 0) {
      throw new Error('This plan requires manual setup. Contact support.');
    }

    const instance = this.getRazorpayInstance();
    const order = await instance.orders.create({
      amount: Math.round(p.price_monthly * 100),
      currency: 'INR',
      receipt: `acad_${academyId}_${Date.now()}`,
      notes: { academyId, planName, plan_id: p.id }
    });

    return { order, plan: p };
  }

  static verifyPayment(orderId, paymentId, signature) {
    const keySecret = config.razorpay.keySecret;
    if (!keySecret) throw new Error('Razorpay not configured');

    const expected = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    return expected === signature;
  }

  static generateInvoiceHTML(inv) {
    const formatINR = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: inv.currency || 'INR' }).format(n || 0);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    return `<!DOCTYPE html>
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
  }
}

module.exports = BillingService;
