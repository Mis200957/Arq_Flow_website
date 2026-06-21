"use client";

import { useMemo, useState } from "react";
import {
  Crown, CheckCircle, AlertTriangle, Loader2, RefreshCw, Receipt, Download,
  ArrowUpCircle, Wallet, CalendarClock, UploadCloud, X,
} from "lucide-react";
import { Badge, Modal, Field } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP, formatDate, STATUS_BADGE } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Business = Tables<"businesses">;
type Subscription = Tables<"subscriptions">;
type Plan = Tables<"plans">;
type UsageCounter = Tables<"usage_counters">;
type Payment = Tables<"payments">;
type Invoice = Tables<"invoices">;

type Channel = "instapay" | "vodafone_cash" | "wepay";

interface Props {
  business: Business;
  subscription: Subscription | null;
  plan: Plan | null;
  usage: UsageCounter | null;
  payments: Payment[];
  invoices: Invoice[];
  plans: Plan[];
  accounts: Record<Channel, string>;
}

export default function SubscriptionClient({
  business, subscription, plan, usage, payments, invoices, plans, accounts,
}: Props) {
  const { lang } = useLang();
  const { success, error } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const [cancelModal, setCancelModal] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  // payment modal state
  const [payPlan, setPayPlan] = useState<Plan | null>(null);
  const [method, setMethod] = useState<Channel>("instapay");
  const [txRef, setTxRef] = useState("");
  const [shotPath, setShotPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = useT({
    ar: {
      currentPlan: "خطتك الحالية", cost: "سعر الباقة", month: "للباقة",
      billingPeriod: "فترة الاشتراك", nextBilling: "ينتهي في", cancelSub: "إيقاف التجديد",
      cancelWarning: "متأكد إنك عايز توقف التجديد؟ بوتك هيكمل شغال لحد ما الرصيد أو الصلاحية تخلص.",
      cancel: "تأكيد", keep: "رجوع", changePlan: "غيّر الباقة", features: "المميزات",
      upgrade: "ترقية", downgrade: "تخفيض", renew: "تجديد الاشتراك",
      wallet: "رصيد المحادثات", remaining: "المتبقي", of: "من", validUntil: "صالح حتى",
      daysLeft: "يوم متبقي", expired: "انتهت الصلاحية", depleted: "خلص الرصيد", active: "نشط",
      billing: "سجل الفواتير والمدفوعات", noBilling: "لا توجد مدفوعات بعد",
      download: "تحميل", invoice: "فاتورة", payment: "دفعة",
      // payment modal
      payTitle: "ادفع وفعّل", payRenew: "تجديد", payUpgrade: "ترقية إلى",
      amountDue: "المبلغ المطلوب", chooseMethod: "اختر طريقة الدفع", transferTo: "حوّل على الرقم",
      setupDiffL: "فرق رسوم التأسيس", pkgL: "رصيد الباقة",
      txRefL: "رقم العملية (12 رقم)", txRefHint: "هتلاقيه في رسالة تأكيد التحويل",
      shotL: "صورة إيصال التحويل", shotHint: "سكرين شوت من المحفظة أو البنك — مطلوبة",
      uploadCta: "ارفع الصورة", uploading: "جاري الرفع...", uploaded: "تم الرفع ✓", remove: "إزالة",
      submit: "إرسال الدفعة", submitting: "جاري الإرسال...",
      doneTitle: "تم استلام دفعتك ✅",
      doneBody: "فريقنا هيأكد التحويل وبعدها رصيدك هيتجدد تلقائياً. هتوصلك إشعارات في اللوحة.",
      note: "بعد ما تحوّل، اكتب رقم العملية وارفع صورة الإيصال — نفس طريقة أول مرة. الترقية والتجديد من غير رسوم تأسيس.",
      rollover: "أي رصيد متبقي بيتجمّع مع التجديد.", close: "تمام",
    },
    en: {
      currentPlan: "Your current plan", cost: "Package price", month: "/ package",
      billingPeriod: "Subscription window", nextBilling: "Expires on", cancelSub: "Stop auto-renew",
      cancelWarning: "Stop renewing? Your bot keeps running until the balance or validity runs out.",
      cancel: "Confirm", keep: "Back", changePlan: "Change plan", features: "Features",
      upgrade: "Upgrade", downgrade: "Downgrade", renew: "Renew subscription",
      wallet: "Conversation balance", remaining: "Remaining", of: "of", validUntil: "Valid until",
      daysLeft: "days left", expired: "Validity expired", depleted: "Balance used up", active: "Active",
      billing: "Billing & Payment history", noBilling: "No payments yet",
      download: "Download", invoice: "Invoice", payment: "Payment",
      payTitle: "Pay & activate", payRenew: "Renew", payUpgrade: "Upgrade to",
      amountDue: "Amount due", chooseMethod: "Choose a payment method", transferTo: "Transfer to",
      setupDiffL: "Setup-fee difference", pkgL: "Package balance",
      txRefL: "Transaction reference (12 digits)", txRefHint: "Found in your transfer confirmation",
      shotL: "Transfer screenshot", shotHint: "Screenshot from your wallet or bank app — required",
      uploadCta: "Upload screenshot", uploading: "Uploading...", uploaded: "Uploaded ✓", remove: "Remove",
      submit: "Submit payment", submitting: "Submitting...",
      doneTitle: "Payment received ✅",
      doneBody: "Our team confirms the transfer and your balance renews automatically. You'll get dashboard notifications.",
      note: "After transferring, enter the reference and upload the receipt — same as your first payment. No setup fee on renewal/upgrade.",
      rollover: "Any leftover balance rolls over on renewal.", close: "Done",
    },
  });

  const pickName = (p: Plan | null) => (p ? (lang === "ar" ? p.name_ar : p.name) : business.plan_id);

  // wallet math
  const balance = Number(usage?.balance_egp ?? 0);
  const consumed = Number(usage?.cost_egp ?? 0);
  const walletTotal = Number(usage?.wallet_egp ?? 0);
  const usedPct = balance > 0 ? Math.min(100, Math.round((consumed / balance) * 100)) : 0;
  const remainingDisplay = balance > 0 ? Math.max(0, walletTotal * (1 - consumed / balance)) : 0;
  const expiry = usage?.period_end ?? business.next_billing_date ?? null;
  const daysLeft = expiry ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000) : null;
  const expired = daysLeft != null && daysLeft < 0;
  const depleted = balance > 0 && consumed >= balance;
  const walletState = expired ? t.expired : depleted ? t.depleted : t.active;
  const walletTone = expired || depleted ? "danger" : "success";

  const ACCOUNT_LABELS: Record<Channel, string> = {
    instapay: lang === "ar" ? "إنستاباي" : "InstaPay",
    vodafone_cash: lang === "ar" ? "فودافون كاش" : "Vodafone Cash",
    wepay: lang === "ar" ? "وي باي" : "WE Pay",
  };

  const currentTier = plan?.tier_level ?? 0;

  function openPay(p: Plan) {
    setPayPlan(p);
    setMethod("instapay");
    setTxRef("");
    setShotPath(null);
    setSubmitted(false);
  }
  function closePay() {
    setPayPlan(null);
  }

  async function uploadShot(file: File) {
    setUploading(true);
    try {
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const path = `${business.id}/${Date.now()}_${sanitized}`;
      const { error: upErr } = await supabase.storage.from("payment-screenshots").upload(path, file);
      if (upErr) throw upErr;
      setShotPath(path);
    } catch (e) {
      error("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submitPayment() {
    if (!payPlan) return;
    if (!/^\d{12}$/.test(txRef)) { error(t.txRefL); return; }
    if (!shotPath) { error(t.shotL); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/subscription/pay", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: payPlan.id, payment_method: method,
          transaction_ref: txRef, screenshot_path: shotPath,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed");
      setSubmitted(true);
      success(t.doneTitle);
    } catch (e) {
      error("Failed", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelSub() {
    setBusy("cancel");
    await fetch("/api/dashboard/subscription", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    }).catch(() => {});
    setBusy(null);
    setCancelModal(false);
    success(lang === "ar" ? "تم إرسال الطلب" : "Request sent");
  }

  // Renewal (same plan) = package price only. Upgrade (higher tier) = setup-fee
  // difference + new package price. Downgrade = package price only.
  const isSamePlan = payPlan ? payPlan.id === business.plan_id : false;
  const isUpgradeIntent = payPlan ? (payPlan.tier_level ?? 0) > (plan?.tier_level ?? 0) : false;
  const pkgPrice = payPlan ? Number(payPlan.monthly_fee_egp) : 0;
  const setupDiff = isUpgradeIntent
    ? Math.max(0, Number(payPlan?.setup_fee_egp ?? 0) - Number(plan?.setup_fee_egp ?? 0))
    : 0;
  const payAmount = pkgPrice + setupDiff;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Current plan + wallet */}
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Crown className="w-6 h-6 text-accent" />
          <h2 className="text-xl font-bold">{t.currentPlan}</h2>
          {subscription && <Badge variant={STATUS_BADGE[subscription.status] ?? "neutral"}>{subscription.status}</Badge>}
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div><p className="text-muted text-xs mb-1">Plan</p><p className="font-bold text-lg">{pickName(plan)}</p></div>
          <div><p className="text-muted text-xs mb-1">{t.cost}</p><p className="font-bold">{formatEGP(business.monthly_fee_egp ?? plan?.monthly_fee_egp ?? 0, lang)} {t.month}</p></div>
        </div>

        {plan && Array.isArray((lang === "ar" ? plan.features_ar : plan.features)) && (
          <div className="mt-4">
            <p className="text-muted text-xs mb-2">{t.features}</p>
            <ul className="space-y-1">
              {((lang === "ar" ? plan.features_ar : plan.features) as string[]).map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle className="w-3.5 h-3.5 text-[var(--success)] shrink-0" />{f}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-5">
          <button onClick={() => plan && openPay(plan)} className="btn-primary flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" /> {t.renew}
          </button>
          {subscription?.status === "active" && (
            <button onClick={() => setCancelModal(true)} className="btn-danger text-sm">{t.cancelSub}</button>
          )}
        </div>
      </div>

      {/* Wallet status */}
      {usage && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><Wallet className="w-4 h-4 text-accent" /> {t.wallet}</h3>
            <Badge variant={walletTone}>{walletState}</Badge>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{t.remaining}</span>
              <span className="font-semibold">{formatEGP(remainingDisplay, lang)} {t.of} {formatEGP(walletTotal, lang)}</span>
            </div>
            <div className="h-3 rounded-full bg-[rgba(238,237,210,0.1)] overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${usedPct}%`, background: usedPct > 85 ? "var(--danger)" : usedPct > 65 ? "var(--warning)" : "var(--accent)" }} />
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>{usedPct}% {lang === "ar" ? "مستهلك" : "used"}</span>
              {expiry && (
                <span className="flex items-center gap-1">
                  <CalendarClock className="w-3.5 h-3.5" /> {t.validUntil} {formatDate(expiry, lang)}
                  {daysLeft != null && !expired && ` · ${daysLeft} ${t.daysLeft}`}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plan change */}
      <div>
        <h3 className="font-bold mb-1">{t.changePlan}</h3>
        <p className="text-xs text-muted mb-3">{t.note}</p>
        <div className="grid md:grid-cols-3 gap-3">
          {plans.filter((p) => p.id !== business.plan_id).map((p) => {
            const isUpgrade = (p.tier_level ?? 0) > currentTier;
            return (
              <div key={p.id} className={cn("card p-4 card-hover", p.highlighted && "border-[var(--accent)]")}>
                {p.highlighted && <p className="text-xs text-accent font-bold mb-2">★ {lang === "ar" ? "الأكثر شيوعاً" : "Most popular"}</p>}
                <p className="font-bold">{pickName(p)}</p>
                <p className="text-accent font-semibold mt-1">{formatEGP(p.monthly_fee_egp, lang)} {t.month}</p>
                <button onClick={() => openPay(p)}
                  className={cn("w-full mt-3 text-xs flex items-center justify-center gap-1.5", isUpgrade ? "btn-primary" : "btn-outline")}>
                  <ArrowUpCircle className="w-3.5 h-3.5" /> {isUpgrade ? t.upgrade : t.downgrade}
                </button>
              </div>
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

      {/* Payment modal */}
      <Modal open={!!payPlan} onClose={closePay} title={isSamePlan ? `${t.payRenew} — ${pickName(payPlan)}` : `${t.payUpgrade} ${pickName(payPlan)}`} wide>
        {submitted ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle className="w-12 h-12 text-[var(--success)] mx-auto" />
            <h3 className="font-bold text-lg">{t.doneTitle}</h3>
            <p className="text-sm text-muted max-w-md mx-auto">{t.doneBody}</p>
            <button onClick={closePay} className="btn-primary">{t.close}</button>
          </div>
        ) : (
          <div className="space-y-5">
            {/* amount */}
            <div className="rounded-xl bg-[rgba(107,160,172,0.08)] border border-[var(--accent)]/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">{t.amountDue}</p>
                  <p className="text-2xl font-extrabold gradient-text">{formatEGP(payAmount, lang)}</p>
                </div>
                <p className="text-xs text-muted max-w-[50%] text-end">{t.rollover}</p>
              </div>
              {setupDiff > 0 && (
                <div className="mt-3 pt-3 border-t border-[var(--border)] text-xs text-muted space-y-1">
                  <div className="flex justify-between"><span>{t.setupDiffL}</span><span>{formatEGP(setupDiff, lang)}</span></div>
                  <div className="flex justify-between"><span>{t.pkgL}</span><span>{formatEGP(pkgPrice, lang)}</span></div>
                </div>
              )}
            </div>

            {/* method */}
            <div>
              <p className="text-sm font-semibold mb-2">{t.chooseMethod}</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(accounts) as Channel[]).map((ch) => (
                  <button key={ch} onClick={() => setMethod(ch)}
                    className={cn("rounded-xl border p-3 text-center text-sm transition", method === ch ? "border-[var(--accent)] bg-[rgba(107,160,172,0.1)]" : "border-[var(--border)]")}>
                    <p className="font-semibold">{ACCOUNT_LABELS[ch]}</p>
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-lg bg-[rgba(238,237,210,0.04)] p-3 text-sm flex items-center justify-between">
                <span className="text-muted">{t.transferTo}</span>
                <span className="font-mono font-bold text-accent" dir="ltr">{accounts[method]}</span>
              </div>
            </div>

            {/* tx ref */}
            <Field label={t.txRefL} hint={t.txRefHint}>
              <input
                inputMode="numeric"
                className={cn("input-base font-mono", txRef.length === 12 && "border-[rgba(74,222,128,0.5)]")}
                value={txRef}
                onChange={(e) => setTxRef(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="123456789012"
              />
            </Field>

            {/* screenshot */}
            <div>
              <span className="block text-sm font-semibold mb-1">{t.shotL}</span>
              <p className="text-xs text-muted mb-2">{t.shotHint}</p>
              {shotPath ? (
                <div className="flex items-center gap-2 rounded-xl border border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.06)] p-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  <span className="flex-1 truncate">{t.uploaded}</span>
                  <button onClick={() => setShotPath(null)} className="btn-ghost !p-1.5" aria-label={t.remove}><X className="w-4 h-4" /></button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] p-6 cursor-pointer hover:border-[var(--accent)] transition">
                  {uploading ? <Loader2 className="w-6 h-6 animate-spin text-accent" /> : <UploadCloud className="w-6 h-6 text-muted" />}
                  <span className="text-sm text-muted">{uploading ? t.uploading : t.uploadCta}</span>
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && uploadShot(e.target.files[0])} />
                </label>
              )}
            </div>

            <button onClick={submitPayment} disabled={submitting || uploading || !shotPath || txRef.length !== 12}
              className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> {t.submitting}</> : t.submit}
            </button>
          </div>
        )}
      </Modal>

      {/* Cancel modal */}
      <Modal open={cancelModal} onClose={() => setCancelModal(false)} title={t.cancelSub}>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgba(248,113,113,0.08)] border border-[rgba(248,113,113,0.2)]">
            <AlertTriangle className="w-5 h-5 text-[var(--danger)] shrink-0" />
            <p className="text-sm">{t.cancelWarning}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setCancelModal(false)} className="btn-primary flex-1">{t.keep}</button>
            <button onClick={cancelSub} disabled={busy === "cancel"} className="btn-danger flex-1">
              {busy === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : t.cancel}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
