import { v4 as uuidv4 } from 'uuid';
import { query } from '../lib/db';

export class StudentInvoiceService {
  static async generateInvoiceNumber(academyId: string) {
    const res = await query("SELECT subdomain FROM academies WHERE id=$1", [academyId]);
    const prefix = (res.rows[0]?.subdomain || 'INV').toUpperCase().slice(0, 4);
    const seq = await query("SELECT nextval('invoice_number_seq') AS n");
    return `${prefix}-${String(seq.rows[0].n).padStart(5, '0')}`;
  }

  static async listInvoices(params: { studentId?: string, status?: string, batchId?: string, academyId: string }, currentUser: any) {
    const { studentId, status, batchId, academyId } = params;
    const conds = ['si.academy_id = $1'];
    const queryParams: any[] = [academyId];

    if (['academy_admin', 'super_admin'].includes(currentUser.role)) {
      if (studentId) {
        queryParams.push(studentId);
        conds.push(`si.student_id = $${queryParams.length}`);
      }
    } else if (currentUser.role === 'parent') {
      queryParams.push(currentUser.id);
      conds.push(`si.student_id IN (SELECT student_id FROM parent_student WHERE parent_id = $${queryParams.length})`);
    } else {
      queryParams.push(currentUser.id);
      conds.push(`si.student_id = $${queryParams.length}`);
    }

    if (status) {
      queryParams.push(status);
      conds.push(`si.status = $${queryParams.length}`);
    }
    if (batchId) {
      queryParams.push(batchId);
      conds.push(`si.batch_id = $${queryParams.length}`);
    }

    const result = await query(
      `SELECT si.*,
         u.name as student_name, u.email as student_email, u.phone as student_phone,
         b.name as batch_name
       FROM student_invoices si
       JOIN users u ON u.id = si.student_id
       LEFT JOIN batches b ON b.id = si.batch_id
       WHERE ${conds.join(' AND ')}
       ORDER BY si.created_at DESC`,
      queryParams
    );
    return result.rows;
  }

  static async getById(id: string, currentUser: any) {
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
      [id]
    );
    if (!result.rows.length) return null;
    const inv = result.rows[0];

    // Access check
    if (currentUser.role === 'student' && inv.student_id !== currentUser.id) {
      throw new Error('Forbidden');
    }
    // Parent access check
    if (currentUser.role === 'parent') {
      const isLinked = await query('SELECT 1 FROM parent_student WHERE parent_id=$1 AND student_id=$2', [currentUser.id, inv.student_id]);
      if (!isLinked.rows.length) throw new Error('Forbidden');
    }

    return inv;
  }

  static async createInvoice(data: any, academyId: string) {
    const {
      studentId, batchId, lineItems = [], notes,
      dueDate, periodFrom, periodTo, taxRate = 18,
      currency = 'INR', status = 'draft'
    } = data;

    const subtotal = lineItems.reduce((s: number, item: any) => s + (item.qty || 1) * (item.rate || 0), 0);
    const taxAmount = +(subtotal * (taxRate / 100)).toFixed(2);
    const total = +(subtotal + taxAmount).toFixed(2);

    const id = uuidv4();
    const invoiceNumber = await this.generateInvoiceNumber(academyId);

    await query(
      `INSERT INTO student_invoices
         (id, invoice_number, academy_id, student_id, batch_id, status, currency,
          subtotal, tax_rate, tax_amount, total, line_items, notes,
          due_date, period_from, period_to, issued_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,NOW(),NOW(),NOW())`,
      [id, invoiceNumber, academyId, studentId, batchId || null, status, currency,
        subtotal, taxRate, taxAmount, total, JSON.stringify(lineItems), notes || null,
        dueDate || null, periodFrom || null, periodTo || null]
    );

    return { id, invoiceNumber };
  }

  static async updateInvoice(id: string, data: any, academyId: string) {
    const { status, paymentRef, paymentMethod, amountPaid, notes, dueDate } = data;
    const sets = ['updated_at=NOW()'];
    const params: any[] = [id, academyId];

    if (status) { params.push(status); sets.push(`status=$${params.length}`); }
    if (paymentRef) { params.push(paymentRef); sets.push(`payment_ref=$${params.length}`); }
    if (paymentMethod) { params.push(paymentMethod); sets.push(`payment_method=$${params.length}`); }
    if (amountPaid != null) { params.push(amountPaid); sets.push(`amount_paid=$${params.length}`); }
    if (notes != null) { params.push(notes); sets.push(`notes=$${params.length}`); }
    if (dueDate) { params.push(dueDate); sets.push(`due_date=$${params.length}`); }
    if (status === 'paid') sets.push('paid_at=NOW()');

    await query(`UPDATE student_invoices SET ${sets.join(',')} WHERE id=$1 AND academy_id=$2`, params);

    if (status === 'paid') {
      try {
        const invRes = await query('SELECT student_id, total, invoice_number FROM student_invoices WHERE id=$1', [id]);
        if (invRes.rows.length) {
          const { student_id, total, invoice_number } = invRes.rows[0];
          await query(
            "INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, 'payment', $2, $3, NOW())",
            [student_id, `Payment Success: ${invoice_number}`, `Your payment of ${total} for invoice ${invoice_number} has been received.`]
          );
          const parents = await query('SELECT parent_id FROM parent_student WHERE student_id=$1', [student_id]);
          for (const p of parents.rows) {
            await query(
              "INSERT INTO notifications (id, user_id, type, title, body, created_at) VALUES (gen_random_uuid(), $1, 'payment', $2, $3, NOW())",
              [p.parent_id, `Payment Success: ${invoice_number}`, `Payment for your child's invoice ${invoice_number} (${total}) has been received.`]
            );
          }
        }
      } catch (err) { console.error('[Invoice Notif Error]', err); }
    }
  }

  static async deleteInvoice(id: string, academyId: string) {
    const r = await query(
      "DELETE FROM student_invoices WHERE id=$1 AND academy_id=$2 AND status IN ('draft', 'cancelled') RETURNING id",
      [id, academyId]
    );
    if (!r.rows.length) throw new Error('Can only delete draft or cancelled invoices');
  }

  static async getSummary(academyId: string) {
    const result = await query(
      `SELECT
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE status='paid') as paid,
         COUNT(*) FILTER (WHERE status='pending' OR status='sent') as pending,
         COUNT(*) FILTER (WHERE status='overdue') as overdue,
         COALESCE(SUM(total) FILTER (WHERE status='paid'), 0) as total_collected,
         COALESCE(SUM(total) FILTER (WHERE status IN ('pending','sent','overdue')), 0) as total_outstanding
       FROM student_invoices WHERE academy_id=$1`,
      [academyId]
    );
    return result.rows[0];
  }
}

export default StudentInvoiceService;
