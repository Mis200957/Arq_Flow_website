import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * GET /api/dashboard/health
 * Aggregates real signals into a per-service health view for the
 * Automation Health Monitor. Read-only; derives status from the data
 * the platform already records (instances, automation_logs, messages).
 */
type Status = "healthy" | "degraded" | "down" | "pending" | "idle" | "unknown";

const H = 60 * 60 * 1000;
const recent = (ts: string | null | undefined, ms: number) =>
  !!ts && Date.now() - new Date(ts).getTime() < ms;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: business } = await supabase
    .from("businesses")
    .select("id, status, health_status, last_health_check, webhook_path")
    .eq("owner_id", user.id)
    .single();
  if (!business) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [instancesRes, logsRes, msgRes, broadcastsRes, webhooksRes] = await Promise.all([
    supabase.from("instances").select("evolution_status, health_status, connected_number, last_health_check, webhook_url").eq("business_id", business.id),
    supabase.from("automation_logs").select("level, workflow, event, created_at").eq("business_id", business.id).order("created_at", { ascending: false }).limit(50),
    supabase.from("messages").select("created_at, model").eq("business_id", business.id).order("created_at", { ascending: false }).limit(1),
    supabase.from("broadcasts").select("status").eq("business_id", business.id).in("status", ["scheduled", "sending", "pending"]),
    supabase.from("webhook_endpoints").select("id, active").eq("business_id", business.id),
  ]);

  const instances = instancesRes.data ?? [];
  const logs = logsRes.data ?? [];
  const lastMsg = msgRes.data?.[0] ?? null;
  const pendingJobs = broadcastsRes.data?.length ?? 0;
  const webhooks = webhooksRes.data ?? [];

  const errors24h = logs.filter((l) => l.level === "error" && recent(l.created_at, 24 * H)).length;
  const lastLog = logs[0]?.created_at ?? null;

  // ---- per-service derivation ----
  const supabaseSvc = { key: "supabase", status: "healthy" as Status, detail_en: "Database reachable", detail_ar: "قاعدة البيانات متصلة", last: new Date().toISOString() };

  const connected = instances.some((i) => i.evolution_status === "connected" || i.connected_number);
  const qrPending = instances.some((i) => i.evolution_status === "qr_pending");
  const evoStatus: Status = instances.length === 0 ? (business.status === "active" ? "pending" : "unknown")
    : connected ? "healthy" : qrPending ? "pending" : "down";
  const evolution = { key: "evolution", status: evoStatus,
    detail_en: connected ? "WhatsApp connected" : qrPending ? "Awaiting QR scan" : instances.length ? "Disconnected" : "Not provisioned",
    detail_ar: connected ? "واتساب متصل" : qrPending ? "بانتظار مسح QR" : instances.length ? "غير متصل" : "لم يتم الإعداد",
    last: instances[0]?.last_health_check ?? null };

  const n8nStatus: Status = errors24h > 0 ? "degraded" : recent(lastLog, 24 * H) ? "healthy" : lastLog ? "idle" : "unknown";
  const n8n = { key: "n8n", status: n8nStatus,
    detail_en: errors24h > 0 ? `${errors24h} error(s) in 24h` : recent(lastLog, 24 * H) ? "Workflows running" : "No recent activity",
    detail_ar: errors24h > 0 ? `${errors24h} خطأ خلال ٢٤ ساعة` : recent(lastLog, 24 * H) ? "الأتمتة تعمل" : "لا نشاط حديث",
    last: lastLog };

  const aiStatus: Status = recent(lastMsg?.created_at, 24 * H) ? "healthy" : lastMsg ? "idle" : "unknown";
  const ai = { key: "ai_provider", status: aiStatus,
    detail_en: recent(lastMsg?.created_at, 24 * H) ? "AI responding" : lastMsg ? "No replies in 24h" : "No messages yet",
    detail_ar: recent(lastMsg?.created_at, 24 * H) ? "الذكاء يرد" : lastMsg ? "لا ردود خلال ٢٤ ساعة" : "لا رسائل بعد",
    last: lastMsg?.created_at ?? null };

  const hasWebhook = !!business.webhook_path || instances.some((i) => i.webhook_url) || webhooks.some((w) => w.active);
  const webhooksSvc = { key: "webhooks", status: (hasWebhook ? "healthy" : "unknown") as Status,
    detail_en: hasWebhook ? "Webhook configured" : "Not configured",
    detail_ar: hasWebhook ? "الويبهوك مُهيّأ" : "غير مُهيّأ", last: null };

  const queues = { key: "queues", status: (pendingJobs > 5 ? "degraded" : "healthy") as Status,
    detail_en: pendingJobs ? `${pendingJobs} job(s) queued` : "No backlog",
    detail_ar: pendingJobs ? `${pendingJobs} مهمة في الطابور` : "لا تأخير", last: null };

  return NextResponse.json({
    services: [supabaseSvc, n8n, evolution, ai, webhooksSvc, queues],
    events: logs.slice(0, 20),
    summary: { errors24h, pendingJobs },
  });
}
