"use client";

import { useState, useEffect, useMemo } from "react";
import { Phone, RefreshCw, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Badge, Spinner } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatDateTime, STATUS_BADGE } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Instance = Tables<"instances">;

interface Props {
  businessId: string;
  initialInstance: Instance | null;
}

export default function WhatsAppClient({ businessId, initialInstance }: Props) {
  const { lang } = useLang();
  const [instance, setInstance] = useState(initialInstance);
  const [requesting, setRequesting] = useState(false);
  const supabase = useMemo(() => createClient(), []);

  const t = useT({
    ar: {
      notProvisioned: "واتساب لم يُفعَّل بعد", notProvisionedBody: "سيتم ربط واتساب تلقائياً بعد إتمام الإعداد",
      connected: "متصل بنجاح", disconnected: "غير متصل", qr: "في انتظار مسح QR",
      number: "الرقم المتصل", instance: "اسم الإنستانس", connectedSince: "متصل منذ", lastCheck: "آخر فحص",
      reconnect: "طلب إعادة الاتصال", requesting: "جاري الطلب...",
      healthOk: "سليم", healthFail: "يوجد مشكلة",
      instructions: "تعليمات مسح QR", step1: "افتح واتساب على هاتفك", step2: "اضغط على النقاط ← الأجهزة المرتبطة",
      step3: "اضغط ربط جهاز جديد", step4: "امسح الـ QR الظاهر",
    },
    en: {
      notProvisioned: "WhatsApp not provisioned yet", notProvisionedBody: "WhatsApp will be linked automatically after setup completes",
      connected: "Connected", disconnected: "Disconnected", qr: "Awaiting QR scan",
      number: "Connected number", instance: "Instance name", connectedSince: "Connected since", lastCheck: "Last health check",
      reconnect: "Request reconnect", requesting: "Requesting...",
      healthOk: "Healthy", healthFail: "Issue detected",
      instructions: "QR Scan Instructions", step1: "Open WhatsApp on your phone", step2: "Tap ⋮ → Linked devices",
      step3: "Tap Link a device", step4: "Scan the QR code shown",
    },
  });

  useEffect(() => {
    if (!instance) return;
    const channel = supabase
      .channel("instance:" + businessId)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instances", filter: `business_id=eq.${businessId}` },
        (payload) => { if (payload.new) setInstance(payload.new as Instance); }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [businessId, supabase, instance]);

  const requestReconnect = async () => {
    setRequesting(true);
    await supabase.from("automation_logs").insert({
      business_id: businessId, workflow: "whatsapp_reconnect", event: "reconnect_requested", level: "info",
      payload: { business_id: businessId, instance_name: instance?.instance_name },
    });
    setTimeout(() => setRequesting(false), 3000);
  };

  if (!instance) {
    return (
      <div className="card p-10 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-[rgba(184,144,99,0.12)] flex items-center justify-center mx-auto mb-4">
          <Phone className="w-8 h-8 text-accent" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t.notProvisioned}</h2>
        <p className="text-muted">{t.notProvisionedBody}</p>
      </div>
    );
  }

  const isConnected = instance.evolution_status === "connected";
  const isQR = instance.evolution_status === "qr_pending";
  const isDisconnected = !isConnected && !isQR;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6 items-start">
      {/* Status card */}
      <div className={cn(
        "card p-6",
        isConnected && "border-[rgba(74,222,128,0.3)]",
        isDisconnected && "border-[rgba(248,113,113,0.3)]",
        isQR && "border-[rgba(251,191,36,0.3)]"
      )}>
        <div className="flex items-center gap-4 mb-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center shrink-0",
            isConnected ? "bg-[rgba(74,222,128,0.12)]" : isQR ? "bg-[rgba(251,191,36,0.12)]" : "bg-[rgba(248,113,113,0.12)]"
          )}>
            {isConnected ? <CheckCircle className="w-6 h-6 text-[var(--success)]" />
              : isQR ? <Clock className="w-6 h-6 text-[var(--warning)]" />
              : <AlertCircle className="w-6 h-6 text-[var(--danger)]" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-bold truncate">
              {isConnected ? t.connected : isQR ? t.qr : t.disconnected}
            </h2>
            <Badge variant={STATUS_BADGE[instance.evolution_status] ?? "neutral"}>{instance.evolution_status}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          {instance.connected_number && (
            <div>
              <p className="text-muted text-xs mb-1">{t.number}</p>
              <p className="font-semibold truncate">{instance.connected_number}</p>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-muted text-xs mb-1">{t.instance}</p>
            <p className="font-mono text-xs truncate">{instance.instance_name}</p>
          </div>
          {instance.last_health_check && (
            <div>
              <p className="text-muted text-xs mb-1">{t.lastCheck}</p>
              <p className="truncate">{formatDateTime(instance.last_health_check, lang)}</p>
            </div>
          )}
          {instance.health_status && (
            <div>
              <p className="text-muted text-xs mb-1">Health</p>
              <Badge variant={instance.health_status === "ok" ? "success" : "danger"}>
                {instance.health_status === "ok" ? t.healthOk : t.healthFail}
              </Badge>
            </div>
          )}
        </div>

        {!isConnected && (
          <button
            onClick={requestReconnect}
            disabled={requesting}
            className="btn-outline mt-4 flex items-center gap-2"
          >
            {requesting ? <Spinner className="w-4 h-4" /> : <RefreshCw className="w-4 h-4" />}
            {requesting ? t.requesting : t.reconnect}
          </button>
        )}
      </div>

      {/* QR instructions */}
      {isQR && (
        <div className="card p-5">
          <h3 className="font-bold mb-3">{t.instructions}</h3>
          <ol className="space-y-2">
            {[t.step1, t.step2, t.step3, t.step4].map((step, i) => (
              <li key={i} className="flex items-center gap-3 text-sm">
                <span className="w-6 h-6 rounded-full bg-[rgba(184,144,99,0.2)] text-accent flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</span>
                <span className="min-w-0">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

    </div>
  );
}
