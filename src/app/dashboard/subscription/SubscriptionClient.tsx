"use client";

import { useState } from "react";
import { Crown, CheckCircle, AlertTriangle, Loader2, MessageSquarePlus, RefreshCw, Receipt, Download, ArrowUpCircle } from "lucide-react";
import { Badge, Modal } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP, formatDate, STATUS_BADGE } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import type { Tables } from "@/lib/database.types";

type Business = Tables<"businesses">;
type Subscription = Tables<"subscriptions">;
type Plan = Tables<"plans">;
type UsageCounter = Tables<"usage_counters">;
type Payment = Tables<"payments">;
type Invoice = Tables<"invoices">;

interface Props {
  business: Business;
  subscription: Subscription | null;
  plan: Plan | null;
  usage: UsageCounter | null;
  payments: Payment[];
  invoices: Invoice[];
}

const EXTRA_PACKS = [
  { id: "extra_1000", messages: 1000 },
  { id: "extra_5000", messages: 5000 },
  { id: "extra_10000", messages: 10000 },
];

export default function SubscriptionClient({ business, subscription, plan, usage, payments, invoices }: Props) {
  const { lang } = useLang();
  const [cancelModal, setCancelModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const t = useT({
    ar: {
      currentPlan: "خطتك الحالية", usage: "الاستخدام هذا الشهر", messages: "الرسائل", of: "من",
      billingPeriod: "فترة الفاتورة", nextBilling: "الفاتورة القادمة", cancelSub: "إلغاء الاشتراك",
      cancelWarning: "هل أنت متأكد من إلغاء الاشتراك؟ سيتوقف بوتك بنهاية الفترة الحالية.",
      cancel: "تأكيد الإلغاء", keep: "الاحتفاظ بالاشتراك", changePlan: "تغيير الباقة", features: "المميزات", month: "شهر",
      upgrade: "ترقية", downgrade: "تخفيض", renew: "تجديد الاشتراك", extra: "شراء رسائل إضافية",
      requested: "تم إرسال الطلب ✓", processing: "جاري الإرسال...", billing: "سجل الفواتير والمدفوعات",
      noBilling: "لا توجد مدفوعات بعد", download: "تحميل", invoice: "فاتورة", payment: "دفعة",
      reqNote: "سيتواصل فريقنا لتأكيد الدفع ثم يُطبّق التغيير تلقائياً.", message: "رسالة",
    },
    en: {
      currentPlan: "Your current plan", usage: "Usage this month", messages: "Messages", of: "of",
      billingPeriod: "Billing period", nextBilling: "Next billing", cancelSub: "Cancel subscription",
      cancelWarning: "Cancel your subscription? Your bot stops at the end of the current period.",
      cancel: "Confirm cancellation", keep: "Keep subscription", changePlan: "Change plan", features: "Features", month: "month",
      upgrade: "Upgrade", downgrade: "Downgrade", renew: "Renew subscription", extra: "Buy extra messages",
      requested: "Request sent ✓", processing: "Sending...", billing: "Billing & Payment history",
      noBilling: "No payments yet", download: "Download", invoice: "Invoice", payment: "Payment",
      reqNote: "Our team confirms payment, then the change applies automatically.", message: "messages",
    },
  });

  const usedPct = usage ? Math.min(100, Math.round((usage.messages_used / usage.message_limit) * 100)) : 0;
  const staticPlan = PLANS.find((p) => p.id === business.plan_id);
  const currentTier = PLANS.findIndex((p) => p.id === business.plan_id);

  const request = async (action: string, extra: Record<string, string> = {}) => {
    const key = action + (extra.plan_id ?? extra.pack ?? "");
    setBusy(key);
    const res = await fetch("/api/dashboard/subscription", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    setBusy(null);
    if (res.ok) { setDone(key); setTimeout(() => setDone(null), 3000); }
    setCancelModal(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Current plan */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold">{t.currentPlan}</h2>
          {subscription && <Badge variant={STATUS_BADGE[subscription.status] ?? "neutral"}>{subscription.status}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted text-xs mb-1">Plan</p><p className="font-bold text-lg">{plan ? (lang === "ar" ? plan.name_ar : plan.name) : business.plan_id}</p></div>
          <div><p className="text-muted text-xs mb-1">Cost</p><p className="font-bold">{formatEGP(business.monthly_fee_egp ?? 0, lang)} / {t.month}</p></div>
          {subscription?.current_period_start && (
            <div><p className="text-muted text-xs mb-1">{t.billingPeriod}</p><p>{formatDate(subscription.current_period_start, lang)} → {formatDate(subscription.current_period_end, lang)}</p></div>
          )}
          {business.next_billing_date && (
            <div><p className="text-muted text-xs mb-1">{t.nextBilling}</p><p>{formatDate(business.next_billing_date, lang)}</p></div>
          )}
        </div>
        {staticPlan && (
          <div className="mt-4">
            <p className="text-muted text-xs mb-2">{t.features}</p>
            <ul className="space-y-1">
              {staticPlan.features[lang].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />{f}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={() => request("renew")} disabled={busy === "renew"} className="btn-outline flex items-center gap-2 text-sm">
            {busy === "renew" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {done === "renew" ? t.requested : t.renew}
          </button>
          {subscription?.status === "active" && (
            <button onClick={() => setCancelModal(true)} className="btn-danger text-sm">{t.cancelSub}</button>
          )}
        </div>
      </div>

      {/* Usage */}
      {usage && (
        <div className="card p-5">
          <h3 className="font-bold mb-4">{t.usage}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm"><span>{t.messages}</span><span>{usage.messages_used.toLocaleString()} {t.of} {usage.message_limit.toLocaleString()}</span></div>
            <div className="h-3 rounded-full bg-[rgba(238,237,210,0.1)] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${usedPct}%`, background: usedPct > 85 ? "var(--danger)" : usedPct > 65 ? "var(--warning)" : "var(--accent)" }} />
            </div>
            <p className="text-xs text-muted">{usedPct}% {lang === "ar" ? "مستخدم" : "used"}</p>
          </div>
        </div>
      )}

      {/* Plan change (self-service) */}
      <div>
        <h3 className="font-bold mb-1">{t.changePlan}</h3>
        <p className="text-xs text-muted mb-3">{t.reqNote}</p>
        <div className="grid md:grid-cols-3 gap-3">
          {PLANS.filter((p) => p.id !== business.plan_id).map((p) => {
            const tier = PLANS.findIndex((x) => x.id === p.id);
            const isUpgrade = tier > currentTier;
            const key = "change_plan" + p.id;
            return (
              <div key={p.id} className={cn("card p-4 card-hover", p.highlighted && "border-[var(--accent)]")}>
                {p.highlighted && <p className="text-xs text-accent font-bold mb-2">★ {lang === "ar" ? "الأكثر شيوعاً" : "Most popular"}</p>}
                <p className="font-bold">{p.name[lang]}</p>
                <p className="text-accent font-semibold mt-1">{formatEGP(p.monthlyFee, lang)} / {t.month}</p>
                <p className="text-xs text-muted mt-1">{p.messageLimit.toLocaleString()} {t.message}</p>
                <button onClick={() => request("change_plan", { plan_id: p.id })} disabled={busy === key}
                  className={cn("w-full mt-3 text-xs flex items-center justify-center gap-1.5", isUpgrade ? "btn-primary" : "btn-outline")}>
                  {busy === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowUpCircle className="w-3.5 h-3.5" />}
                  {done === key ? t.requested : isUpgrade ? t.upgrade : t.downgrade}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Extra messages */}
      <div>
        <h3 className="font-bold mb-3 flex items-center gap-2"><MessageSquarePlus className="w-4 h-4 text-accent" /> {t.extra}</h3>
        <div className="grid grid-cols-3 gap-3">
          {EXTRA_PACKS.map((pack) => {
            const key = "extra_messages" + pack.id;
            return (
              <button key={pack.id} onClick={() => request("extra_messages", { pack: pack.id })} disabled={busy === key}
                className="card card-hover p-4 text-center">
                <p className="font-bold text-lg">+{pack.messages.toLocaleString()}</p>
                <p className="text-xs text-muted">{t.message}</p>
                <span className="btn-outline w-full mt-3 text-xs inline-flex items-center justify-center gap-1.5">
                  {busy === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  {done === key ? t.requested : (lang === "ar" ? "طلب" : "Request")}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Billing history */}
      <div className="card p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-accent" /> {t.billing}</h3>
        {payments.length === 0 && invoices.length === 0 ? (
          <p className="text-muted text-sm">{t.noBilling}</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3 text-sm py-2 border-b border-[var(--border)] last:border-0">
                <Receipt className="w-4 h-4 text-muted shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{t.invoice} {inv.number}</p>
                  <p className="text-xs text-muted">{formatDate(inv.created_at, lang)}</p>
                </div>
                <span className="font-semibold">{formatEGP(inv.total_egp, lang)}</span>
                <Badge variant={STATUS_BADGE[inv.status] ?? "neutral"}>{inv.status}</Badge>
                {inv.pdf_path && /^https?:\/\//.test(inv.pdf_path) && (
                  <a href={inv.pdf_path} target="_blank" rel="noopener noreferrer" className="btn-ghost !p-1.5" aria-label={t.download}><Download className="w-3.5 h-3.5" /></a>
                )}
              </div>
            ))}
            {payments.map((p) => (
              <div key={p.id} className="flex items-center gap-3 text-sm py-2 border-b border-[var(--border)] last:border-0">
                <span className={cn("w-2 h-2 rounded-full shrink-0", p.status === "approved" ? "bg-[var(--success)]" : p.status === "rejected" ? "bg-[var(--danger)]" : "bg-[var(--warning)]")} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{t.payment} · {p.payment_type} · {p.method}</p>
                  <p className="text-xs text-muted">{formatDate(p.created_at, lang)} · {p.transaction_ref}</p>
                </div>
                <span className="font-semibold">{formatEGP(p.amount_egp, lang)}</span>
                <Badge variant={STATUS_BADGE[p.status] ?? "neutral"}>{p.status}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title={t.cancelSub}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)]">
            <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0" />
            <p className="text-sm">{t.cancelWarning}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCancelModal(false)} className="btn-primary flex-1">{t.keep}</button>
            <button onClick={() => request("cancel")} disabled={busy === "cancel"} className="btn-danger flex-1">
              {busy === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : t.cancel}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
