import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
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
  const { status } = body as { status?: string };

  const allowed = ["active", "suspended", "provisioning", "qr_pending", "under_review"] as const;
  if (!status || !allowed.includes(status as (typeof allowed)[number])) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = createAdminClient();

  const { error } = await db
    .from("businesses")
    .update({ status: status as (typeof allowed)[number] })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await db.from("audit_logs").insert({
    action: `business.status.${status}`,
    actor_id: user.id,
    entity: "businesses",
    entity_id: id,
    diff: { status },
  });

  return NextResponse.json({ success: true });
}
