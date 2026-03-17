import { NextRequest, NextResponse } from "next/server";
import { getServerUser, authResponse } from "@/src/lib/auth";
import { BillingService } from "@/src/services/billingService";
import { query } from "@/src/lib/db";
import config from "@/src/lib/config";
import { v4 as uuidv4 } from "uuid";

export async function POST(req: NextRequest) {
  const user = await getServerUser(req);
  if (!user) return authResponse("Unauthorized");
  if (!["academy_admin", "super_admin"].includes(user.role))
    return authResponse("Forbidden", 403);

  try {
    const { planName, academyId } = await req.json();
    if (!planName || !academyId) {
      return NextResponse.json(
        { message: "Missing planName or academyId" },
        { status: 400 },
      );
    }

    const { order, plan } = await BillingService.createSubscriptionOrder(
      academyId,
      planName,
    );

    await query(
      `INSERT INTO invoices (id, academy_id, amount, status, description, razorpay_order_id, created_at)
       VALUES ($1, $2, $3, 'pending', $4, $5, NOW())
       ON CONFLICT DO NOTHING`,
      [
        uuidv4(),
        academyId,
        plan.price_monthly,
        `${plan.name} Plan - Monthly`,
        order.id,
      ],
    );

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: config.razorpay.keyId,
      planName: plan.name,
      planPrice: plan.price_monthly,
    });
  } catch (error: any) {
    const message =
      error.message ||
      (typeof error === "string" ? error : JSON.stringify(error)) ||
      "Failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
