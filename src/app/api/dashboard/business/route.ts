import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();

  // Only allow safe fields to be updated
  const allowed = [
    "business_name", "description", "address", "website", "contact_email", "contact_phone",
    "tone_of_voice", "fallback_behavior", "greeting_message", "assistant_personality",
    "primary_goal", "languages", "working_hours", "delivery_info", "order_instructions",
    "return_policy", "policy",
  ];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  const { data, error } = await supabase
    .from("businesses")
    .update({ ...update, updated_at: new Date().toISOString() })
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
