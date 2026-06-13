import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** POST /api/admin/payments/:id/reject  { reason: string } */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { reason } = await req.json().catch(() => ({ reason: "" }));

  const admin = createAdminClient();
  const { data: payment } = await admin
    .from("payments")
    .select("id, status, business_id, businesses(order_id, business_name)")
    .eq("id", id)
    .single();
  if (!payment) return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  if (payment.status !== "pending") {
    return NextResponse.json({ error: `Payment already ${payment.status}` }, { status: 409 });
  }

  await admin
    .from("payments")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason: reason || null,
    })
    .eq("id", id);

  await admin
    .from("businesses")
    .update({ status: "pending_payment", internal_notes: `Payment rejected: ${reason || "no reason given"}` })
    .eq("id", payment.business_id);

  await admin.from("audit_logs").insert({
    actor_id: user.id,
    action: "payment.reject",
    entity: "payments",
    entity_id: id,
    diff: { reason },
  });

  return NextResponse.json({ ok: true });
}
