import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

/**
 * POST /api/n8n/callback
 * Called by the n8n Bot Factory after provisioning completes (or fails).
 * Secured with HMAC: X-ArqFlow-Signature = hex(hmac_sha256(rawBody, N8N_WEBHOOK_SECRET))
 *
 * Body:
 * {
 *   event: "provision_complete" | "provision_failed" | "instance_status" | "health_check",
 *   business_id: string,
 *   workflow_id?: string,
 *   instance_name?: string,
 *   webhook_path?: string,
 *   system_prompt?: string,
 *   qr_sent?: boolean,
 *   status?: string,           // for instance_status: connected|disconnected|qr_pending
 *   connected_number?: string,
 *   error?: string
 * }
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const secret = process.env.N8N_WEBHOOK_SECRET ?? "";
  const signature = req.headers.get("x-arqflow-signature") ?? "";
  const expected = crypto.createHmac("sha256", secret).update(raw).digest("hex");
  const valid =
    signature.length === expected.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event = String(body.event ?? "");
  const businessId = String(body.business_id ?? "");
  if (!event || !businessId) {
    return NextResponse.json({ error: "event and business_id required" }, { status: 422 });
  }

  const admin = createAdminClient();
  const { data: business } = await admin
    .from("businesses")
    .select("id, owner_id, order_id, business_name")
    .eq("id", businessId)
    .single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  switch (event) {
    case "provision_complete": {
      await admin
        .from("businesses")
        .update({
          status: "active",
          workflow_id: (body.workflow_id as string) ?? null,
          instance_name: (body.instance_name as string) ?? null,
          webhook_path: (body.webhook_path as string) ?? null,
          system_prompt: (body.system_prompt as string) ?? null,
          activated_at: new Date().toISOString(),
          health_status: "healthy",
          last_health_check: new Date().toISOString(),
        })
        .eq("id", businessId);

      if (body.instance_name) {
        await admin.from("instances").upsert(
          {
            business_id: businessId,
            instance_name: String(body.instance_name),
            evolution_status: body.qr_sent ? "qr_pending" : "created",
            webhook_url: (body.webhook_path as string) ?? null,
            qr_sent_at: body.qr_sent ? new Date().toISOString() : null,
          },
          { onConflict: "instance_name" }
        );
      }

      if (business.owner_id) {
        await admin.from("notifications").insert({
          user_id: business.owner_id,
          business_id: businessId,
          type: "provision_complete",
          title: "Your AI agent is live 🎉",
          body: "Scan the QR code sent to your WhatsApp to connect your number.",
          link: "/dashboard/whatsapp",
        });
      }
      break;
    }

    case "provision_failed": {
      await admin
        .from("businesses")
        .update({ status: "pending_approval", health_status: "provision_failed" })
        .eq("id", businessId);
      const { data: admins } = await admin.from("profiles").select("id").eq("role", "admin");
      if (admins?.length) {
        await admin.from("notifications").insert(
          admins.map((a) => ({
            user_id: a.id,
            business_id: businessId,
            type: "provision_failed",
            title: `Provisioning FAILED: ${business.business_name}`,
            body: String(body.error ?? "Unknown error"),
            link: "/admin/logs",
          }))
        );
      }
      break;
    }

    case "instance_status": {
      const status = String(body.status ?? "disconnected");
      if (body.instance_name) {
        await admin
          .from("instances")
          .update({
            evolution_status: status,
            connected_number: (body.connected_number as string) ?? null,
            last_health_check: new Date().toISOString(),
            health_status: status === "connected" ? "healthy" : "degraded",
          })
          .eq("instance_name", String(body.instance_name));
      }
      break;
    }

    case "health_check": {
      await admin
        .from("businesses")
        .update({
          health_status: String(body.status ?? "unknown"),
          last_health_check: new Date().toISOString(),
        })
        .eq("id", businessId);
      break;
    }

    default:
      return NextResponse.json({ error: `Unknown event: ${event}` }, { status: 422 });
  }

  await admin.from("automation_logs").insert({
    business_id: businessId,
    workflow: "n8n_callback",
    event,
    level: event.includes("failed") ? "error" : "info",
    payload: body as Json,
  });

  return NextResponse.json({ ok: true });
}
