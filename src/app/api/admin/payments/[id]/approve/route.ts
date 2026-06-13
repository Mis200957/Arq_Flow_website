import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generatePassword } from "@/lib/utils";

/**
 * POST /api/admin/payments/:id/approve
 * Admin-only. Approves a payment, generates client credentials,
 * activates the subscription, and triggers n8n Bot Factory provisioning.
 * Returns the generated credentials for one-time display.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // verify admin session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const admin = createAdminClient();

  const { data: payment } = await admin
    .from("payments")
    .select("*, businesses(*), plans(*)")
    .eq("id", id)
    .single();
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "pending") {
    return NextResponse.json({ error: `Payment already ${payment.status}` }, { status: 409 });
  }

  const business = payment.businesses;
  const plan = payment.plans;
  if (!business || !plan) {
    return NextResponse.json({ error: "Orphaned payment" }, { status: 500 });
  }

  // 1) approve payment
  await admin
    .from("payments")
    .update({ status: "approved", reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", id);

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
      // possibly exists already — look up
      const { data: list } = await admin.auth.admin.listUsers();
      const existing = list?.users.find((u) => u.email === email);
      if (existing) {
        ownerId = existing.id;
        await admin.auth.admin.updateUserById(existing.id, { password });
        credentialsIssued = true;
      } else {
        return NextResponse.json({ error: `Could not create user: ${createErr?.message}` }, { status: 500 });
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
    payment_id: id,
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
      // n8n keeps its own service-role credential; we only send the ref
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
    actor_id: user.id,
    action: "payment.approve",
    entity: "payments",
    entity_id: id,
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

  return NextResponse.json({
    ok: true,
    credentials: credentialsIssued ? { client_id: business.order_id, email, password } : null,
    dashboard_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
    factory_triggered: factoryTriggered,
    factory_error: factoryError,
  });
}
