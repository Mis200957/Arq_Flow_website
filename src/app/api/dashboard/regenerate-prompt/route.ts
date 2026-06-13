import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses").select("id").eq("owner_id", user.id).single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Log to automation_logs for n8n to pick up
  await supabase.from("automation_logs").insert({
    business_id: business.id,
    workflow: "regenerate_system_prompt",
    event: "prompt_regeneration_requested",
    level: "info",
    payload: { business_id: business.id, requested_by: user.id },
  });

  return NextResponse.json({ success: true, message: "Prompt regeneration queued" });
}
