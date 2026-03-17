import { NextRequest, NextResponse } from 'next/server';
import { authenticate } from '@/src/lib/auth';
import BillingService from '@/src/services/billingService';

export async function GET(req: NextRequest) {
  try {
    const plans = await BillingService.listPlans(false);
    return NextResponse.json({ plans });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth: any = await authenticate(req);
  if (!auth) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  if (auth.user.role !== 'super_admin') return NextResponse.json({ message: 'Forbidden' }, { status: 403 });

  try {
    const body = await req.json();
    const id = await BillingService.createPlan(body);
    return NextResponse.json({ message: 'Plan created', id }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
