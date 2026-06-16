import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { buildIndustryPromptContext } from "@/lib/modules/ai";
import { notify } from "@/lib/notify";
import type { TablesUpdate } from "@/lib/database.types";
import { z } from "zod";

/**
 * POST /api/dashboard/ai
 * Unified AI-management endpoint for the client dashboard.
 *
 * Direct DB writes (no automation needed):
 *   - update_profile: system_prompt / personality / tone / greeting / instructions
 *
 * Automation jobs (logged for n8n to process in the background):
 *   - regenerate_prompt | rebuild_kb | retrain | restart_context
 * Each job records an automation_logs row + a dashboard notification,
 * and is fanned out by n8n. Idempotency/queueing handled by n8n.
 */
const schema = z.object({
  action: z.enum(["update_profile", "regenerate_prompt", "rebuild_kb", "retrain", "restart_context"]),
  system_prompt: z.string().max(20000).optional(),
  assistant_personality: z.string().max(2000).optional(),
  tone_of_voice: z.enum(["formal", "friendly", "egyptian"]).optional(),
  greeting_message: z.string().max(1000).optional(),
  fallback_behavior: z.enum(["handover", "collect", "apologize"]).optional(),
});

const JOB_COPY: Record<string, { wf: string; ar: string; en: string }> = {
  regenerate_prompt: { wf: "regenerate_system_prompt", ar: "جارٍ إعادة توليد البرومبت", en: "Regenerating AI prompt" },
  rebuild_kb: { wf: "kb_rebuild", ar: "جارٍ إعادة بناء قاعدة المعرفة", en: "Rebuilding knowledge base" },
  retrain: { wf: "ai_retrain", ar: "جارٍ إعادة تدريب المساعد", en: "Retraining the assistant" },
  restart_context: { wf: "ai_restart_context", ar: "تمت إعادة ضبط ذاكرة المحادثات", en: "Conversation context reset" },
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed" }, { status: 422 });
  const d = parsed.data;

  const { data: business } = await supabase
    .from("businesses")
    .select("id, owner_id, business_type, whatsapp_number, contact_phone, contact_email")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // ---- Direct DB write ----
  if (d.action === "update_profile") {
    const patch: TablesUpdate<"businesses"> = {};
    if (d.system_prompt !== undefined) patch.system_prompt = d.system_prompt;
    if (d.assistant_personality !== undefined) patch.assistant_personality = d.assistant_personality;
    if (d.tone_of_voice !== undefined) patch.tone_of_voice = d.tone_of_voice;
    if (d.greeting_message !== undefined) patch.greeting_message = d.greeting_message;
    if (d.fallback_behavior !== undefined) patch.fallback_behavior = d.fallback_behavior;
    if (Object.keys(patch).length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
    const { error } = await supabase.from("businesses").update(patch).eq("id", business.id);
    if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });
    return NextResponse.json({ ok: true, updated: Object.keys(patch) });
  }

  // ---- Automation job ----
  const job = JOB_COPY[d.action];
  const admin = createAdminClient();
  const industry = buildIndustryPromptContext(business.business_type);

  await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: job.wf,
    event: "requested",
    level: "info",
    payload: { requested_by: user.id, business_type: business.business_type, industry } as never,
  });

  await notify(admin, {
    user_id: business.owner_id ?? user.id,
    business_id: business.id,
    type: `ai_${d.action}`,
    title: job.en,
    body: job.ar,
    link: "/dashboard/ai-settings",
    channels: ["dashboard"],
  });

  return NextResponse.json({ ok: true, queued: d.action });
}
