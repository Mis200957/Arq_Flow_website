"use client";

import { useState } from "react";
import Link from "next/link";
import { Crown, CheckCircle, AlertTriangle } from "lucide-react";
import { Badge, Modal } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP, formatDate, STATUS_BADGE } from "@/lib/utils";
import { PLANS } from "@/lib/plans";
import type { Tables } from "@/lib/database.types";

type Business = Tables<"businesses">;
type Subscription = Tables<"subscriptions">;
type Plan = Tables<"plans">;
type UsageCounter = Tables<"usage_counters">;

interface Props {
  business: Business;
  subscription: Subscription | null;
  plan: Plan | null;
  usage: UsageCounter | null;
}

export default function SubscriptionClient({ business, subscription, plan, usage }: Props) {
  const { lang } = useLang();
  const [cancelModal, setCancelModal] = useState(false);

  const t = useT({
    ar: {
      currentPlan: "خطتك الحالية", usage: "الاستخدام هذا الشهر", messages: "الرسائل",
      of: "من", billingPeriod: "فترة الفاتورة", nextBilling: "الفاتورة القادمة",
      status: "الحالة", cancelSub: "إلغاء الاشتراك", cancelWarning: "هل أنت متأكد من إلغاء الاشتراك؟ سيتوقف بوتك.",
      cancel: "إلغاء", keep: "الاحتفاظ بالاشتراك", upgrade: "ترقية الخطة", viewInvoices: "عرض الفواتير",
      features: "المميزات", month: "شهر",
    },
    en: {
      currentPlan: "Your current plan", usage: "Usage this month", messages: "Messages",
      of: "of", billingPeriod: "Billing period", nextBilling: "Next billing",
      status: "Status", cancelSub: "Cancel subscription", cancelWarning: "Are you sure you want to cancel? Your bot will stop working.",
      cancel: "Cancel", keep: "Keep subscription", upgrade: "Upgrade plan", viewInvoices: "View invoices",
      features: "Features", month: "month",
    },
  });

  const usedPct = usage ? Math.min(100, Math.round((usage.messages_used / usage.message_limit) * 100)) : 0;
  const staticPlan = PLANS.find((p) => p.id === business.plan_id);

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Current plan */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold">{t.currentPlan}</h2>
          {subscription && <Badge variant={STATUS_BADGE[subscription.status] ?? "neutral"}>{subscription.status}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted text-xs mb-1">Plan</p>
            <p className="font-bold text-lg">{plan ? (lang === "ar" ? plan.name_ar : plan.name) : business.plan_id}</p>
          </div>
          <div>
            <p className="text-muted text-xs mb-1">Cost</p>
            <p className="font-bold">{formatEGP(business.monthly_fee_egp ?? 0, lang)} / {t.month}</p>
          </div>
          {subscription?.current_period_start && (
            <div>
              <p className="text-muted text-xs mb-1">{t.billingPeriod}</p>
              <p>{formatDate(subscription.current_period_start, lang)} → {formatDate(subscription.current_period_end, lang)}</p>
            </div>
          )}
          {business.next_billing_date && (
            <div>
              <p className="text-muted text-xs mb-1">{t.nextBilling}</p>
              <p>{formatDate(business.next_billing_date, lang)}</p>
            </div>
          )}
        </div>
        {staticPlan && (
          <div className="mt-4">
            <p className="text-muted text-xs mb-2">{t.features}</p>
            <ul className="space-y-1">
              {staticPlan.features[lang].map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Usage */}
      {usage && (
        <div className="card p-5">
          <h3 className="font-bold mb-4">{t.usage}</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t.messages}</span>
              <span>{usage.messages_used.toLocaleString()} {t.of} {usage.message_limit.toLocaleString()}</span>
            </div>
            <div className="h-3 rounded-full bg-[rgba(238,237,210,0.1)] overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${usedPct}%`,
                  background: usedPct > 85 ? "var(--danger)" : usedPct > 65 ? "var(--warning)" : "var(--accent)",
                }}
              />
            </div>
            <p className="text-xs text-muted">{usedPct}% {lang === "ar" ? "مستخدم" : "used"}</p>
          </div>
        </div>
      )}

      {/* Plan cards */}
      <div>
        <h3 className="font-bold mb-3">{t.upgrade}</h3>
        <div className="grid md:grid-cols-3 gap-3">
          {PLANS.filter((p) => p.id !== business.plan_id).map((p) => (
            <div key={p.id} className={cn("card p-4 card-hover", p.highlighted && "border-[var(--accent)]")}>
              {p.highlighted && <p className="text-xs text-accent font-bold mb-2">★ {lang === "ar" ? "الأكثر شيوعاً" : "Most popular"}</p>}
              <p className="font-bold">{p.name[lang]}</p>
              <p className="text-accent font-semibold mt-1">{formatEGP(p.monthlyFee, lang)} / {t.month}</p>
              <p className="text-xs text-muted mt-1">{p.messageLimit.toLocaleString()} {lang === "ar" ? "رسالة" : "messages"}</p>
              <a
                href={`https://wa.me/201029168056?text=${encodeURIComponent(lang === "ar" ? `أريد ترقية خطتي إلى ${p.name.ar}` : `I want to upgrade to ${p.name.en}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-outline w-full mt-3 text-xs"
              >
                {lang === "ar" ? "ترقية" : "Upgrade"}
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/invoices" className="btn-outline flex items-center gap-2 text-sm">
          {t.viewInvoices}
        </Link>
        {subscription?.status === "active" && (
          <button onClick={() => setCancelModal(true)} className="btn-danger text-sm">
            {t.cancelSub}
          </button>
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
            <button onClick={() => setCancelModal(false)} className="btn-danger flex-1">{t.cancel}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
