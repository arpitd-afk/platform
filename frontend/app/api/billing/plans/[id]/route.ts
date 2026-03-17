import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import BillingService from '@/src/services/billingService';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (auth.user.role !== 'super_admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    await BillingService.updatePlan(params.id, body);
    return NextResponse.json({ message: 'Plan updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (auth.user.role !== 'super_admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    await BillingService.updatePlan(params.id, { is_active: false });
    return NextResponse.json({ message: 'Plan deactivated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
