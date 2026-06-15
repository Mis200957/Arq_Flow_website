import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { buildIndustryPromptContext } from "@/lib/modules/ai";
import type { Json } from "@/lib/database.types";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id, business_type").eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Resolve the industry template so n8n's AI_PROMPT_BUILDER can compose an
  // industry-aware system prompt (intents, tools, KB structure, defaults).
  const industry = buildIndustryPromptContext(business.business_type);

  // Log to automation_logs for n8n to pick up
  await supabase.from("automation_logs").insert({
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

  return NextResponse.json({ success: true, message: "Prompt regeneration queued" });
}
