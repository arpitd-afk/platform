const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { query } = require('../config/database');
const { authenticate, authorize } = require('../middleware/auth');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

const router = express.Router();
router.use(authenticate);

// ─── Helper: auto invoice number ─────────────────────────────────────────────
async function generateInvoiceNumber(academyId) {
    const res = await query("SELECT subdomain FROM academies WHERE id=$1", [academyId]);
    const prefix = (res.rows[0]?.subdomain || 'INV').toUpperCase().slice(0, 4);
    const seq = await query("SELECT nextval('invoice_number_seq') AS n");
    return `${prefix}-${String(seq.rows[0].n).padStart(5, '0')}`;
}

// GET /api/student-invoices — list (admin: all, student: own)
router.get('/', async (req, res) => {
    try {
        const { studentId, status, batchId } = req.query;
        const isAdmin = ['academy_admin', 'super_admin'].includes(req.user.role);
        const sid = isAdmin ? (studentId || null) : req.user.id;

        const conds = ['si.academy_id = $1'];
        const params = [req.user.academyId];

        if (sid) { params.push(sid); conds.push(`si.student_id = $${params.length}`); }
        if (status) { params.push(status); conds.push(`si.status = $${params.length}`); }
        if (batchId) { params.push(batchId); conds.push(`si.batch_id = $${params.length}`); }

        const result = await query(
            `SELECT si.*,
         u.name as student_name, u.email as student_email, u.phone as student_phone,
         b.name as batch_name
       FROM student_invoices si
       JOIN users u ON u.id = si.student_id
       LEFT JOIN batches b ON b.id = si.batch_id
       WHERE ${conds.join(' AND ')}
       ORDER BY si.created_at DESC`,
            params
        );
        res.json({ invoices: result.rows });
    } catch (e) { console.error('[student-invoices]', e.message); res.status(500).json({ message: 'Failed' }); }
});

