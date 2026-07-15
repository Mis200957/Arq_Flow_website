"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bot, CheckCircle, Loader2, QrCode, RefreshCw, Smartphone, AlertOctagon,
  ShieldCheck, MessageCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLang, useT } from "@/lib/i18n";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Business = Tables<"businesses">;

interface Props {
  business: Business;
}

type Stage = "creating" | "qr_prep" | "qr_show" | "reviewing" | "failed";

const POLL_MS = 5_000;

/**
 * Full-screen provisioning experience shown instead of the dashboard while
 * the bot is being built and connected:
 *
 *   1. creating   (status=provisioning)      — "جاري إنشاء البوت..." animation
 *   2. qr_prep    (status=qr_pending)        — WhatsApp linking instructions;
 *                                              QR is fetched only after the
 *                                              user taps "أنا جاهز" (QR codes
 *                                              expire in ~40s)
 *   3. qr_show                               — live QR with countdown + refresh
 *   4. dashboard  (status=active)            — QR scan flips the row to active;
 *                                              page refresh drops the client
 *                                              straight into the real dashboard
 *
 * The legacy `reviewing` stage (status=under_review) is kept as a safety net
 * for legacy rows or the manual admin activate path; new provisionings jump
 * straight from qr_show → dashboard.
 *
 * State advances via Supabase realtime on the businesses row + a polling
 * fallback against /api/dashboard/provisioning/status.
 */
