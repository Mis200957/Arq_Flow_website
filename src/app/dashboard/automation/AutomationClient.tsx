"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Database, Workflow, Phone, Bot, Webhook, Layers,
  CheckCircle2, AlertTriangle, XCircle, Clock, HelpCircle, RefreshCw,
} from "lucide-react";
import { Spinner, Badge } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, timeAgo } from "@/lib/utils";

type Status = "healthy" | "degraded" | "down" | "pending" | "idle" | "unknown";
interface Service { key: string; status: Status; detail_en: string; detail_ar: string; last: string | null }
interface Evt { level: string; workflow: string; event: string; created_at: string }
interface Health { services: Service[]; events: Evt[]; summary: { errors24h: number; pendingJobs: number } }

const ICONS: Record<string, typeof Database> = {
  supabase: Database, n8n: Workflow, evolution: Phone, ai_provider: Bot, webhooks: Webhook, queues: Layers,
};
const STATUS_META: Record<Status, { cls: string; Icon: typeof CheckCircle2 }> = {
  healthy: { cls: "text-[var(--success)]", Icon: CheckCircle2 },
  degraded: { cls: "text-[var(--warning)]", Icon: AlertTriangle },
  down: { cls: "text-[var(--danger)]", Icon: XCircle },
  pending: { cls: "text-accent", Icon: Clock },
  idle: { cls: "text-muted", Icon: Clock },
  unknown: { cls: "text-muted", Icon: HelpCircle },
};
const BADGE: Record<Status, string> = { healthy: "success", degraded: "warning", down: "danger", pending: "accent", idle: "neutral", unknown: "neutral" };

export default function AutomationClient() {
  const { lang } = useLang();
  const t = useT({
    ar: {
      names: { supabase: "قاعدة البيانات", n8n: "محرك الأتمتة n8n", evolution: "واتساب (Evolution)", ai_provider: "مزوّد الذكاء", webhooks: "الويبهوكس", queues: "الطوابير" } as Record<string, string>,
      status: { healthy: "سليم", degraded: "متدهور", down: "متوقف", pending: "قيد الإعداد", idle: "خامل", unknown: "غير معروف" } as Record<Status, string>,
      recentEvents: "أحدث الأحداث", noEvents: "لا أحداث", refresh: "تحديث", lastUpdated: "آخر تحديث", autoRefresh: "تحديث تلقائي كل ٣٠ ثانية",
    },
    en: {
      names: { supabase: "Database", n8n: "Automation (n8n)", evolution: "WhatsApp (Evolution)", ai_provider: "AI Provider", webhooks: "Webhooks", queues: "Queues" } as Record<string, string>,
      status: { healthy: "Healthy", degraded: "Degraded", down: "Down", pending: "Provisioning", idle: "Idle", unknown: "Unknown" } as Record<Status, string>,
      recentEvents: "Recent Events", noEvents: "No events", refresh: "Refresh", lastUpdated: "Last updated", autoRefresh: "Auto-refresh every 30s",
    },
  });

  const [data, setData] = useState<Health | null>(null);
  const [loading, setLoading] = useState(true);
  const [updated, setUpdated] = useState<Date | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/health", { cache: "no-store" });
      if (res.ok) { setData(await res.json()); setUpdated(new Date()); }
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 30000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">
          {updated ? `${t.lastUpdated}: ${updated.toLocaleTimeString(lang === "ar" ? "ar-EG" : "en-GB")}` : t.autoRefresh}
        </p>
        <button onClick={load} className="btn-ghost text-sm flex items-center gap-1.5">
          <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> {t.refresh}
        </button>
      </div>

      {loading && !data ? (
        <div className="flex justify-center py-16"><Spinner className="w-6 h-6 text-accent" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data?.services.map((s) => {
              const SvcIcon = ICONS[s.key] ?? HelpCircle;
              const meta = STATUS_META[s.status];
              const StatusIcon = meta.Icon;
              return (
                <div key={s.key} className="card p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[rgba(184,144,99,0.12)] text-accent flex items-center justify-center shrink-0">
                        <SvcIcon className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold truncate">{t.names[s.key] ?? s.key}</p>
                        <p className="text-xs text-muted truncate">{lang === "ar" ? s.detail_ar : s.detail_en}</p>
                      </div>
                    </div>
                    <StatusIcon className={cn("w-5 h-5 shrink-0", meta.cls)} />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <Badge variant={BADGE[s.status]}>{t.status[s.status]}</Badge>
                    {s.last && <span className="text-xs text-muted">{timeAgo(s.last, lang)}</span>}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="card p-5">
            <h3 className="font-bold mb-4">{t.recentEvents}</h3>
            {!data?.events.length ? (
              <p className="text-muted text-sm">{t.noEvents}</p>
            ) : (
              <div className="space-y-2">
                {data.events.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b border-[var(--border)] last:border-0">
                    <span className={cn("w-2 h-2 rounded-full shrink-0",
                      e.level === "error" ? "bg-[var(--danger)]" : e.level === "warn" ? "bg-[var(--warning)]" : "bg-[var(--success)]")} />
                    <span className="font-medium">{e.workflow}</span>
                    <span className="text-muted truncate flex-1">{e.event}</span>
                    <span className="text-xs text-muted shrink-0">{timeAgo(e.created_at, lang)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
