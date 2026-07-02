import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/admin/clients/:id/activate
 * Admin final confirmation at the end of the provisioning flow.
 *
 * Runs the internal review checks and, if they pass, flips the business to
 * 'active'. The client's provisioning screen (polling /provisioning/status)
 * advances to the dashboard automatically. No automatic "bot is ready"
 * message is sent to the client — the admin contacts them personally.
 *
 * Checks (all must pass unless ?force=1):
 *   1. workflow_id present            (bot workflow created in n8n)
 *   2. instance_name present          (Evolution instance created)
 *   3. instances.evolution_status === 'connected' (WhatsApp linked)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const force = req.nextUrl.searchParams.get("force") === "1";
  const db = createAdminClient();

  const { data: business } = await db
    .from("businesses")
    .select("id, status, business_name, order_id, owner_id, workflow_id, instance_name")
    .eq("id", id)
    .single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  const { data: instance } = await db
    .from("instances")
    .select("evolution_status, connected_number")
    .eq("business_id", id)
    .maybeSingle();

  const checks = {
    workflow_created: !!business.workflow_id,
    instance_created: !!business.instance_name,
    whatsapp_connected: instance?.evolution_status === "connected",
  };
  const allPassed = Object.values(checks).every(Boolean);

  if (!allPassed && !force) {
    return NextResponse.json(
      { error: "Checks failed", checks },
      { status: 409 }
    );
  }

  await db
    .from("businesses")
    .update({
      status: "active",
      activated_at: new Date().toISOString(),
      health_status: "healthy",
      last_health_check: new Date().toISOString(),
    })
    .eq("id", id);

  // Dashboard notification only (no automatic "bot ready" WhatsApp message —
  // the admin informs the client personally).
  if (business.owner_id) {
    await db.from("notifications").insert({
      user_id: business.owner_id,
      business_id: id,
      type: "bot_activated",
      title: "تم تفعيل البوت ✅",
      body: "مساعدك الذكي شغال دلوقتي على رقم الواتساب المرتبط.",
      link: "/dashboard/overview",
    });
  }

  await db.from("audit_logs").insert({
    actor_id: user.id,
    action: "business.activate",
    entity: "businesses",
    entity_id: id,
    diff: { checks, forced: !allPassed },
  });
  await db.from("automation_logs").insert({
    business_id: id,
    workflow: "provisioning",
    event: "admin_final_activation",
    level: "info",
    payload: { checks, forced: !allPassed, actor: user.id },
  });

  return NextResponse.json({ success: true, checks, forced: !allPassed });
}
