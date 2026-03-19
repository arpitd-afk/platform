import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

export class StudentInvoiceService {
  static async generateInvoiceNumber(academyId: string) {
    const academy = await prisma.academy.findUnique({
      where: { id: academyId },
      select: { subdomain: true },
    });
    const prefix = (academy?.subdomain || 'INV').toUpperCase().slice(0, 4);
    
    // Prisma doesn't directly support sequence nextval in a cross-DB way without raw query
    const seq: any[] = await prisma.$queryRaw`SELECT nextval('invoice_number_seq') AS n`;
    const n = seq[0]?.n || 0;
    
    return `${prefix}-${String(n).padStart(5, '0')}`;
  }

  static async listInvoices(params: { studentId?: string, status?: string, batchId?: string, academyId: string }, currentUser: { id: string, role: string }) {
    const { studentId, status, batchId, academyId } = params;
    const where: Prisma.StudentInvoiceWhereInput = { academy_id: academyId };

    if (['academy_admin', 'super_admin'].includes(currentUser.role)) {
      if (studentId) {
        where.student_id = studentId;
      }
    } else if (currentUser.role === 'parent') {
      where.student = {
        student_of: { some: { parent_id: currentUser.id } }
      };
    } else {
      where.student_id = currentUser.id;
    }

    if (status) {
      where.status = status;
    }
    if (batchId) {
      where.batch_id = batchId;
    }

    const invoices = await prisma.studentInvoice.findMany({
      where,
      include: {
        student: { select: { name: true, email: true, phone: true } },
        batch: { select: { name: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    return invoices.map((inv) => ({
      ...inv,
      student_name: (inv.student as any)?.name,
      student_email: (inv.student as any)?.email,
      student_phone: (inv.student as any)?.phone,
      batch_name: (inv.batch as any)?.name,
    }));
  }

  static async getById(id: string, currentUser: { id: string, role: string }) {
    const inv = await prisma.studentInvoice.findUnique({
      where: { id },
      include: {
        student: { select: { name: true, email: true, phone: true } },
        batch: { select: { name: true } },
        academy: { select: { name: true, settings: true, logo_url: true } },
      },
    });

    if (!inv) return null;

    // Access check
    if (currentUser.role === 'student' && inv.student_id !== currentUser.id) {
      throw new Error('Forbidden');
    }
    // Parent access check
    if (currentUser.role === 'parent') {
      const isLinked = await prisma.parentStudent.findUnique({
        where: { parent_id_student_id: { parent_id: currentUser.id, student_id: inv.student_id || '' } }
      });
      if (!isLinked) throw new Error('Forbidden');
    }

    return {
      ...inv,
      student_name: inv.student?.name,
      student_email: inv.student?.email,
      student_phone: inv.student?.phone,
      batch_name: inv.batch?.name,
      academy_name: inv.academy?.name,
      academy_settings: inv.academy?.settings,
      logo_url: inv.academy?.logo_url,
    };
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

    const invoiceNumber = await this.generateInvoiceNumber(academyId);

    const invoice = await prisma.studentInvoice.create({
      data: {
        invoice_number: invoiceNumber,
        academy_id: academyId,
        student_id: studentId,
        batch_id: batchId || null,
        status,
        currency,
        subtotal,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        total,
        line_items: lineItems || [],
        notes: notes || null,
        due_date: dueDate ? new Date(dueDate) : null,
        period_from: periodFrom ? new Date(periodFrom) : null,
        period_to: periodTo ? new Date(periodTo) : null,
        issued_at: new Date(),
      },
    });

    return { id: invoice.id, invoiceNumber: invoice.invoice_number };
  }

  static async updateInvoice(id: string, data: any, academyId: string) {
    const { status, paymentRef, paymentMethod, amountPaid, notes, dueDate } = data;

    const updateData: Prisma.StudentInvoiceUpdateInput = {
      updated_at: new Date(),
    };

    if (status) updateData.status = status;
    if (paymentRef) updateData.payment_ref = paymentRef;
    if (paymentMethod) updateData.payment_method = paymentMethod;
    if (amountPaid != null) updateData.amount_paid = amountPaid;
    if (notes != null) updateData.notes = notes;
    if (dueDate) updateData.due_date = new Date(dueDate);

    if (status === 'paid') {
      updateData.paid_at = new Date();
    }

    const invoice = await prisma.studentInvoice.update({
      where: { id, academy_id: academyId },
      data: updateData,
    });

    if (status === 'paid') {
      try {
        const studentId = invoice.student_id;
        if (studentId) {
          // Notify student
          await prisma.notification.create({
            data: {
              user_id: studentId,
              type: 'payment',
              title: `Payment Success: ${invoice.invoice_number}`,
              body: `Your payment of ${invoice.total} for invoice ${invoice.invoice_number} has been received.`,
            }
          });

          // Notify parents
          const parentLinks = await prisma.parentStudent.findMany({
            where: { student_id: studentId },
            select: { parent_id: true },
          });

          for (const link of parentLinks) {
            await prisma.notification.create({
              data: {
                user_id: link.parent_id,
                type: 'payment',
                title: `Payment Success: ${invoice.invoice_number}`,
                body: `Payment for your child's invoice ${invoice.invoice_number} (${invoice.total}) has been received.`,
              }
            });
          }
        }
      } catch (err) {
        console.error('[Invoice Notif Error]', err);
      }
    }
  }

  static async deleteInvoice(id: string, academyId: string) {
    const invoice = await prisma.studentInvoice.findUnique({
      where: { id, academy_id: academyId },
      select: { status: true },
    });

    if (!invoice || !['draft', 'cancelled'].includes(invoice.status || '')) {
      throw new Error('Can only delete draft or cancelled invoices');
    }

    await prisma.studentInvoice.delete({
      where: { id },
    });
  }

  static async getSummary(academyId: string) {
    const invoices = await prisma.studentInvoice.findMany({
      where: { academy_id: academyId },
      select: { status: true, total: true },
    });

    return {
      total: invoices.length,
      paid: invoices.filter(i => i.status === 'paid').length,
      pending: invoices.filter(i => i.status === 'pending' || i.status === 'sent').length,
      overdue: invoices.filter(i => i.status === 'overdue').length,
      total_collected: invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.total), 0),
      total_outstanding: invoices.filter(i => ['pending', 'sent', 'overdue'].includes(i.status || '')).reduce((sum, i) => sum + Number(i.total), 0),
    };
  }
}

export default StudentInvoiceService;
