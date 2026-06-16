import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePassword } from "@/lib/utils";
import type { TablesUpdate } from "@/lib/database.types";

/**
 * Shared payment review logic. Used by BOTH the admin dashboard API routes
 * and the Telegram webhook so the two paths behave identically.
 *
 * Callers are responsible for authorization (admin session OR verified
 * Telegram secret). `actorId` is the admin profile/user id recorded on the
 * payment and in audit logs.
 */

export type ApproveResult =
  | {
      ok: true;
      credentials: { client_id: string; email: string; password: string } | null;
      dashboard_url: string;
      factory_triggered: boolean;
      factory_error: string | null;
    }
  | { ok: false; status: number; error: string };

export type RejectResult =
  | { ok: true; orderId: string; businessName: string }
  | { ok: false; status: number; error: string };

/** Approve a pending payment: issue credentials, activate, trigger n8n factory. */
export async function approvePayment(paymentId: string, actorId: string): Promise<ApproveResult> {
  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("*, businesses(*), plans(*)")
    .eq("id", paymentId)
    .single();
  if (!payment) return { ok: false, status: 404, error: "Payment not found" };
  if (payment.status !== "pending") {
    return { ok: false, status: 409, error: `Payment already ${payment.status}` };
  }

  const business = payment.businesses;
  const plan = payment.plans;
  if (!business || !plan) return { ok: false, status: 500, error: "Orphaned payment" };

  // Subscription-change payments (upgrade / renewal / extra messages) on an
  // already-active business apply directly — update plan/quota/limits, no
  // re-provisioning and no new credentials. The initial 'setup' payment keeps
  // the full activation + Bot Factory flow below, unchanged.
  if (payment.payment_type !== "setup" && business.owner_id && business.status === "active") {
    return applySubscriptionPayment(payment, business, plan, actorId);
  }

  // 1) approve payment
  await admin
    .from("payments")
    .update({ status: "approved", reviewed_by: actorId, reviewed_at: new Date().toISOString() })
    .eq("id", paymentId);

  // 2) client credentials — create or reuse auth user
  const email = business.contact_email ?? `${business.order_id.toLowerCase()}@clients.arqflow.app`;
  const password = generatePassword();
  let ownerId = business.owner_id;
  let credentialsIssued = false;

  if (!ownerId) {
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: business.owner_name ?? business.business_name, role: "client" },
    });
    if (createErr || !created.user) {
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (existing) {
        ownerId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, { password });
        credentialsIssued = true;
      } else {
        return { ok: false, status: 500, error: `Could not create user: ${createErr?.message}` };
      }
    } else {
      ownerId = created.user.id;
      credentialsIssued = true;
    }
    await admin.from("profiles").upsert({
      id: ownerId,
      email,
      full_name: business.owner_name ?? business.business_name,
      phone: business.contact_phone,
      role: "client",
    });
  }

  // 3) business → provisioning, link owner
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  await admin
    .from("businesses")
    .update({
      owner_id: ownerId,
      status: "provisioning",
      paid_at: new Date().toISOString(),
      next_billing_date: nextBilling.toISOString().slice(0, 10),
    })
    .eq("id", business.id);

  // 4) subscription + invoice
  await admin.from("subscriptions").insert({
    business_id: business.id,
    plan_id: plan.id,
    status: "active",
    current_period_start: new Date().toISOString().slice(0, 10),
    current_period_end: nextBilling.toISOString().slice(0, 10),
  });
  const invoiceNumber = `INV-${new Date().toISOString().slice(2, 7).replace("-", "")}-${business.order_id.slice(-4)}`;
  await admin.from("invoices").insert({
    business_id: business.id,
    number: invoiceNumber,
    payment_id: paymentId,
    amount_egp: payment.amount_egp,
    tax_egp: 0,
    total_egp: payment.amount_egp,
    status: "paid",
    paid_at: new Date().toISOString(),
  });

  // 5) gather tenant content for the factory payload
  const [{ data: kb }, { data: products }, { data: services }] = await Promise.all([
    admin.from("knowledge_base").select("kind, category, question, answer, language").eq("business_id", business.id),
    admin.from("products").select("name, description, price_egp").eq("business_id", business.id),
    admin.from("services").select("name, description, price_egp").eq("business_id", business.id),
  ]);

  // 6) trigger n8n Bot Factory
  const factoryUrl = process.env.N8N_FACTORY_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
  const payload = {
    event: "provision_bot",
    source: "arqflow-platform",
    business_id: business.id,
    order_id: business.order_id,
    client_id: business.order_id,
    plan_id: plan.id,
    plan: {
      tier: plan.id,
      model: plan.ai_model,
      fallback_model: plan.fallback_model,
      max_tokens: plan.max_tokens,
      memory_window: plan.memory_window,
      message_limit: plan.message_limit,
      tools: plan.tools,
      media_support: plan.media_support,
    },
    business: {
      business_name: business.business_name,
      business_type: business.business_type,
      description: business.description,
      contact_name: business.owner_name,
      contact_email: email,
      contact_number: business.contact_phone,
      whatsapp_number: business.whatsapp_number,
      primary_goal: business.primary_goal,
      tone_of_voice: business.tone_of_voice,
      fallback_behavior: business.fallback_behavior,
      greeting_message: business.greeting_message,
      assistant_personality: business.assistant_personality,
      working_hours: business.working_hours,
      location: business.location || business.address,
      payment_methods: business.payment_methods,
      policy: business.policy,
      delivery_info: business.delivery_info,
      return_policy: business.return_policy,
      order_instructions: business.order_instructions,
      languages: business.languages,
      knowledge_base: business.knowledge_base_raw,
    },
    content: { faqs: kb ?? [], products: products ?? [], services: services ?? [] },
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      project_ref: "zjathejcdkpxjyvululp",
    },
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/n8n/callback`,
  };

  let factoryTriggered = false;
  let factoryError: string | null = null;
  if (factoryUrl) {
    try {
      const signature = crypto.createHmac("sha256", secret).update(JSON.stringify(payload)).digest("hex");
      const res = await fetch(factoryUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-ArqFlow-Signature": signature },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15_000),
      });
      factoryTriggered = res.ok;
      if (!res.ok) factoryError = `Factory webhook returned ${res.status}`;
    } catch (e) {
      factoryError = e instanceof Error ? e.message : "Factory webhook unreachable";
    }
  } else {
    factoryError = "N8N_FACTORY_WEBHOOK_URL not configured";
  }

  // 7) logs + notifications
  await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: "provisioning",
    event: factoryTriggered ? "factory_triggered" : "factory_trigger_failed",
    level: factoryTriggered ? "info" : "error",
    payload: { order_id: business.order_id, error: factoryError },
  });
  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action: "payment.approve",
    entity: "payments",
    entity_id: paymentId,
    diff: { business: business.order_id, amount: payment.amount_egp },
  });
  if (ownerId) {
    await admin.from("notifications").insert({
      user_id: ownerId,
      business_id: business.id,
      type: "payment_approved",
      title: "Payment approved — your AI agent is being set up",
      body: "You'll receive your WhatsApp QR code shortly.",
      link: "/dashboard",
    });
  }

  return {
    ok: true,
    credentials: credentialsIssued ? { client_id: business.order_id, email, password } : null,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    factory_triggered: factoryTriggered,
    factory_error: factoryError,
  };
}

/**
 * Apply a subscription-change payment (upgrade / downgrade / renewal / extra
 * messages) to an already-active business. Updates plan, quota, limits,
 * subscription, invoice, notifies the client, and signals n8n to sync the bot
 * config — all automatically on admin approval. No re-provisioning.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
async function applySubscriptionPayment(
  payment: any, business: any, plan: any, actorId: string
): Promise<ApproveResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  await admin.from("payments")
    .update({ status: "approved", reviewed_by: actorId, reviewed_at: now })
    .eq("id", payment.id);

  // latest usage counter (authoritative quota for the current period)
  const { data: counter } = await admin
    .from("usage_counters").select("*").eq("business_id", business.id)
    .order("period_start", { ascending: false }).limit(1).maybeSingle();

  const notes = String(payment.notes ?? "");
  const isExtra = /extra/i.test(notes);
  const bizUpdate: TablesUpdate<"businesses"> = {};
  let newLimit = counter?.message_limit ?? plan.message_limit;

  if (isExtra) {
    const m = notes.match(/(\d{3,6})/);
    const add = m ? parseInt(m[1], 10) : plan.message_limit;
    newLimit = (counter?.message_limit ?? plan.message_limit) + add;
  } else {
    // plan change or renewal → adopt the plan's tier + limit + fee
    bizUpdate.plan_id = plan.id;
    bizUpdate.monthly_fee_egp = plan.monthly_fee_egp;
    newLimit = plan.message_limit;
  }

  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  bizUpdate.next_billing_date = nextBilling.toISOString().slice(0, 10);
  await admin.from("businesses").update(bizUpdate).eq("id", business.id);

  if (counter) {
    await admin.from("usage_counters").update({ message_limit: newLimit }).eq("id", counter.id);
  }

  await admin.from("subscriptions").update({
    plan_id: plan.id, status: "active",
    current_period_end: nextBilling.toISOString().slice(0, 10),
  }).eq("business_id", business.id);

  const invoiceNumber = `INV-${now.slice(2, 7).replace("-", "")}-${String(business.order_id ?? "").slice(-4)}`;
  await admin.from("invoices").insert({
    business_id: business.id, number: invoiceNumber, payment_id: payment.id,
    amount_egp: payment.amount_egp, tax_egp: 0, total_egp: payment.amount_egp,
    status: "paid", paid_at: now,
  });

  // signal n8n to sync the running bot's plan/limit (reuses automation router)
  await admin.from("automation_logs").insert({
    business_id: business.id, workflow: "bot_config_sync",
    event: isExtra ? "extra_messages" : "plan_change", level: "info",
    payload: { plan_id: plan.id, message_limit: newLimit, payment_id: payment.id },
  });

  await admin.from("notifications").insert({
    user_id: business.owner_id, business_id: business.id, type: "subscription_applied",
    title: "Subscription updated ✅",
    body: `${isExtra ? "Extra messages added" : "Plan: " + (plan.name_ar ?? plan.name)} — limit ${newLimit.toLocaleString()}`,
    link: "/dashboard/subscription",
  });

  await admin.from("audit_logs").insert({
    actor_id: actorId, action: "subscription.apply", entity: "payments",
    entity_id: payment.id, diff: { plan: plan.id, message_limit: newLimit, extra: isExtra },
  });

  return {
    ok: true, credentials: null,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    factory_triggered: false, factory_error: null,
  };
}
/* eslint-enable @typescript-eslint/no-explicit-any */

/** Reject a pending payment with an optional reason. */
export async function rejectPayment(
  paymentId: string,
  actorId: string,
  reason: string
): Promise<RejectResult> {
  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, status, business_id, businesses(order_id, business_name)")
    .eq("id", paymentId)
    .single();
  if (!payment) return { ok: false, status: 404, error: "Payment not found" };
  if (payment.status !== "pending") {
    return { ok: false, status: 409, error: `Payment already ${payment.status}` };
  }

  await admin
    .from("payments")
    .update({
      status: "rejected",
      reviewed_by: actorId,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq("id", paymentId);

  await admin
    .from("businesses")
    .update({ status: "pending_payment", internal_notes: `Payment rejected: ${reason || "no reason given"}` })
    .eq("id", payment.business_id);

  await admin.from("audit_logs").insert({
    actor_id: actorId,
    action: "payment.reject",
    entity: "payments",
    entity_id: paymentId,
    diff: { reason },
  });

  const biz = payment.businesses as { order_id?: string; business_name?: string } | null;
  return { ok: true, orderId: biz?.order_id ?? "", businessName: biz?.business_name ?? "" };
}