// GET /api/student-invoices/:id — single invoice
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT si.*,
         u.name as student_name, u.email as student_email, u.phone as student_phone,
         b.name as batch_name,
         a.name as academy_name, a.settings as academy_settings, a.logo_url
       FROM student_invoices si
       JOIN users u ON u.id = si.student_id
       LEFT JOIN batches b ON b.id = si.batch_id
       JOIN academies a ON a.id = si.academy_id
       WHERE si.id = $1`,
            [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
        const inv = result.rows[0];
        // Access check
        if (req.user.role === 'student' && inv.student_id !== req.user.id)
            return res.status(403).json({ message: 'Forbidden' });
        res.json({ invoice: inv });
    } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// POST /api/student-invoices — create (admin only)
router.post('/', authorize('academy_admin', 'super_admin'), async (req, res) => {
    try {
        const {
            studentId, batchId, lineItems = [], notes,
            dueDate, periodFrom, periodTo, taxRate = 18,
            currency = 'INR', status = 'draft'
        } = req.body;

        if (!studentId) return res.status(400).json({ message: 'studentId required' });

        // Verify student belongs to academy
        const st = await query('SELECT id FROM users WHERE id=$1 AND academy_id=$2', [studentId, req.user.academyId]);
        if (!st.rows.length) return res.status(400).json({ message: 'Student not in this academy' });

        const subtotal = lineItems.reduce((s, item) => s + (item.qty || 1) * (item.rate || 0), 0);
        const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2);
        const total = +(subtotal + taxAmount).toFixed(2);

        const id = uuidv4();
        const invoiceNumber = await generateInvoiceNumber(req.user.academyId);

        await query(
            `INSERT INTO student_invoices
         (id, invoice_number, academy_id, student_id, batch_id, status, currency,
          subtotal, tax_rate, tax_amount, total, line_items, notes,
          due_date, period_from, period_to, issued_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW(),NOW())`,
            [id, invoiceNumber, req.user.academyId, studentId, batchId || null, status, currency,
                subtotal, taxRate, taxAmount, total, JSON.stringify(lineItems), notes || null,
                dueDate || null, periodFrom || null, periodTo || null]
        );
        res.status(201).json({ message: 'Created', id, invoiceNumber });
    } catch (e) { console.error('[student-invoices]', e.message); res.status(500).json({ message: 'Failed to create' }); }
});

// PATCH /api/student-invoices/:id — update status / payment
router.patch('/:id', authorize('academy_admin', 'super_admin'), async (req, res) => {
    try {
        const { status, paymentRef, paymentMethod, amountPaid, notes, dueDate } = req.body;
        const sets = ['updated_at=NOW()'];
        const params = [req.params.id, req.user.academyId];

        if (status) { params.push(status); sets.push(`status=$${params.length}`); }
        if (paymentRef) { params.push(paymentRef); sets.push(`payment_ref=$${params.length}`); }
        if (paymentMethod) { params.push(paymentMethod); sets.push(`payment_method=$${params.length}`); }
        if (amountPaid != null) { params.push(amountPaid); sets.push(`amount_paid=$${params.length}`); }
        if (notes != null) { params.push(notes); sets.push(`notes=$${params.length}`); }
        if (dueDate) { params.push(dueDate); sets.push(`due_date=$${params.length}`); }
        if (status === 'paid') sets.push('paid_at=NOW()');

        await query(
            `UPDATE student_invoices SET ${sets.join(',')} WHERE id=$1 AND academy_id=$2`,
            params
        );
        res.json({ message: 'Updated' });
    } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// DELETE /api/student-invoices/:id — admin only, only drafts
router.delete('/:id', authorize('academy_admin', 'super_admin'), async (req, res) => {
    try {
        const r = await query(
            "DELETE FROM student_invoices WHERE id=$1 AND academy_id=$2 AND status='draft' RETURNING id",
            [req.params.id, req.user.academyId]
        );
        if (!r.rows.length) return res.status(400).json({ message: 'Can only delete draft invoices' });
        res.json({ message: 'Deleted' });
    } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

// GET /api/student-invoices/:id/pdf — download PDF
router.get('/:id/pdf', async (req, res) => {
    try {
        const result = await query(
            `SELECT si.*,
         u.name as student_name, u.email as student_email, u.phone as student_phone, u.id as student_user_id,
         b.name as batch_name,
         a.name as academy_name, a.settings as academy_settings, a.logo_url, a.subdomain
       FROM student_invoices si
       JOIN users u ON u.id = si.student_id
       LEFT JOIN batches b ON b.id = si.batch_id
       JOIN academies a ON a.id = si.academy_id
       WHERE si.id = $1`,
            [req.params.id]
        );
        if (!result.rows.length) return res.status(404).json({ message: 'Not found' });
        const row = result.rows[0];

        // Access check
        if (req.user.role === 'student' && row.student_id !== req.user.id)
            return res.status(403).json({ message: 'Forbidden' });

        const invoice = {
            ...row,
            line_items: typeof row.line_items === 'string' ? JSON.parse(row.line_items) : (row.line_items || []),
        };
        const student = { id: row.student_user_id, name: row.student_name, email: row.student_email, phone: row.student_phone };
        const academy = { name: row.academy_name, logo_url: row.logo_url, settings: row.academy_settings || {} };
        const batch = row.batch_name ? { name: row.batch_name } : null;

        const pdfBuffer = await generateInvoicePDF(invoice, student, academy, batch);

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${row.invoice_number}.pdf"`);
        res.setHeader('Content-Length', pdfBuffer.length);
        res.send(pdfBuffer);
    } catch (e) { console.error('[invoice-pdf]', e.message); res.status(500).json({ message: 'Failed to generate PDF' }); }
});

// GET /api/student-invoices/summary/:academyId — stats for dashboard
router.get('/summary/:academyId', authorize('academy_admin', 'super_admin'), async (req, res) => {
    try {
        const r = await query(
            `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status='paid') as paid,
         COUNT(*) FILTER (WHERE status='pending' OR status='sent') as pending,
         COUNT(*) FILTER (WHERE status='overdue') as overdue,
         COALESCE(SUM(total) FILTER (WHERE status='paid'), 0) as total_collected,
         COALESCE(SUM(total) FILTER (WHERE status IN ('pending','sent','overdue')), 0) as total_outstanding
       FROM student_invoices WHERE academy_id=$1`,
            [req.params.academyId]
        );
        res.json({ summary: r.rows[0] });
    } catch (e) { res.status(500).json({ message: 'Failed' }); }
});

module.exports = router;