import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * GET /api/dashboard/provisioning/status
 * Polled by the client-facing provisioning screen every ~5s. Returns the
 * business provisioning state so the UI can advance through:
 *   provisioning → qr_pending → active.
 *
 * SELF-HEALING: while the business is in `qr_pending`, we query the Evolution
 * API directly to check whether the client has already scanned the QR. If
 * Evolution reports the instance as `open` (connected) we flip the business
 * to `active` right here — the next poll (or realtime tick) drops the client
 * into the dashboard. This means the flow no longer depends on n8n calling
 * `/api/n8n/callback` with `instance_status: connected` (that path still
 * works and is idempotent — this is a redundant safety net).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, status, health_status, instance_name, last_health_check, owner_id, business_name, order_id")
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

  // Self-heal: if we're still waiting on the QR scan, ask Evolution directly.
  // If it's already connected → activate the business now, don't wait for n8n.
  let effectiveStatus = business.status;
  let effectiveEvolutionStatus = instance?.evolution_status ?? null;
  let effectiveConnectedNumber = instance?.connected_number ?? null;

  const needsCheck =
    business.instance_name &&
    ["provisioning", "qr_pending", "under_review", "provision_failed"].includes(
      business.status ?? ""
    );

  const evoUrl = process.env.EVOLUTION_API_URL;
  const evoKey = process.env.EVOLUTION_API_KEY;

  if (needsCheck && evoUrl && evoKey) {
    try {
      const res = await fetch(
        `${evoUrl.replace(/\/$/, "")}/instance/fetchInstances?instanceName=${encodeURIComponent(
          business.instance_name!
        )}`,
        {
          method: "GET",
          headers: { apikey: evoKey },
          signal: AbortSignal.timeout(5_000),
          cache: "no-store",
        }
      );
      if (res.ok) {
        const raw = (await res.json()) as unknown;
        const list = Array.isArray(raw) ? raw : [raw];
        // Evolution shapes vary by version — check the common fields.
        const inst = list[0] as
          | {
              instance?: { state?: string; status?: string };
              connectionStatus?: string;
              state?: string;
              status?: string;
              ownerJid?: string | null;
              number?: string | null;
            }
          | undefined;
        const state =
          inst?.instance?.state ??
          inst?.state ??
          inst?.connectionStatus ??
          inst?.instance?.status ??
          inst?.status ??
          null;
        const number =
          inst?.number ??
          (inst?.ownerJid ? String(inst.ownerJid).split("@")[0] : null) ??
          null;

        if (state === "open" || state === "connected") {
          // Activate: use the admin client so RLS doesn't block the update.
          const admin = createAdminClient();
          const now = new Date().toISOString();

          if (effectiveStatus !== "active") {
            await admin
              .from("businesses")
              .update({
                status: "active",
                activated_at: now,
                health_status: "healthy",
                last_health_check: now,
              })
              .eq("id", business.id);

            if (business.owner_id) {
              await admin.from("notifications").insert({
                user_id: business.owner_id,
                business_id: business.id,
                type: "bot_activated",
                title: "تم تفعيل البوت ✅",
                body: "مساعدك الذكي شغال دلوقتي على رقم الواتساب المرتبط.",
                link: "/dashboard/overview",
              });
            }

            await admin.from("automation_logs").insert({
              business_id: business.id,
              workflow: "provisioning",
              event: "auto_activated_on_qr_scan",
              level: "info",
              payload: {
                source: "provisioning_status_poll",
                connected_number: number,
                instance_name: business.instance_name,
              },
            });
          }

          if (business.instance_name) {
            await admin
              .from("instances")
              .update({
                evolution_status: "connected",
                connected_number: number,
                health_status: "healthy",
                last_health_check: now,
              })
              .eq("instance_name", business.instance_name);
          }

          effectiveStatus = "active";
          effectiveEvolutionStatus = "connected";
          effectiveConnectedNumber = number ?? effectiveConnectedNumber;
        }
      }
    } catch {
      // Evolution unreachable this tick — the next poll retries.
    }
  }

  return NextResponse.json({
    status: effectiveStatus,
    health_status: business.health_status,
    instance_ready: !!business.instance_name,
    evolution_status: effectiveEvolutionStatus,
    connected_number: effectiveConnectedNumber,
  });
}
