import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { notify } from "@/lib/notify";
import { z } from "zod";

/**
 * POST /api/dashboard/subscription
 * In-platform self-service subscription actions. Records the request,
 * notifies admins (who confirm payment via the existing manual flow),
 * and confirms to the client — no WhatsApp/manual contact required to
 * START the change. The change applies on admin payment approval.
 */
const schema = z.object({
  action: z.enum(["change_plan", "renew", "extra_messages", "addon", "cancel"]),
  plan_id: z.enum(["starter", "business", "enterprise"]).optional(),
  pack: z.string().max(60).optional(),
});

const COPY: Record<string, { ar: string; en: string }> = {
  change_plan: { ar: "طلب تغيير الباقة", en: "Plan change request" },
  renew: { ar: "طلب تجديد الاشتراك", en: "Renewal request" },
  extra_messages: { ar: "طلب شراء رسائل إضافية", en: "Extra messages request" },
  addon: { ar: "طلب إضافة خدمة", en: "Add-on request" },
  cancel: { ar: "طلب إلغاء الاشتراك", en: "Cancellation request" },
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const d = parsed.data;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, owner_id, plan_id, business_name, contact_email, whatsapp_number")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const admin = createAdminClient();
  const detail = [d.plan_id, d.pack].filter(Boolean).join(" ");

  await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: "subscription_request",
    event: d.action,
    level: "info",
    payload: {
      action: d.action, current_plan: business.plan_id, plan_id: d.plan_id ?? null,
      pack: d.pack ?? null, requested_by: user.id,
    } as never,
  });

  // Notify admins to action it.
  const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((a) => ({
        user_id: a.id,
        business_id: business.id,
        type: "subscription_request",
        title: `${COPY[d.action].en}: ${business.business_name}`,
        body: detail || d.action,
        link: "/admin/payments",
      }))
    );
  }

  // Confirm to the client (in-app).
  await notify(admin, {
    user_id: business.owner_id ?? user.id,
    business_id: business.id,
    type: "subscription_request",
    title: COPY[d.action].en,
    body: COPY[d.action].ar + (detail ? ` — ${detail}` : ""),
    link: "/dashboard/subscription",
    channels: ["dashboard"],
  });

  return NextResponse.json({ ok: true, requested: d.action });
}
