import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * POST /api/dashboard/provisioning/qr
 * Fetches a FRESH WhatsApp pairing QR (base64) from the Evolution API for the
 * caller's instance. Called only after the user taps "أنا جاهز" on the
 * provisioning screen — QR codes expire in ~40s, so we fetch on demand instead
 * of storing the one generated at instance creation.
 *
 * Requires env: EVOLUTION_API_URL, EVOLUTION_API_KEY.
 */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, status, instance_name")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (!business.instance_name) {
    return NextResponse.json({ error: "Instance not provisioned yet" }, { status: 409 });
  }
  // QR is only meaningful while the WhatsApp link is pending.
  if (!["qr_pending", "under_review", "provision_failed", "active"].includes(business.status ?? "")) {
    return NextResponse.json({ error: `No QR available in status '${business.status}'` }, { status: 409 });
  }

  const baseUrl = process.env.EVOLUTION_API_URL;
  const apiKey = process.env.EVOLUTION_API_KEY;
  if (!baseUrl || !apiKey) {
    return NextResponse.json({ error: "Evolution API not configured" }, { status: 500 });
  }

  try {
    const res = await fetch(
      `${baseUrl.replace(/\/$/, "")}/instance/connect/${encodeURIComponent(business.instance_name)}`,
      {
        method: "GET",
        headers: { apikey: apiKey },
        signal: AbortSignal.timeout(15_000),
        cache: "no-store",
      }
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `Evolution API returned ${res.status}` },
        { status: 502 }
      );
    }
    const data = (await res.json()) as {
      base64?: string;
      code?: string;
      pairingCode?: string | null;
      instance?: { state?: string };
    };

    // Already connected → no QR needed; tell the UI to advance.
    if (!data.base64 && data.instance?.state === "open") {
      return NextResponse.json({ connected: true });
    }
    if (!data.base64) {
      return NextResponse.json({ error: "QR not available yet, retry shortly" }, { status: 503 });
    }

    // Track that a QR was handed to the client (ops visibility).
    const admin = createAdminClient();
    await admin
      .from("instances")
      .update({ qr_sent_at: new Date().toISOString(), evolution_status: "qr_pending" })
      .eq("instance_name", business.instance_name);

    return NextResponse.json({
      connected: false,
      qr_base64: data.base64, // data:image/png;base64,....
      pairing_code: data.pairingCode ?? null,
      // Evolution QRs rotate roughly every 40s — the UI shows a countdown
      // and lets the user refresh.
      ttl_seconds: 40,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Evolution API unreachable" },
      { status: 502 }
    );
  }
}
