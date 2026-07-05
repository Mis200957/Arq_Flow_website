import "server-only";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePassword } from "@/lib/utils";
import {
  sendWhatsAppText,
  botReadyMessage,
  normalizeMsisdn,
} from "@/lib/evolution";
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
      client_notified?: boolean;
      client_notify_error?: string | null;
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

  // Subscription-change payments (renewal / upgrade / top-up) on an already
  // provisioned business (has an owner) apply directly — top up the wallet,
  // adopt the new plan, no re-provisioning and no new credentials. This also
  // reactivates a business whose wallet had lapsed. The initial 'setup' payment
  // keeps the full activation + Bot Factory flow below, unchanged.
  if (payment.payment_type !== "setup" && business.owner_id) {
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
  const tokenBudget = Number(
    plan.token_budget_egp ?? Number(plan.monthly_fee_egp) - Number(plan.margin_egp ?? 0)
  );
  // Subscription runs for one calendar month (same day next month, e.g. 15th → 15th).
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  const nextEnd = nextBilling.toISOString().slice(0, 10);
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

  // 4b) provision the token wallet: balance_egp = real token budget (price − margin),
  // wallet_egp = customer-facing package credit. Valid for the plan's validity window.
  const { error: topupErr } = await admin.rpc("wallet_topup", {
    b_id: business.id,
    add_budget: tokenBudget,
    add_wallet: Number(plan.monthly_fee_egp),
    new_end: nextEnd,
  });
  if (topupErr) {
    console.error("wallet_topup failed (activation)", topupErr);
    await admin.from("automation_logs").insert({
      business_id: business.id, workflow: "wallet", event: "topup_failed", level: "error",
      payload: { stage: "activation", error: topupErr.message, plan_id: plan.id } as never,
    });
  }

  // 5) gather tenant content for the factory payload
  const [{ data: kb }, { data: products }, { data: services }] = await Promise.all([
    admin.from("knowledge_base").select("kind, category, question, answer, language").eq("business_id", business.id),
    admin.from("products").select("name, description, price_egp").eq("business_id", business.id),
    admin.from("services").select("name, description, price_egp").eq("business_id", business.id),
  ]);

  // 6) trigger n8n Bot Factory
  const factoryUrl = process.env.N8N_FACTORY_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`;
  // Recipient of the "bot ready" WhatsApp message: prefer the dedicated
  // whatsapp_number the client entered, fall back to contact_phone.
  const notifyNumber = business.whatsapp_number || business.contact_phone || null;
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
      tools: plan.tools,
      media_support: plan.media_support,
      // token-wallet billing
      package_price_egp: Number(plan.monthly_fee_egp),
      token_budget_egp: tokenBudget,
      expires_on: nextEnd,
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
    // Credentials to hand to the customer once the bot is ready. Sent to n8n
    // only — the workflow uses them to compose the "bot ready" WhatsApp
    // message at the end of provisioning (after Respond to Webhook). We
    // don't store the plaintext password anywhere; this is the only hop.
    credentials: credentialsIssued
      ? { client_id: business.order_id, email, password, dashboard_url: dashboardUrl }
      : null,
    // Everything the workflow needs to send the "bot ready" WhatsApp itself,
    // without calling back into the platform.
    notify: {
      channel: "whatsapp",
      to: notifyNumber,
      contact_name: business.owner_name ?? business.business_name,
      dashboard_url: dashboardUrl,
      language: (business.languages && business.languages[0]) || "ar",
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
        // Workflow responds via its "Respond to Webhook" node when it FINISHES
        // (~11s observed). Wait long enough to catch completion so the client
        // "bot ready" WhatsApp only fires on real success.
        signal: AbortSignal.timeout(25_000),
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

  // 8) BOT READY → message the client on WhatsApp (Evolution API, agency instance).
  //    Fires only when the Bot Factory workflow finished successfully (i.e. the
  //    n8n "Respond to Webhook" returned OK) AND we just issued fresh credentials.
  //    The plaintext password only exists here in memory, so this is the one
  //    place we can include it — we never persist or forward it.
  let clientNotified = false;
  let clientNotifyError: string | null = null;
  if (credentialsIssued && factoryTriggered) {
    const msisdn = normalizeMsisdn(business.contact_phone ?? business.whatsapp_number);
    if (!msisdn) {
      clientNotifyError = "No client phone number on file";
    } else {
      const wa = await sendWhatsAppText(
        msisdn,
        botReadyMessage({
          clientId: business.order_id,
          email,
          password,
          loginUrl: `${process.env.NEXT_PUBLIC_APP_URL}/login`,
        })
      );
      clientNotified = wa.ok;
      if (!wa.ok) clientNotifyError = wa.error ?? "send failed";
    }
    await admin.from("automation_logs").insert({
      business_id: business.id,
      workflow: "onboarding",
      event: clientNotified ? "whatsapp_sent" : "whatsapp_failed",
      level: clientNotified ? "info" : "error",
      payload: { order_id: business.order_id, to: msisdn, error: clientNotifyError } as never,
    });
  }

  return {
    ok: true,
    credentials: credentialsIssued ? { client_id: business.order_id, email, password } : null,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    factory_triggered: factoryTriggered,
    factory_error: factoryError,
    client_notified: clientNotified,
    client_notify_error: clientNotifyError,
  };
}

/**
 * Apply a subscription-change payment (renewal / upgrade / downgrade / top-up)
 * to an already-provisioned business. Tops up the token wallet (unused balance
 * rolls over), adopts the target plan, extends validity, reactivates the
 * business, writes the invoice, notifies the client, and signals n8n to sync
 * the running bot config — all automatically on admin approval. No
 * re-provisioning and no new credentials.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
async function applySubscriptionPayment(
  payment: any, business: any, plan: any, actorId: string
): Promise<ApproveResult> {
  const admin = createAdminClient();
  const now = new Date().toISOString();

  const tokenBudget = Number(
    plan.token_budget_egp ?? Number(plan.monthly_fee_egp) - Number(plan.margin_egp ?? 0)
  );
  const isPlanChange = String(plan.id) !== String(business.plan_id);
  // Capture pre-renewal status: if the bot was suspended (subscription expired
  // → n8n had unpublished it), we need to call n8n back to re-publish after
  // the wallet is topped up and the business flips back to 'active'.
  const wasSuspended = business.status === "suspended";

  // New billing window = one calendar month from today (same day next month).
  const nextBilling = new Date();
  nextBilling.setMonth(nextBilling.getMonth() + 1);
  const newEnd = nextBilling.toISOString().slice(0, 10);

  // Top up the wallet — the DB function rolls over any unused balance and
  // resets the validity window to one month from today.
  const { data: walletRows, error: topupErr } = await admin.rpc("wallet_topup", {
    b_id: business.id,
    add_budget: tokenBudget,
    add_wallet: Number(plan.monthly_fee_egp),
    new_end: newEnd,
  });
  if (topupErr) {
    console.error("wallet_topup failed (subscription)", topupErr);
    await admin.from("automation_logs").insert({
      business_id: business.id, workflow: "wallet", event: "topup_failed", level: "error",
      payload: { stage: "renewal_upgrade", error: topupErr.message, plan_id: plan.id, payment_id: payment.id } as never,
    });
    return { ok: false, status: 500, error: `Wallet top-up failed: ${topupErr.message}` };
  }
  const wallet = Array.isArray(walletRows) ? walletRows[0] : walletRows;
  const periodEnd = wallet?.period_end ?? newEnd;

  // Wallet credited successfully → now mark the payment approved.
  await admin.from("payments")
    .update({ status: "approved", reviewed_by: actorId, reviewed_at: now })
    .eq("id", payment.id);

  // Adopt the (possibly new) plan, reactivate, set next billing to wallet expiry.
  const bizUpdate: TablesUpdate<"businesses"> = {
    plan_id: plan.id,
    monthly_fee_egp: plan.monthly_fee_egp,
    next_billing_date: periodEnd,
    status: "active",
  };
  await admin.from("businesses").update(bizUpdate).eq("id", business.id);

  await admin.from("subscriptions").update({
    plan_id: plan.id, status: "active",
    current_period_end: periodEnd,
  }).eq("business_id", business.id);

  const invoiceNumber = `INV-${now.slice(2, 7).replace("-", "")}-${String(business.order_id ?? "").slice(-4)}`;
  await admin.from("invoices").insert({
    business_id: business.id, number: invoiceNumber, payment_id: payment.id,
    amount_egp: payment.amount_egp, tax_egp: 0, total_egp: payment.amount_egp,
    status: "paid", paid_at: now,
  });

  // signal n8n to sync the running bot's plan + wallet (reuses automation router)
  await admin.from("automation_logs").insert({
    business_id: business.id, workflow: "bot_config_sync",
    event: isPlanChange ? "plan_change" : "renewal", level: "info",
    payload: {
      plan_id: plan.id, payment_id: payment.id,
      balance_egp: wallet?.balance_egp ?? null, wallet_egp: wallet?.wallet_egp ?? null,
      expires_on: periodEnd,
      prior_status: business.status ?? null,
      was_suspended: wasSuspended,
    },
  });

  await admin.from("notifications").insert({
    user_id: business.owner_id, business_id: business.id, type: "subscription_applied",
    title: "تم تفعيل اشتراكك ✅",
    body: `${isPlanChange ? "الباقة: " + (plan.name_ar ?? plan.name) + " — " : ""}رصيدك اتجدد، صالح حتى ${periodEnd}`,
    link: "/dashboard/subscription",
  });

  await admin.from("audit_logs").insert({
    actor_id: actorId, action: "subscription.apply", entity: "payments",
    entity_id: payment.id,
    diff: { plan: plan.id, plan_change: isPlanChange, balance_egp: wallet?.balance_egp ?? null, expires_on: periodEnd },
  });

  // Always notify n8n on a renewal/upgrade payment — n8n decides whether the
  // bot needs republishing (was suspended) or just a config refresh (still
  // active). We pass `was_suspended` so n8n can branch without re-querying
  // Supabase. Fire-and-log: a failure here doesn't roll back the renewal,
  // ops can retry from the automation_logs row.
  const publishUrl =
    process.env.N8N_PUBLISH_AFTER_RENEW_URL
    ?? "https://bc1b1373.kube-ops.com/webhook/publish_bot_after_renew";
  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
  const publishPayload = {
    event: "publish_bot_after_renew",
    source: "arqflow-platform",
    was_suspended: wasSuspended,
    prior_status: business.status ?? null,
    business_id: business.id,
    order_id: business.order_id,
    client_id: business.order_id,
    plan_id: plan.id,
    workflow_id: business.workflow_id ?? null,
    webhook_path: business.webhook_path ?? null,
    instance_name: business.instance_name ?? null,
    whatsapp_number: business.whatsapp_number ?? null,
    wallet: {
      balance_egp: wallet?.balance_egp ?? null,
      wallet_egp: wallet?.wallet_egp ?? null,
      expires_on: periodEnd,
    },
    payment_id: payment.id,
  };
  let publishOk = false;
  let publishStatus: number | null = null;
  let publishError: string | null = null;
  try {
    const signature = crypto
      .createHmac("sha256", secret)
      .update(JSON.stringify(publishPayload))
      .digest("hex");
    const res = await fetch(publishUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-ArqFlow-Signature": signature },
      body: JSON.stringify(publishPayload),
      signal: AbortSignal.timeout(15_000),
    });
    publishOk = res.ok;
    publishStatus = res.status;
    if (!res.ok) publishError = `publish_bot_after_renew returned ${res.status}`;
  } catch (e) {
    publishError = e instanceof Error ? e.message : "publish_bot_after_renew unreachable";
  }
  // Also surface to server logs so Vercel function logs show the call.
  console.log("publish_bot_after_renew", {
    business_id: business.id, was_suspended: wasSuspended, ok: publishOk,
    status: publishStatus, error: publishError, url: publishUrl,
  });
  await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: "bot_publish",
    event: publishOk ? "published_after_renew" : "publish_after_renew_failed",
    level: publishOk ? "info" : "error",
    payload: {
      payment_id: payment.id, plan_id: plan.id,
      was_suspended: wasSuspended, http_status: publishStatus, error: publishError,
    } as never,
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
