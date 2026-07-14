import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { buildIndustryPromptContext } from "@/lib/modules/ai";
import { resolveCapabilities } from "@/lib/capabilities";
import type { Json } from "@/lib/database.types";

/** Legacy endpoint — the AI settings page now posts to /api/dashboard/ai. */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id, business_type, plan_id").eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: plan } = await supabase
    .from("plans").select("tier_level, capabilities").eq("id", business.plan_id).single();

  // Resolve the industry template so n8n's AI_PROMPT_BUILDER can compose an
  // industry-aware system prompt (intents, tools, KB structure, defaults).
  // Plan capabilities keep the bot honest about what it can actually do.
  const industry = buildIndustryPromptContext(business.business_type, resolveCapabilities(plan));

  // Log to automation_logs for n8n to pick up. Admin client: RLS only lets
  // admins write automation_logs, so a user-scoped insert silently no-ops.
  const admin = createAdminClient();
  const { error } = await admin.from("automation_logs").insert({
    business_id: business.id,
    workflow: "regenerate_system_prompt",
    event: "prompt_regeneration_requested",
    level: "info",
    payload: {
      business_id: business.id,
      requested_by: user.id,
      business_type: business.business_type,
      industry,
    } as unknown as Json,
  });
  if (error) return NextResponse.json({ error: "Failed to queue job" }, { status: 500 });

  return NextResponse.json({ success: true, message: "Prompt regeneration queued" });
}
