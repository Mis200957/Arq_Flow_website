import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { rejectPayment } from "@/lib/payments";

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

  const result = await rejectPayment(id, user.id, reason || "");
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({ ok: true });
}
