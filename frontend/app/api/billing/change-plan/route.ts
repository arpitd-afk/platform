import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import BillingService from '@/src/services/billingService';

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  if (!['super_admin', 'academy_admin'].includes(auth.user.role)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { academyId, planName } = await req.json();
    await BillingService.changePlan(academyId, planName);
    return NextResponse.json({ message: 'Plan updated' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
