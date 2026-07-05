import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminChatIds, sendMessage } from "@/lib/telegram";
import type { Json } from "@/lib/database.types";

/**
 * POST /api/n8n/callback
 * Called by n8n (Bot Factory / instance-status relay) at each provisioning step.
 * Secured with HMAC: X-ArqFlow-Signature = hex(hmac_sha256(rawBody, N8N_WEBHOOK_SECRET))
 *
 * Provisioning state machine (businesses.status):
 *   provisioning      → factory building workflow + Evolution instance
 *   qr_pending        → provision_complete received; client sees QR-prep screen
 *   active            → instance_status: connected (client scanned the QR).
 *                       The business flips straight to active here; the
 *                       client's provisioning screen then drops them into
 *                       the dashboard. POST /api/admin/clients/:id/activate
 *                       still exists as a manual override for stuck cases.
 *   provision_failed  → provision_failed received; admin investigates + retries
 *
 * Body:
 * {
 *   event: "provision_complete" | "provision_failed" | "instance_status" | "health_check",
 *   business_id: string,
 *   workflow_id?: string,
 *   instance_name?: string,
 *   webhook_path?: string,
 *   system_prompt?: string,
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
    .select("id, owner_id, order_id, business_name, status")
    .eq("id", businessId)
    .single();
  if (!business) return NextResponse.json({ error: "Business not found" }, { status: 404 });

  /** Fire-and-forget Telegram note to all admin chats. */
  const telegramAdmins = async (text: string) => {
    await Promise.allSettled(adminChatIds().map((id) => sendMessage(id, text)));
  };

  switch (event) {
    case "provision_complete": {
      // Bot workflow + Evolution instance exist. NOT active yet — the client
      // must link WhatsApp (QR) and the admin must give the final OK.
      await admin
        .from("businesses")
        .update({
          status: "qr_pending",
          workflow_id: (body.workflow_id as string) ?? null,
          instance_name: (body.instance_name as string) ?? null,
          webhook_path: (body.webhook_path as string) ?? null,
          system_prompt: (body.system_prompt as string) ?? null,
          health_status: "provisioned",
          last_health_check: new Date().toISOString(),
        })
        .eq("id", businessId);

      if (body.instance_name) {
        await admin.from("instances").upsert(
          {
            business_id: businessId,
            instance_name: String(body.instance_name),
            evolution_status: "qr_pending",
            webhook_url: (body.webhook_path as string) ?? null,
          },
          { onConflict: "instance_name" }
        );
      }

      if (business.owner_id) {
        await admin.from("notifications").insert({
          user_id: business.owner_id,
          business_id: businessId,
          type: "provision_complete",
          title: "بوتك جاهز للربط 📲",
          body: "ادخل على لوحة التحكم لربط رقم الواتساب عن طريق QR code.",
          link: "/dashboard",
        });
      }

      await telegramAdmins(
        `🏭 <b>تم إنشاء البوت</b>\n\n` +
          `🏢 ${business.business_name}\n🆔 <code>${business.order_id}</code>\n` +
          `⏳ في انتظار ربط العميل للواتساب (QR).`
      );
      break;
    }

    case "provision_failed": {
      await admin
        .from("businesses")
        .update({ status: "provision_failed", health_status: "provision_failed" })
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
      await telegramAdmins(
        `🚨 <b>فشل إنشاء البوت</b>\n\n` +
          `🏢 ${business.business_name}\n🆔 <code>${business.order_id}</code>\n` +
          `❌ ${String(body.error ?? "Unknown error")}`
      );
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

      // First successful WhatsApp link during provisioning → activate the
      // business immediately. The client's provisioning screen is listening
      // on businesses realtime + polling status; the moment it sees `active`
      // it router.refresh()es into the dashboard.
      if (
        status === "connected" &&
        ["provisioning", "qr_pending", "under_review", "provision_failed"].includes(
          business.status ?? ""
        )
      ) {
        await admin
          .from("businesses")
          .update({
            status: "active",
            activated_at: new Date().toISOString(),
            health_status: "healthy",
            last_health_check: new Date().toISOString(),
          })
          .eq("id", businessId);

        if (business.owner_id) {
          await admin.from("notifications").insert({
            user_id: business.owner_id,
            business_id: businessId,
            type: "bot_activated",
            title: "تم تفعيل البوت ✅",
            body: "مساعدك الذكي شغال دلوقتي على رقم الواتساب المرتبط.",
            link: "/dashboard/overview",
          });
        }

        await admin.from("automation_logs").insert({
          business_id: businessId,
          workflow: "provisioning",
          event: "auto_activated_on_qr_scan",
          level: "info",
          payload: {
            connected_number: (body.connected_number as string) ?? null,
            instance_name: (body.instance_name as string) ?? null,
          } as Json,
        });

        await telegramAdmins(
          `✅ <b>تم تفعيل البوت</b>\n\n` +
            `🏢 ${business.business_name}\n🆔 <code>${business.order_id}</code>\n` +
            `📞 ${String(body.connected_number ?? "—")}\n\n` +
            `العميل ربط الواتساب والبوت شغال دلوقتي.`
        );
      }

      // WhatsApp dropped on a live bot → flag health + tell the admin.
      if (status === "disconnected" && business.status === "active") {
        await admin
          .from("businesses")
          .update({ health_status: "whatsapp_disconnected", last_health_check: new Date().toISOString() })
          .eq("id", businessId);
        await telegramAdmins(
          `⚠️ <b>انقطع اتصال الواتساب</b>\n\n🏢 ${business.business_name}\n🆔 <code>${business.order_id}</code>`
        );
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
