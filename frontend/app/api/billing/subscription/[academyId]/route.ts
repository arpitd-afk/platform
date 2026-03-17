import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import BillingService from '@/src/services/billingService';

export async function GET(req: NextRequest, { params }: { params: { academyId: string } }) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  // Access check
  if (auth.user.role !== 'super_admin' && auth.user.academyId !== params.academyId) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const subscription = await BillingService.getSubscription(params.academyId);
    return NextResponse.json({ subscription });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
