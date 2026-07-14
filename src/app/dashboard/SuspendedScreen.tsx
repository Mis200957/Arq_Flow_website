"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertOctagon, RefreshCw, CheckCircle, Loader2, UploadCloud, X, LogOut, Wallet, CalendarClock,
} from "lucide-react";
import { Modal, Field } from "@/components/ui";
import { useToast } from "@/components/ui/Toast";
import { useLang, useT } from "@/lib/i18n";
import { cn, formatEGP, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import type { PaymentChannel } from "@/lib/plans";

type Business = Tables<"businesses">;
type Plan = Tables<"plans">;
type UsageCounter = Tables<"usage_counters">;

interface Props {
  business: Business;
  plan: Plan | null;
  usage: UsageCounter | null;
  accounts: Record<PaymentChannel, string>;
}

/**
 * Suspended-state full-screen guard.
 *
 * Shown by the dashboard layout whenever `businesses.status = 'suspended'`.
 * Blocks the entire dashboard UI and offers the client a single action:
 * renew the current plan. The renewal reuses the standard manual-transfer
 * flow (`POST /api/dashboard/subscription/pay`) — admin approval then runs
 * `applySubscriptionPayment` which tops up the wallet (usage_counters),
 * resets validity, flips subscriptions.status → active and businesses.status
 * → active automatically. Realtime listener below auto-refreshes the page
 * the moment the row flips so the user lands back in the dashboard with
 * no manual reload.
 */
export default function SuspendedScreen({ business, plan, usage, accounts }: Props) {
  const { lang, dir } = useLang();
  const router = useRouter();
  const { success, error } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<PaymentChannel>("instapay");
  const [txRef, setTxRef] = useState("");
  const [shotPath, setShotPath] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = useT({
    ar: {
      title: "اشتراكك انتهى",
      subtitle: "الداشبورد متوقف مؤقتاً لحد ما تجدد اشتراكك. كل بياناتك محفوظة زي ما هي.",
      walletState: "حالة الرصيد",
      expiredOn: "انتهى في",
      planLabel: "الباقة الحالية",
      amountDue: "قيمة التجديد",
      renew: "تجديد الاشتراك",
      logout: "تسجيل خروج",
      modalTitle: "تجديد الاشتراك",
      chooseMethod: "اختر طريقة الدفع",
      transferTo: "حوّل على الرقم",
      txRefL: "رقم العملية (12 رقم)",
      txRefHint: "هتلاقيه في رسالة تأكيد التحويل",
      shotL: "صورة إيصال التحويل",
      shotHint: "سكرين شوت من المحفظة أو البنك — مطلوبة",
      uploadCta: "ارفع الصورة",
      uploading: "جاري الرفع...",
      uploaded: "تم الرفع ✓",
      remove: "إزالة",
      submit: "إرسال الدفعة",
      submitting: "جاري الإرسال...",
      doneTitle: "تم استلام دفعتك ✅",
      doneBody: "فريقنا هيأكد التحويل خلال دقايق. بمجرد ما يتأكد رصيدك هيتجدد تلقائياً والداشبورد هيفتح من غير ما تعمل أي حاجة.",
      close: "تمام",
      note: "بعد ما تحوّل، اكتب رقم العملية وارفع صورة الإيصال. التجديد من غير رسوم تأسيس.",
      rollover: "أي رصيد متبقي بيتجمّع مع التجديد.",
    },
    en: {
      title: "Your subscription has ended",
      subtitle: "The dashboard is paused until you renew. All your data is intact.",
      walletState: "Wallet status",
      expiredOn: "Expired on",
      planLabel: "Current plan",
      amountDue: "Renewal amount",
      renew: "Renew subscription",
      logout: "Sign out",
      modalTitle: "Renew subscription",
      chooseMethod: "Choose a payment method",
      transferTo: "Transfer to",
      txRefL: "Transaction reference (12 digits)",
      txRefHint: "Found in your transfer confirmation",
      shotL: "Transfer screenshot",
      shotHint: "Screenshot from your wallet or bank — required",
      uploadCta: "Upload screenshot",
      uploading: "Uploading...",
      uploaded: "Uploaded ✓",
      remove: "Remove",
      submit: "Submit payment",
      submitting: "Submitting...",
      doneTitle: "Payment received ✅",
      doneBody: "Our team will confirm the transfer in minutes. Your wallet refreshes automatically and the dashboard reopens — no reload needed.",
      close: "Done",
      note: "After transferring, enter the reference and upload the receipt. No setup fee on renewal.",
      rollover: "Any leftover balance rolls over on renewal.",
    },
  });

  // Realtime: the moment admin approves and `businesses.status` flips to 'active',
  // refresh so the user lands inside the dashboard without manual reload.
  useEffect(() => {
    const ch = supabase
      .channel("biz:" + business.id)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "businesses", filter: `id=eq.${business.id}` },
        (payload) => {
          const next = (payload.new as { status?: string } | null)?.status;
          if (next && next !== "suspended") router.refresh();
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [supabase, business.id, router]);

  const ACCOUNT_LABELS: Record<PaymentChannel, string> = {
    instapay: lang === "ar" ? "إنستاباي" : "InstaPay",
    vodafone_cash: lang === "ar" ? "فودافون كاش" : "Vodafone Cash",
    wepay: lang === "ar" ? "وي باي" : "WE Pay",
  };

  const planName = plan ? (lang === "ar" ? plan.name_ar : plan.name) : business.plan_id;
  const amount = Number(plan?.monthly_fee_egp ?? business.monthly_fee_egp ?? 0);
  const expiry = usage?.period_end ?? business.next_billing_date ?? null;

  function openModal() {
    setMethod("instapay");
    setTxRef("");
    setShotPath(null);
    setSubmitted(false);
    setOpen(true);
  }

  async function uploadShot(file: File) {
    setUploading(true);
    try {
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const path = `${business.id}/${Date.now()}_${sanitized}`;
      const { error: upErr } = await supabase.storage
        .from("payment-screenshots")
        .upload(path, file);
      if (upErr) throw upErr;
      setShotPath(path);
    } catch (e) {
      error("Upload failed", (e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  async function submitPayment() {
    if (!/^\d{12}$/.test(txRef)) { error(t.txRefL); return; }
    if (!shotPath) { error(t.shotL); return; }
    if (!plan) { error("Plan not loaded"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/dashboard/subscription/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_id: plan.id,
          payment_method: method,
          transaction_ref: txRef,
          screenshot_path: shotPath,
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

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <div
      dir={dir}
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{ background: "var(--bg)" }}
    >
      <div className="glass-strong max-w-lg w-full p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-[rgba(248,113,113,0.12)] border border-[rgba(248,113,113,0.25)] flex items-center justify-center mx-auto mb-6">
          <AlertOctagon className="w-10 h-10 text-[var(--danger)]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold mb-3">{t.title}</h1>
        <p className="text-muted mb-6 leading-relaxed">{t.subtitle}</p>

        <div className="grid grid-cols-2 gap-3 text-start mb-6">
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-[11px] text-muted mb-1">{t.planLabel}</p>
            <p className="font-bold truncate">{planName}</p>
          </div>
          <div className="rounded-xl border border-[var(--border)] p-3">
            <p className="text-[11px] text-muted mb-1">{t.amountDue}</p>
            <p className="font-bold text-accent">{formatEGP(amount, lang)}</p>
          </div>
        </div>

        {expiry && (
          <div className="flex items-center justify-center gap-2 text-xs text-muted mb-6">
            <CalendarClock className="w-3.5 h-3.5" />
            <span>{t.expiredOn} {formatDate(expiry, lang)}</span>
          </div>
        )}

        <button
          onClick={openModal}
          className="btn-primary w-full flex items-center justify-center gap-2 text-base py-3"
        >
          <RefreshCw className="w-4 h-4" />
          {t.renew}
        </button>

        <button
          onClick={signOut}
          className="btn-ghost w-full mt-3 flex items-center justify-center gap-2 text-sm"
        >
          <LogOut className="w-3.5 h-3.5" />
          {t.logout}
        </button>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={t.modalTitle} wide>
        {submitted ? (
          <div className="space-y-4 text-center py-4">
            <CheckCircle className="w-12 h-12 text-[var(--success)] mx-auto" />
            <h3 className="font-bold text-lg">{t.doneTitle}</h3>
            <p className="text-sm text-muted max-w-md mx-auto">{t.doneBody}</p>
            <button onClick={() => setOpen(false)} className="btn-primary">{t.close}</button>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="rounded-xl bg-[rgba(153,207,220,0.08)] border border-[var(--accent)]/30 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted">{t.amountDue}</p>
                  <p className="text-2xl font-extrabold gradient-text">{formatEGP(amount, lang)}</p>
                </div>
                <p className="text-xs text-muted max-w-[50%] text-end flex items-center gap-1">
                  <Wallet className="w-3.5 h-3.5" /> {t.rollover}
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">{t.chooseMethod}</p>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(accounts) as PaymentChannel[]).map((ch) => (
                  <button
                    key={ch}
                    onClick={() => setMethod(ch)}
                    className={cn(
                      "rounded-xl border p-3 text-center text-sm transition",
                      method === ch
                        ? "border-[var(--accent)] bg-[rgba(153,207,220,0.1)]"
                        : "border-[var(--border)]"
                    )}
                  >
                    <p className="font-semibold">{ACCOUNT_LABELS[ch]}</p>
                  </button>
                ))}
              </div>
              <div className="mt-2 rounded-lg bg-[rgba(238,237,210,0.04)] p-3 text-sm flex items-center justify-between">
                <span className="text-muted">{t.transferTo}</span>
                <span className="font-mono font-bold text-accent" dir="ltr">{accounts[method]}</span>
              </div>
            </div>

            <Field label={t.txRefL} hint={t.txRefHint}>
              <input
                inputMode="numeric"
                className={cn(
                  "input-base font-mono",
                  txRef.length === 12 && "border-[rgba(74,222,128,0.5)]"
                )}
                value={txRef}
                onChange={(e) => setTxRef(e.target.value.replace(/\D/g, "").slice(0, 12))}
                placeholder="123456789012"
              />
            </Field>

            <div>
              <span className="block text-sm font-semibold mb-1">{t.shotL}</span>
              <p className="text-xs text-muted mb-2">{t.shotHint}</p>
              {shotPath ? (
                <div className="flex items-center gap-2 rounded-xl border border-[rgba(74,222,128,0.4)] bg-[rgba(74,222,128,0.06)] p-3 text-sm">
                  <CheckCircle className="w-4 h-4 text-[var(--success)]" />
                  <span className="flex-1 truncate">{t.uploaded}</span>
                  <button
                    onClick={() => setShotPath(null)}
                    className="btn-ghost !p-1.5"
                    aria-label={t.remove}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--border)] p-6 cursor-pointer hover:border-[var(--accent)] transition">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-accent" />
                  ) : (
                    <UploadCloud className="w-6 h-6 text-muted" />
                  )}
                  <span className="text-sm text-muted">
                    {uploading ? t.uploading : t.uploadCta}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    disabled={uploading}
                    onChange={(e) => e.target.files?.[0] && uploadShot(e.target.files[0])}
                  />
                </label>
              )}
            </div>

            <p className="text-xs text-muted">{t.note}</p>

            <button
              onClick={submitPayment}
              disabled={submitting || uploading || !shotPath || txRef.length !== 12}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t.submitting}
                </>
              ) : (
                t.submit
              )}
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}
