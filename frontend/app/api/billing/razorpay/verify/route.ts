export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { getServerUser, authResponse } from '@/src/lib/auth';
import { BillingService } from '@/src/services/billingService';
import { query } from '@/src/lib/db';
import { ActivityLogService } from '@/src/services/activityLogService';

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse('Unauthorized');
  if (!['academy_admin', 'super_admin'].includes(user.role)) return authResponse('Forbidden', 403);

  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, academyId, planName } = await req.json();

    if (!BillingService.verifyPayment(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ message: 'Payment verification failed — invalid signature' }, { status: 400 });
    }

    const plan = await query('SELECT * FROM subscription_plans WHERE name=$1', [planName]);
    if (!plan.rows.length) return NextResponse.json({ message: 'Plan not found' }, { status: 404 });
    const p = plan.rows[0];

    const trialEndsAt = new Date();
    trialEndsAt.setMonth(trialEndsAt.getMonth() + 1);

    await query(
      `UPDATE academies
       SET plan=$1, max_students=$2, is_active=true, trial_ends_at=$3, updated_at=NOW()
       WHERE id=$4`,
      [planName, p.max_students, trialEndsAt.toISOString(), academyId]
    );

    await query(
      `UPDATE invoices
       SET status='paid', razorpay_payment_id=$1, paid_at=NOW()
       WHERE razorpay_order_id=$2`,
      [razorpay_payment_id, razorpay_order_id]
    );

    await ActivityLogService.logActivity({
      actorId: user.id,
      actorName: user.name,
      actorRole: user.role,
      academyId,
      action: 'payment_verified',
      entityType: 'academy',
      entityId: academyId,
      metadata: { planName, amount: p.price_monthly }
    });

    return NextResponse.json({ message: 'Payment verified! Plan activated.', planName, activeUntil: trialEndsAt });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Failed' }, { status: 500 });
  }
}
