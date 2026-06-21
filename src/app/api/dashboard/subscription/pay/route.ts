import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { notifyNewPayment } from "@/lib/telegram";
import { z } from "zod";

/**
 * POST /api/dashboard/subscription/pay
 * Self-service RENEWAL / UPGRADE payment — uses the exact same manual-transfer
 * flow as first-time onboarding: the client transfers, enters the 12-digit
 * transaction reference and uploads the receipt screenshot; we record a pending
 * payment and notify the admin on Telegram (with Approve / Reject buttons).
 *
 * On admin approval the wallet is topped up automatically (see approvePayment →
 * applySubscriptionPayment). NO setup fee on renewal/upgrade — package price only.
 */
const schema = z.object({
  plan_id: z.enum(["starter", "business", "enterprise"]),
  payment_method: z.enum(["instapay", "vodafone_cash", "wepay"]),
  transaction_ref: z.string().regex(/^\d{12}$/, "Transaction reference must be exactly 12 digits"),
  screenshot_path: z.string().min(1).max(500),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }
  const d = parsed.data;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, order_id, plan_id, business_name, business_type, owner_name, contact_phone")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();

  // Target plan (renewal = same plan, upgrade/downgrade = different plan) + current plan.
  const [{ data: plan }, { data: currentPlan }] = await Promise.all([
    admin.from("plans").select("id, name, name_ar, monthly_fee_egp, setup_fee_egp, tier_level").eq("id", d.plan_id).single(),
    admin.from("plans").select("setup_fee_egp, tier_level").eq("id", business.plan_id).single(),
  ]);
  if (!plan) return NextResponse.json({ error: "Unknown plan" }, { status: 422 });

  const isUpgrade = d.plan_id !== business.plan_id;
  // Renewal = package (token) price only. Upgrade = setup-fee DIFFERENCE + new package price.
  // (No setup-fee refund on a downgrade → difference floored at 0.)
  const setupDiff = isUpgrade
    ? Math.max(0, Number(plan.setup_fee_egp) - Number(currentPlan?.setup_fee_egp ?? 0))
    : 0;
  const amount = setupDiff + Number(plan.monthly_fee_egp);

  // idempotency: same transaction_ref already pending/approved → reject duplicate
  const { data: dupe } = await admin
    .from("payments")
    .select("id")
    .eq("transaction_ref", d.transaction_ref)
    .in("status", ["pending", "approved"])
    .maybeSingle();
  if (dupe) {
    return NextResponse.json(
      { error: "This transaction reference was already submitted" },
      { status: 409 }
    );
  }

  const { data: paymentRow, error: payErr } = await admin
    .from("payments")
    .insert({
      business_id: business.id,
      plan_id: d.plan_id,
      payment_type: isUpgrade ? "upgrade" : "renewal",
      method: d.payment_method,
      amount_egp: amount,
      transaction_ref: d.transaction_ref,
      screenshot_path: d.screenshot_path,
      status: "pending",
      notes: isUpgrade
        ? `Upgrade to ${plan.id} — setup diff ${setupDiff} + package ${plan.monthly_fee_egp}`
        : `Renewal of ${plan.id} — package ${plan.monthly_fee_egp}`,
    })
    .select("id")
    .single();
  if (payErr || !paymentRow) {
    console.error("subscription payment insert failed", payErr);
    return NextResponse.json({ error: "Could not record payment" }, { status: 500 });
  }

  // file record for the receipt
  await admin.from("business_files").insert({
    business_id: business.id,
    kind: "payment_screenshot",
    bucket: "payment-screenshots",
    storage_path: d.screenshot_path,
    file_name: d.screenshot_path.split("/").pop() ?? d.screenshot_path,
  });

  // notify admins in-app
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        business_id: business.id,
        type: "payment_pending",
        title: `${isUpgrade ? "Upgrade" : "Renewal"} payment pending: ${business.business_name}`,
        body: `${plan.id} — ${amount} EGP — ref ${d.transaction_ref}`,
        link: "/admin/payments",
      }))
    );
  }

  await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: "subscription_request",
    event: isUpgrade ? "upgrade" : "renew",
    level: "info",
    payload: { plan_id: d.plan_id, amount, transaction_ref: d.transaction_ref, requested_by: user.id } as never,
  });

  // Telegram: notify admin with screenshot + Approve/Reject (same as onboarding).
  try {
    let screenshotUrl: string | null = null;
    const { data: signed } = await admin.storage
      .from("payment-screenshots")
      .createSignedUrl(d.screenshot_path, 3600);
    screenshotUrl = signed?.signedUrl ?? null;

    await notifyNewPayment({
      paymentId: paymentRow.id,
      orderId: business.order_id,
      businessName: business.business_name,
      businessType: business.business_type,
      planId: `${plan.id} (${isUpgrade ? "ترقية" : "تجديد"})`,
      amountEgp: amount,
      method: d.payment_method,
      contactName: business.owner_name,
      contactPhone: business.contact_phone,
      transactionRef: d.transaction_ref,
      screenshotUrl,
    });
  } catch (e) {
    console.error("telegram notify failed", e);
  }

  return NextResponse.json({ ok: true, payment_id: paymentRow.id, intent: isUpgrade ? "upgrade" : "renewal" });
}
