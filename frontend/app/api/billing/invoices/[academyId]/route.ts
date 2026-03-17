import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { BillingService } from '@/src/services/billingService';

export async function GET(
  req: NextRequest,
  { params }: { params: { academyId: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  
  // Only academy admin or super admin
  if (user.role !== 'super_admin' && user.academyId !== params.academyId) {
    return authResponse('Forbidden', 403);
  }

  try {
    const invoices = await BillingService.listAcademyInvoices(params.academyId);
    return NextResponse.json({ invoices });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
