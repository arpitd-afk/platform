import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import StudentInvoiceService from '@/src/services/studentInvoiceService';

export async function GET(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(req.url);
    const params = {
      studentId: searchParams.get('studentId') || undefined,
      status: searchParams.get('status') || undefined,
      batchId: searchParams.get('batchId') || undefined,
      academyId: auth.user.academyId,
    };

    const invoices = await StudentInvoiceService.listInvoices(params, auth.user);
    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const result = await StudentInvoiceService.createInvoice(body, auth.user.academyId);
    return NextResponse.json({ message: 'Created', ...result }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
