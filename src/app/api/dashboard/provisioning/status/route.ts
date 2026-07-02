import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/dashboard/provisioning/status
 * Polled by the client-facing provisioning screen. Returns the business
 * provisioning state + the Evolution instance state so the UI can advance
 * through: provisioning → qr_pending → under_review → active.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, status, health_status, instance_name, last_health_check")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let instance: { evolution_status: string | null; connected_number: string | null } | null = null;
  if (business.instance_name) {
    const { data } = await supabase
      .from("instances")
      .select("evolution_status, connected_number")
      .eq("business_id", business.id)
      .maybeSingle();
    instance = data ?? null;
  }

  return NextResponse.json({
    status: business.status,
    health_status: business.health_status,
    instance_ready: !!business.instance_name,
    evolution_status: instance?.evolution_status ?? null,
    connected_number: instance?.connected_number ?? null,
  });
}
