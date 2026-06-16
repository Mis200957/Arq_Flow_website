import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import type { Json } from "@/lib/database.types";

/**
 * POST /api/dashboard/usage/check
 * Evaluates the caller's current usage against 75/90/100% thresholds.
 * For each newly-crossed threshold (once per billing period) it:
 *   - inserts a dashboard notification, and
 *   - logs an automation event so n8n can fan it out to WhatsApp + email.
 * Idempotent: a threshold is only fired once per period.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, owner_id, business_name, contact_phone, whatsapp_number, contact_email")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: counter } = await supabase
    .from("usage_counters")
    .select("messages_used, message_limit, period_start, period_end")
    .eq("business_id", business.id)
    .order("period_start", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!counter || !counter.message_limit) {
    return NextResponse.json({ ok: true, pct: 0, fired: [] });
  }

  const pct = Math.round((counter.messages_used / counter.message_limit) * 100);
  const admin = createAdminClient();
  const fired: number[] = [];

  const COPY: Record<number, { ar: string; en: string }> = {
    75: { ar: "وصلت رسائلك إلى 75% من الحد الشهري", en: "You've used 75% of your monthly messages" },
    90: { ar: "وصلت رسائلك إلى 90% — قد تنفد قريباً", en: "You've used 90% — messages may run out soon" },
    100: { ar: "نفدت رسائلك لهذا الشهر — قم بالترقية أو شراء رسائل إضافية", en: "You're out of messages this month — upgrade or buy extra" },
  };

  for (const th of [75, 90, 100]) {
    if (pct < th) continue;
    const type = `usage_${th}`;
    // already fired this period?
    const { data: existing } = await admin
      .from("notifications")
      .select("id")
      .eq("user_id", business.owner_id ?? user.id)
      .eq("type", type)
      .gte("created_at", counter.period_start)
      .maybeSingle();
    if (existing) continue;

    await admin.from("notifications").insert({
      user_id: business.owner_id ?? user.id,
      business_id: business.id,
      type,
      title: COPY[th].en,
      body: COPY[th].ar,
      link: "/dashboard/usage",
    });

    await admin.from("automation_logs").insert({
      business_id: business.id,
      workflow: "usage_threshold",
      event: `threshold_${th}`,
      level: th >= 100 ? "warn" : "info",
      payload: {
        threshold: th, pct,
        messages_used: counter.messages_used, message_limit: counter.message_limit,
        period_start: counter.period_start, period_end: counter.period_end,
        channels: ["dashboard", "whatsapp", "email"],
        whatsapp: business.whatsapp_number ?? business.contact_phone ?? null,
        email: business.contact_email ?? null,
        title_en: COPY[th].en, title_ar: COPY[th].ar,
      } as unknown as Json,
    });
    fired.push(th);
  }

  return NextResponse.json({ ok: true, pct, fired });
}
