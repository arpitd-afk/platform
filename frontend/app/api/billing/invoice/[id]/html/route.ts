export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { BillingService } from '@/src/services/billingService';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');

  const invoice = await BillingService.getInvoiceById(params.id);
  if (!invoice) return NextResponse.json({ message: 'Invoice not found' }, { status: 404 });

  // Access control: only academy owner, admins, or parent (if it's a student invoice - though this route is for academy invoices)
  // For academy invoices, only academy owner or super admin
  if (user.role !== 'super_admin' && user.id !== invoice.owner_id) {
    return authResponse('Forbidden', 403);
  }

  try {
    const html = BillingService.generateInvoiceHTML(invoice);
    return new NextResponse(html, {
      headers: { 'Content-Type': 'text/html' }
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 400 });
  }
}
