import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import config from '@/src/lib/config';
import { BillingService } from '@/src/services/billingService';

export async function POST(req: NextRequest) {
  const secret = config.razorpay.webhookSecret;
  const signature = req.headers.get('x-razorpay-signature');
  
  if (!signature) return NextResponse.json({ message: 'Missing signature' }, { status: 400 });

  const body = await req.json();
  const shasum = crypto.createHmac('sha256', secret || '');
  shasum.update(JSON.stringify(body));
  const digest = shasum.digest('hex');

  if (digest === signature) {
    const event = body.event;
    if (event === 'order.paid') {
      const order = body.payload.order.entity;
      const { academyId, planName } = order.notes;
      const paymentId = body.payload.payment.entity.id;
      
      try {
        await BillingService.handleSuccessfulPayment(academyId, planName, order.id, paymentId);
      } catch (err) {
        console.error('Webhook processing error:', err);
        return NextResponse.json({ message: 'Handler failed' }, { status: 500 });
      }
    }
    return NextResponse.json({ status: 'ok' });
  } else {
    return NextResponse.json({ message: 'Invalid signature' }, { status: 400 });
  }
}
