import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json, TablesUpdate } from "@/lib/database.types";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    name,
    name_ar,
    setup_fee_egp,
    monthly_fee_egp,
    margin_egp,
    validity_days,
    message_limit,
    ai_model,
    fallback_model,
    max_tokens,
    memory_window,
    features,
    features_ar,
    active,
    highlighted,
    tier_level,
  } = body;

  const db = createAdminClient();

  const updateData: TablesUpdate<"plans"> = {};
  if (name !== undefined) updateData.name = String(name);
  if (name_ar !== undefined) updateData.name_ar = String(name_ar);
  if (setup_fee_egp !== undefined) updateData.setup_fee_egp = Number(setup_fee_egp);
  if (monthly_fee_egp !== undefined) updateData.monthly_fee_egp = Number(monthly_fee_egp);
  if (margin_egp !== undefined) updateData.margin_egp = Number(margin_egp);
  if (validity_days !== undefined) updateData.validity_days = Number(validity_days);
  if (message_limit !== undefined) updateData.message_limit = Number(message_limit);
  if (ai_model !== undefined) updateData.ai_model = String(ai_model);
  if (fallback_model !== undefined) updateData.fallback_model = String(fallback_model);
  if (max_tokens !== undefined) updateData.max_tokens = Number(max_tokens);
  if (memory_window !== undefined) updateData.memory_window = Number(memory_window);
  if (features !== undefined) updateData.features = features;
  if (features_ar !== undefined) updateData.features_ar = features_ar;
  if (active !== undefined) updateData.active = Boolean(active);
  if (highlighted !== undefined) updateData.highlighted = Boolean(highlighted);
  if (tier_level !== undefined) updateData.tier_level = Number(tier_level);

  // Guard: margin can't exceed price (would make the token budget negative)
  if (
    updateData.monthly_fee_egp !== undefined && updateData.margin_egp !== undefined &&
    Number(updateData.margin_egp) > Number(updateData.monthly_fee_egp)
  ) {
    return NextResponse.json({ error: "Margin cannot exceed the package price" }, { status: 422 });
  }

  const { error } = await db.from("plans").update(updateData).eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("audit_logs").insert({
    action: "plan.updated",
    actor_id: user.id,
    entity: "plans",
    entity_id: id,
    diff: updateData as Json,
  });

  return NextResponse.json({ success: true });
}
