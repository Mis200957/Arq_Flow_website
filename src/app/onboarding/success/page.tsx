"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Home,
  KeyRound,
  MessageCircle,
  Rocket,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import { useLang, useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { SUPPORT_WHATSAPP } from "@/lib/plans";
import { OnboardingHeader } from "../OnboardingWizard";

/* deterministic positions to keep SSR/CSR markup identical */
const DOTS = [
  { left: "8%", top: "18%", size: 8, delay: 0 },
  { left: "16%", top: "62%", size: 5, delay: 0.6 },
  { left: "24%", top: "30%", size: 6, delay: 1.2 },
  { left: "32%", top: "76%", size: 9, delay: 0.3 },
  { left: "42%", top: "12%", size: 5, delay: 1.6 },
  { left: "52%", top: "70%", size: 7, delay: 0.9 },
  { left: "60%", top: "22%", size: 6, delay: 1.9 },
  { left: "68%", top: "58%", size: 8, delay: 0.4 },
  { left: "76%", top: "16%", size: 5, delay: 1.4 },
  { left: "84%", top: "68%", size: 7, delay: 0.7 },
  { left: "90%", top: "34%", size: 6, delay: 1.1 },
  { left: "48%", top: "44%", size: 4, delay: 2.1 },
];

function SuccessInner() {
  const params = useSearchParams();
  const orderId = params.get("order") ?? "";
  const { lang } = useLang();
  const [copied, setCopied] = useState(false);

  const t = useT({
    ar: {
      title: "تم استلام طلبك بنجاح! 🎉",
      sub: "شكراً لثقتك في ArqFlow — فريقنا استلم طلبك وبدأ المراجعة فعلاً.",
      orderLabel: "رقم الطلب",
      orderHint: "احتفظ بالرقم ده — هتحتاجه في أي تواصل مع الدعم.",
      copy: "نسخ",
      copied: "تم النسخ ✓",
      whatsNext: "إيه اللي هيحصل دلوقتي؟",
      timeline: [
        { title: "مراجعة الدفع", body: "فريقنا بيراجع بيانات التحويل ورقم العملية" },
        { title: "اعتماد الطلب", body: "بعد التأكد من الدفع، يتم اعتماد حسابك مباشرة" },
        { title: "إرسال بيانات الدخول", body: "هتوصلك بيانات لوحة التحكم على الواتساب والإيميل" },
        { title: "تشغيل المساعد الذكي", body: "بوتك يبدأ يرد على عملائك على الواتساب 🚀" },
      ],
      eta: "العملية كلها عادةً بتخلص في أقل من 24 ساعة",
      support: "تواصل مع الدعم على واتساب",
      home: "العودة للرئيسية",
      waMsg: (id: string) => `أهلاً، تم إرسال طلب أونبوردينج رقم ${id} — محتاج متابعة من فضلكم 🙏`,
    },
    en: {
      title: "Your order is in! 🎉",
      sub: "Thanks for trusting ArqFlow — our team has received your order and review has already started.",
      orderLabel: "Order ID",
      orderHint: "Keep this ID — you'll need it for any support conversation.",
      copy: "Copy",
      copied: "Copied ✓",
      whatsNext: "What happens next?",
      timeline: [
        { title: "Payment review", body: "Our team verifies your transfer and transaction reference" },
        { title: "Order approval", body: "Once payment is confirmed, your account is approved" },
        { title: "Credentials sent", body: "Your dashboard credentials arrive via WhatsApp & email" },
        { title: "Your assistant goes live", body: "Your bot starts replying to customers on WhatsApp 🚀" },
      ],
      eta: "The whole process typically takes under 24 hours",
      support: "Contact support on WhatsApp",
      home: "Back to home",
      waMsg: (id: string) => `Hi! Order ${id} submitted — kindly follow up 🙏`,
    },
  });

  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable */
    }
  };

  const TIMELINE_ICONS = [SearchCheck, ShieldCheck, KeyRound, Rocket];

  return (
    <main className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* floating celebratory dots */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
        {DOTS.map((d, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full"
            style={{
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              background: i % 3 === 0 ? "#6ba0ac" : i % 3 === 1 ? "#eeedd2" : "#4ade80",
              opacity: 0.5,
            }}
            animate={{ y: [0, -26, 0], opacity: [0.15, 0.6, 0.15], scale: [1, 1.25, 1] }}
            transition={{ duration: 4 + (i % 4), delay: d.delay, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative text-center">
        {/* animated check */}
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.1 }}
          className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-brand-teal to-brand-sky flex items-center justify-center shadow-[0_0_60px_rgba(184,144,99,0.5)]"
        >
          <motion.span
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.35, type: "spring", stiffness: 260, damping: 16 }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.2} />
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="text-3xl sm:text-4xl font-extrabold mt-6 gradient-text"
        >
          {t.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="text-muted mt-3 leading-relaxed max-w-md mx-auto"
        >
          {t.sub}
        </motion.p>

        {/* order id */}
        {orderId && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-strong mt-8 p-5 inline-block w-full max-w-sm"
          >
            <p className="text-xs text-muted font-semibold">{t.orderLabel}</p>
            <div className="mt-2 flex items-center justify-center gap-3 flex-wrap">
              <code
                className="text-xl sm:text-2xl font-extrabold tracking-[0.12em] text-accent bg-[rgba(7,15,28,0.6)] border border-app rounded-xl px-4 py-2"
                dir="ltr"
              >
                {orderId}
              </code>
              <button type="button" onClick={copyOrder} className="btn-outline !py-2 !px-3 text-xs" aria-label={t.copy}>
                {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
                {copied ? t.copied : t.copy}
              </button>
            </div>
            <p className="text-[11px] text-muted mt-3">{t.orderHint}</p>
          </motion.div>
        )}

        {/* timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="card p-6 mt-8 text-start"
        >
          <p className="font-bold mb-5">{t.whatsNext}</p>
          <ol className="relative space-y-6">
            {t.timeline.map((item, i) => {
              const Icon = TIMELINE_ICONS[i];
              const last = i === t.timeline.length - 1;
              return (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 + i * 0.15 }}
                  className="flex gap-4"
                >
                  <div className="flex flex-col items-center">
                    <span
                      className={cn(
                        "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border",
                        last
                          ? "bg-gradient-to-br from-brand-teal to-brand-sky text-white border-transparent"
                          : "bg-[rgba(184,144,99,0.12)] text-accent border-[rgba(184,144,99,0.25)]"
                      )}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </span>
                    {!last && <span className="w-px flex-1 bg-[rgba(184,144,99,0.25)] mt-1.5" />}
                  </div>
                  <div className="pb-1">
                    <p className="font-bold text-sm">{item.title}</p>
                    <p className="text-muted text-xs mt-1 leading-relaxed">{item.body}</p>
                  </div>
                </motion.li>
              );
            })}
          </ol>
          <p className="mt-5 text-xs text-success font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t.eta}
          </p>
        </motion.div>

        {/* actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3"
        >
          <a
            href={`https://wa.me/${SUPPORT_WHATSAPP}?text=${encodeURIComponent(t.waMsg(orderId || "—"))}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <MessageCircle className="w-4.5 h-4.5" />
            {t.support}
          </a>
          <Link href="/" className="btn-outline">
            <Home className="w-4.5 h-4.5" />
            {t.home}
            <ArrowLeft className="w-4 h-4 hidden rtl:block" />
            <ArrowRight className="w-4 h-4 rtl:hidden" />
          </Link>
        </motion.div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-app relative overflow-x-clip">
      <div className="glow-orb w-[480px] h-[480px] bg-brand-teal -top-40 -start-40" />
      <div className="glow-orb w-[420px] h-[420px] bg-brand-navy bottom-0 -end-32" />
      <div className="grid-bg absolute inset-0 opacity-30 pointer-events-none" />
      <div className="relative z-10">
        <OnboardingHeader />
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="skeleton w-full max-w-xl h-72 mx-4" />
            </div>
          }
        >
          <SuccessInner />
        </Suspense>
      </div>
    </div>
  );
}