export default function ProvisioningScreen({ business }: Props) {
  const { lang, dir } = useLang();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const statusToStage = (s: string | null): Stage => {
    if (s === "qr_pending") return "qr_prep";
    if (s === "under_review") return "reviewing";
    if (s === "provision_failed") return "failed";
    return "creating";
  };

  const [stage, setStage] = useState<Stage>(statusToStage(business.status));
  const [slowHint, setSlowHint] = useState(false);
  // QR state
  const [qr, setQr] = useState<string | null>(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const t = useT({
    ar: {
      // creating
      creatingTitle: "جاري إنشاء البوت الخاص بك...",
      creatingSub: "بنجهّز مساعدك الذكي: الذاكرة، الأدوات، وقاعدة المعرفة الخاصة بنشاطك.",
      creatingSlow: "الإعداد بياخد وقت أطول شوية من المعتاد — لو استمر كده تواصل معنا.",
      stepCreate: "إنشاء البوت وتجهيز الأدوات",
      stepLink: "ربط رقم الواتساب",
      stepReview: "فحص البوت والتشغيل",
      // qr prep
      prepTitle: "بوتك جاهز! خطوة أخيرة: ربط الواتساب",
      prepSub: "قبل ما نعرض كود الـ QR، جهّز موبايلك الأول — الكود صلاحيته قصيرة (٤٠ ثانية تقريباً).",
      prep1: "افتح تطبيق WhatsApp على هاتفك",
      prep2: "ادخل على الإعدادات ← الأجهزة المرتبطة",
      prep3: "اضغط \"ربط جهاز جديد\"",
      prep4: "جهّز الكاميرا لمسح الكود",
      ready: "أنا جاهز — اعرض الكود",
      loadingQr: "جاري تجهيز الكود...",
      // qr show
      scanTitle: "امسح الكود الآن",
      scanSub: "وجّه كاميرا الواتساب على الكود قبل انتهاء العدّاد.",
      expires: "الكود ينتهي خلال",
      seconds: "ثانية",
      expired: "انتهت صلاحية الكود",
      refreshQr: "كود جديد",
      waitingScan: "في انتظار المسح... الصفحة هتتحدث تلقائياً أول ما الربط ينجح.",
      // reviewing
      linkedTitle: "تم ربط WhatsApp بنجاح ✅",
      reviewingTitle: "جاري فحص البوت والتأكد من أن جميع الخدمات تعمل بشكل صحيح...",
      reviewingSub: "بنراجع الاتصال والأدوات وقاعدة المعرفة. أول ما الفحص يخلص هنتواصل معك ويتفعّل البوت.",
      reviewingNote: "مش محتاج تعمل أي حاجة — سيبك من الصفحة دي وهنبلغك أول ما البوت يبقى جاهز.",
      // failed
      failedTitle: "حصلت مشكلة أثناء إنشاء البوت",
      failedSub: "فريقنا اتبلغ تلقائياً وهيتواصل معك بعد حل المشكلة. ممكن كمان تكلمنا مباشرة.",
      contactSupport: "تواصل مع الدعم",
      // shared
      qrErrorRetry: "حصل خطأ في تحميل الكود — جرب تاني",
    },
    en: {
      creatingTitle: "Creating your bot...",
      creatingSub: "Setting up your AI assistant: memory, tools, and your business knowledge base.",
      creatingSlow: "Setup is taking a bit longer than usual — contact us if this persists.",
      stepCreate: "Create bot & configure tools",
      stepLink: "Link WhatsApp number",
      stepReview: "Verify & go live",
      prepTitle: "Your bot is ready! One last step: link WhatsApp",
      prepSub: "Before we show the QR code, get your phone ready — the code expires quickly (~40 seconds).",
      prep1: "Open WhatsApp on your phone",
      prep2: "Go to Settings → Linked devices",
      prep3: "Tap \"Link a device\"",
      prep4: "Get your camera ready to scan",
      ready: "I'm ready — show the code",
      loadingQr: "Preparing your code...",
      scanTitle: "Scan the code now",
      scanSub: "Point the WhatsApp camera at the code before the timer runs out.",
      expires: "Code expires in",
      seconds: "s",
      expired: "Code expired",
      refreshQr: "New code",
      waitingScan: "Waiting for scan... this page updates automatically once linked.",
      linkedTitle: "WhatsApp linked successfully ✅",
      reviewingTitle: "Checking your bot and verifying all services are working...",
      reviewingSub: "We're reviewing the connection, tools, and knowledge base. We'll contact you as soon as the checks pass and the bot is activated.",
      reviewingNote: "Nothing to do here — you can leave this page and we'll let you know once your bot is live.",
      failedTitle: "Something went wrong while creating your bot",
      failedSub: "Our team has been notified automatically and will contact you once resolved. You can also reach us directly.",
      contactSupport: "Contact support",
      qrErrorRetry: "Failed to load the code — try again",
    },
  });

  /** Advance the stage from a businesses.status value (never regress qr_show → qr_prep). */
  const applyStatus = useCallback(
    (s: string | null) => {
      if (s === "active") {
        router.refresh();
        return;
      }
      const next = statusToStage(s);
      setStage((prev) => (prev === "qr_show" && next === "qr_prep" ? prev : next));
    },
    [router]
  );

  // Realtime: react instantly when n8n callbacks / the admin flip the row.
  useEffect(() => {
    const channel = supabase
      .channel("provisioning:" + business.id)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "businesses", filter: `id=eq.${business.id}` },
        (payload) => applyStatus((payload.new as { status?: string }).status ?? null)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [business.id, supabase, applyStatus]);

  // Polling fallback (realtime can drop on mobile networks).
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const res = await fetch("/api/dashboard/provisioning/status", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as { status?: string };
        applyStatus(json.status ?? null);
      } catch {
        /* network hiccup — next tick */
      }
    }, POLL_MS);
    return () => clearInterval(iv);
  }, [applyStatus]);

  // "Taking longer than usual" hint after 3 minutes in the creating stage.
  useEffect(() => {
    if (stage !== "creating") return;
    const to = setTimeout(() => setSlowHint(true), 180_000);
    return () => clearTimeout(to);
  }, [stage]);

  // QR countdown.
  const startCountdown = (ttl: number) => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(ttl);
    countdownRef.current = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1 && countdownRef.current) clearInterval(countdownRef.current);
        return Math.max(0, c - 1);
      });
    }, 1_000);
  };
  useEffect(() => () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const fetchQr = async () => {
    setQrLoading(true);
    setQrError(null);
    try {
      const res = await fetch("/api/dashboard/provisioning/qr", { method: "POST" });
      const json = await res.json().catch(() => ({}));
      if (json.connected) {
        // Already linked — jump straight to the review stage.
        setStage("reviewing");
        return;
      }
      if (!res.ok || !json.qr_base64) throw new Error(json.error ?? "QR unavailable");
      setQr(json.qr_base64 as string);
      startCountdown(Number(json.ttl_seconds ?? 40));
      setStage("qr_show");
    } catch (e) {
      setQrError(e instanceof Error ? e.message : "QR unavailable");
    } finally {
      setQrLoading(false);
    }
  };

  const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP;
  const supportHref = supportNumber ? `https://wa.me/${supportNumber}` : undefined;

  /* ─── UI helpers ─────────────────────────────────────────────────────── */

  const StepTracker = ({ active }: { active: 0 | 1 | 2 }) => {
    const steps = [t.stepCreate, t.stepLink, t.stepReview];
    return (
      <div className="space-y-3 text-start mb-8">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0",
                i < active
                  ? "bg-[rgba(74,222,128,0.15)] text-[var(--success)]"
                  : i === active
                  ? "bg-[rgba(0,229,163,0.2)] text-accent animate-pulse"
                  : "bg-[rgba(44,76,69,0.06)] text-muted"
              )}
            >
              {i < active ? <CheckCircle className="w-4 h-4" /> : i + 1}
            </div>
            <span className={cn(i <= active ? "text-app" : "text-muted")}>{step}</span>
          </div>
        ))}
      </div>
    );
  };

  const Shell = ({ children }: { children: React.ReactNode }) => (
    <div dir={dir} className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--bg)" }}>
      <div className="glass-strong max-w-lg w-full p-8 text-center">{children}</div>
    </div>
  );

  /* ─── Stages ─────────────────────────────────────────────────────────── */

  if (stage === "failed") {
    return (
      <Shell>
        <div className="w-20 h-20 rounded-2xl bg-[rgba(248,113,113,0.12)] flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-10 h-10 text-[var(--danger)]" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t.failedTitle}</h1>
        <p className="text-muted mb-8">{t.failedSub}</p>
        {supportHref && (
          <a href={supportHref} target="_blank" rel="noreferrer" className="btn-primary inline-flex items-center gap-2">
            <MessageCircle className="w-4 h-4" /> {t.contactSupport}
          </a>
        )}
      </Shell>
    );
  }

  if (stage === "creating") {
    return (
      <Shell>
        <div className="w-20 h-20 rounded-2xl bg-[rgba(0,229,163,0.12)] flex items-center justify-center mx-auto mb-6">
          <Bot className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t.creatingTitle}</h1>
        <p className="text-muted mb-8">{t.creatingSub}</p>
        <StepTracker active={0} />
        <div className="flex items-center justify-center gap-3 text-muted text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-accent" />
        </div>
        {slowHint && (
          <div className="glass p-4 rounded-xl mt-6 text-sm text-muted">
            {t.creatingSlow}{" "}
            {supportHref && (
              <a href={supportHref} target="_blank" rel="noreferrer" className="text-accent underline">
                {t.contactSupport}
              </a>
            )}
          </div>
        )}
      </Shell>
    );
  }

  if (stage === "qr_prep") {
    const steps = [t.prep1, t.prep2, t.prep3, t.prep4];
    return (
      <Shell>
        <div className="w-20 h-20 rounded-2xl bg-[rgba(0,229,163,0.12)] flex items-center justify-center mx-auto mb-6">
          <Smartphone className="w-10 h-10 text-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-2">{t.prepTitle}</h1>
        <p className="text-muted mb-6">{t.prepSub}</p>
        <div className="space-y-3 text-start mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[rgba(0,229,163,0.2)] text-accent flex items-center justify-center text-sm font-bold shrink-0">
                {i + 1}
              </div>
              <span className="text-app">{s}</span>
            </div>
          ))}
        </div>
        {qrError && <p className="text-sm text-[var(--danger)] mb-3">{t.qrErrorRetry}</p>}
        <button onClick={fetchQr} disabled={qrLoading} className="btn-primary w-full flex items-center justify-center gap-2">
          {qrLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> {t.loadingQr}
            </>
          ) : (
            <>
              <QrCode className="w-4 h-4" /> {t.ready}
            </>
          )}
        </button>
      </Shell>
    );
  }

  if (stage === "qr_show") {
    const expired = countdown <= 0;
    return (
      <Shell>
        <h1 className="text-2xl font-bold mb-2">{t.scanTitle}</h1>
        <p className="text-muted mb-6">{t.scanSub}</p>
        <div className="relative mx-auto mb-4 w-64 h-64 rounded-2xl overflow-hidden bg-white p-3">
          {qr && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={qr}
              alt="WhatsApp QR"
              className={cn("w-full h-full object-contain transition-all", expired && "blur-md opacity-40")}
            />
          )}
          {expired && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <p className="text-sm font-bold text-[#111]">{t.expired}</p>
              <button onClick={fetchQr} disabled={qrLoading} className="btn-primary !py-2 flex items-center gap-2">
                {qrLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                {t.refreshQr}
              </button>
            </div>
          )}
        </div>
        {!expired && (
          <p className="text-sm text-muted mb-2">
            {t.expires}{" "}
            <span className={cn("font-bold tabular-nums", countdown <= 10 ? "text-[var(--danger)]" : "text-accent")}>
              {countdown}
            </span>{" "}
            {t.seconds}
          </p>
        )}
        <div className="flex items-center justify-center gap-2 text-xs text-muted">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{t.waitingScan}</span>
        </div>
      </Shell>
    );
  }

  // stage === "reviewing"
  return (
    <Shell>
      <div className="w-20 h-20 rounded-2xl bg-[rgba(74,222,128,0.12)] flex items-center justify-center mx-auto mb-6">
        <ShieldCheck className="w-10 h-10 text-[var(--success)]" />
      </div>
      <h1 className="text-xl font-bold mb-1 text-[var(--success)]">{t.linkedTitle}</h1>
      <h2 className="text-lg font-bold mb-2">{t.reviewingTitle}</h2>
      <p className="text-muted mb-6">{t.reviewingSub}</p>
      <StepTracker active={2} />
      <div className="glass p-4 rounded-xl text-sm text-muted flex items-center gap-3">
        <Loader2 className="w-4 h-4 animate-spin text-accent shrink-0" />
        <span className="text-start">{t.reviewingNote}</span>
      </div>
    </Shell>
  );
}
