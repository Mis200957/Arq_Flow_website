import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { buildIndustryPromptContext } from "@/lib/modules/ai";
import { resolveCapabilities } from "@/lib/capabilities";
import { notify } from "@/lib/notify";
import type { TablesUpdate } from "@/lib/database.types";
import { z } from "zod";

/**
 * /api/dashboard/ai
 * Unified AI-management endpoint for the client dashboard.
 *
 * POST — actions:
 *   Direct DB writes:
 *     - update_profile: system_prompt / personality / tone / greeting /
 *       fallback / goal / languages. Saving any prompt-source field also
 *       queues a `regenerate_system_prompt` job so n8n rebuilds the bot's
 *       system prompt from the fresh settings:
 *       page → automation_logs → AUTOMATION_ROUTER → SHARED_GENERATE_PROMPT.
 *
 *   Automation jobs (logged for n8n to process in the background):
 *     - regenerate_prompt | rebuild_kb | retrain | restart_context
 *   Each job records an automation_logs row + a dashboard notification,
 *   and is fanned out by n8n. Idempotency/queueing handled by n8n.
 *
 * GET — recent AI automation jobs (+ pending count) for this business so
 * the AI settings page can poll queued → done sync progress.
 */

// businesses.tone_of_voice / fallback_behavior are plain text columns and two
// vocabularies exist in the wild (AI-settings page vs. onboarding wizard) —
// accept both so neither UI 422s.
const schema = z.object({
  action: z.enum(["update_profile", "regenerate_prompt", "rebuild_kb", "retrain", "restart_context"]),
  system_prompt: z.string().max(20000).optional(),
  assistant_personality: z.string().max(2000).optional(),
  tone_of_voice: z.enum(["professional", "friendly", "casual", "formal", "egyptian"]).optional(),
  greeting_message: z.string().max(1000).optional(),
  fallback_behavior: z.enum(["human_handoff", "ask_contact", "apologize", "handover", "collect"]).optional(),
  primary_goal: z.string().max(500).optional(),
  languages: z.array(z.enum(["ar", "en"])).min(1).optional(),
});

// Fields SHARED_GENERATE_PROMPT reads when rebuilding the system prompt.
// A manual system_prompt edit is deliberately excluded — queueing a rebuild
// for it would overwrite the hand-written prompt.
const PROMPT_SOURCES = [
  "tone_of_voice", "greeting_message", "assistant_personality",
  "fallback_behavior", "primary_goal", "languages",
];

// automation_logs workflows surfaced as "AI jobs" on the settings page.
const AI_WORKFLOWS = ["regenerate_system_prompt", "kb_rebuild", "ai_retrain", "ai_restart_context", "kb_file_process"];

const JOB_COPY: Record<string, { wf: string; ar: string; en: string }> = {
  regenerate_prompt: { wf: "regenerate_system_prompt", ar: "جارٍ إعادة توليد البرومبت", en: "Regenerating AI prompt" },
  rebuild_kb: { wf: "kb_rebuild", ar: "جارٍ إعادة بناء قاعدة المعرفة", en: "Rebuilding knowledge base" },
  retrain: { wf: "ai_retrain", ar: "جارٍ إعادة تدريب المساعد", en: "Retraining the assistant" },
  restart_context: { wf: "ai_restart_context", ar: "تمت إعادة ضبط ذاكرة المحادثات", en: "Conversation context reset" },
};

interface BusinessCtx {
  id: string;
  owner_id: string | null;
  business_type: string;
  plan_id: string;
}

/**
 * Queue a `regenerate_system_prompt` job for n8n's AUTOMATION_ROUTER (polls
 * automation_logs every minute). Must run on the admin client — RLS only
 * allows admins to insert automation_logs. Skips when a job is already
 * pending: the rebuild reads the current businesses row, so one queued job
 * already covers any newer edits.
 */
async function queuePromptSync(userId: string, business: BusinessCtx, changed: string[]) {
  const admin = createAdminClient();

  const { data: pending } = await admin
    .from("automation_logs")
    .select("id")
    .eq("business_id", business.id)
    .eq("workflow", "regenerate_system_prompt")
    .is("processed_at", null)
    .limit(1);
  if (pending?.length) return true;

  const { data: plan } = await admin
    .from("plans").select("tier_level, capabilities").eq("id", business.plan_id).single();
  const industry = buildIndustryPromptContext(business.business_type, resolveCapabilities(plan));

  const { error } = await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: "regenerate_system_prompt",
    event: "requested",
    level: "info",
    payload: {
      requested_by: userId,
      trigger: "ai_settings_saved",
      changed,
      business_type: business.business_type,
      industry,
    } as never,
  });
  if (error) return false;

  await notify(admin, {
    user_id: business.owner_id ?? userId,
    business_id: business.id,
    type: "ai_settings_sync",
    title: "Syncing assistant settings to your bot",
    body: "بيتم تحديث البوت بالإعدادات الجديدة",
    link: "/dashboard/ai-settings",
    channels: ["dashboard"],
  });
  return true;
}

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
    .select("id, owner_id, business_type, plan_id, whatsapp_number, contact_phone, contact_email")
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
    if (d.primary_goal !== undefined) patch.primary_goal = d.primary_goal;
    if (d.languages !== undefined) patch.languages = d.languages;
    const updated = Object.keys(patch);
    if (updated.length === 0) return NextResponse.json({ error: "Nothing to update" }, { status: 422 });
    patch.updated_at = new Date().toISOString();
    const { error } = await supabase.from("businesses").update(patch).eq("id", business.id);
    if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 });

    // Bot sync: hand the fresh settings to n8n so the live prompt follows.
    const changed = updated.filter((k) => PROMPT_SOURCES.includes(k));
    const synced = changed.length > 0 ? await queuePromptSync(user.id, business, changed) : false;

    return NextResponse.json({ ok: true, updated, synced });
  }

  // ---- Automation job ----
  const job = JOB_COPY[d.action];
  const admin = createAdminClient();
  const { data: plan } = await supabase
    .from("plans").select("tier_level, capabilities").eq("id", business.plan_id).single();
  const industry = buildIndustryPromptContext(business.business_type, resolveCapabilities(plan));

  const { error: jobError } = await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: job.wf,
    event: "requested",
    level: "info",
    payload: { requested_by: user.id, business_type: business.business_type, industry } as never,
  });
  if (jobError) return NextResponse.json({ error: "Failed to queue job" }, { status: 500 });

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

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, system_prompt")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // RLS: owners can read their own automation_logs (autologs_select).
  const { data: jobs } = await supabase
    .from("automation_logs")
    .select("id, workflow, event, level, created_at, processed_at")
    .eq("business_id", business.id)
    .in("workflow", AI_WORKFLOWS)
    .order("created_at", { ascending: false })
    .limit(10);

  const pending = (jobs ?? []).filter((j) => !j.processed_at).length;
  return NextResponse.json({ jobs: jobs ?? [], pending, system_prompt: business.system_prompt });
}
