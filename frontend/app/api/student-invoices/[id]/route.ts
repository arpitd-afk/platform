import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import StudentInvoiceService from '@/src/services/studentInvoiceService';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  try {
    const invoice = await StudentInvoiceService.getById(params.id, auth.user);
    if (!invoice) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    return NextResponse.json({ invoice });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await req.json();
    await StudentInvoiceService.updateInvoice(params.id, body, auth.user.academyId);
    return NextResponse.json({ message: 'Updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['academy_admin', 'super_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await StudentInvoiceService.deleteInvoice(params.id, auth.user.academyId);
    return NextResponse.json({ message: 'Deleted' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
