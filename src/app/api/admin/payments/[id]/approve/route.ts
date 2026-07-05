import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { approvePayment } from "@/lib/payments";

// approvePayment waits for the Bot Factory workflow to finish (up to 25s) before
// messaging the client, so give the function room beyond the platform default.
export const maxDuration = 30;

/**
 * POST /api/admin/payments/:id/approve
 * Admin-only. Approves a payment, generates client credentials,
 * activates the subscription, and triggers n8n Bot Factory provisioning.
 * Returns the generated credentials for one-time display.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // verify admin session
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const result = await approvePayment(id, user.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    ok: true,
    credentials: result.credentials,
    dashboard_url: result.dashboard_url,
    factory_triggered: result.factory_triggered,
    factory_error: result.factory_error,
  });
}
