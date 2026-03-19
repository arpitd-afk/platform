export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import StudentInvoiceService from '@/src/services/studentInvoiceService';
import { generateInvoicePDF } from '@/src/utils/pdfGenerator';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const row = await StudentInvoiceService.getById(params.id, auth.user);
    if (!row) return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const invoice = {
      ...row,
      line_items: typeof row.line_items === 'string' ? JSON.parse(row.line_items) : (row.line_items || []),
    };

    const student = {
      id: row.student_id,
      name: row.student_name,
      email: row.student_email,
      phone: row.student_phone,
    };

    const academy = {
      name: row.academy_name,
      logo_url: row.logo_url,
      settings: row.academy_settings || {},
    };

    const batch = row.batch_name ? { name: row.batch_name } : null;

    const pdfBuffer = await generateInvoicePDF(invoice, student, academy, batch);

    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="invoice-${row.invoice_number}.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
