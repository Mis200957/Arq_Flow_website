"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { MessageSquare, Gauge, Wallet, CalendarClock, Crown, AlertTriangle, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP, formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Counter = Tables<"usage_counters">;
interface PlanRow { id: string; name: string; name_ar: string; monthly_fee_egp: number }
interface Props {
  businessId: string;
  current: Counter | null;
  history: Counter[];
  plan: PlanRow | null;
  messages: { created_at: string; cost_egp: number; direction: string }[];
}

export default function UsageClient({ businessId, current: initialCurrent, history, plan, messages }: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      plan: "الباقة الحالية", balance: "الرصيد المتبقي", consumed: "المستهلك", validity: "الصلاحية",
      daysLeft: "أيام متبقية", monthly: "استهلاك الفترات", daily: "النشاط آخر ٣٠ يوم",
      ofWallet: "من رصيد الباقة", day: "يوم", messages: "رسالة",
      depleted: "خلص رصيدك", expired: "انتهت صلاحية باقتك",
      warn75: "قرب رصيدك يخلص — راجع باقتك", warn90: "رصيدك أوشك على الانتهاء",
      upgrade: "ترقية الباقة", renew: "تجديد الاشتراك", noData: "لا توجد بيانات بعد",
      thisPeriod: "هذه الفترة", validUntil: "صالح حتى",
    },
    en: {
      plan: "Current Plan", balance: "Remaining balance", consumed: "Consumed", validity: "Validity",
      daysLeft: "Days left", monthly: "Usage by period", daily: "Last 30 Days Activity",
      ofWallet: "of package balance", day: "day", messages: "messages",
      depleted: "Balance used up", expired: "Package validity expired",
      warn75: "Your balance is running low — review your plan", warn90: "Your balance is almost out",
      upgrade: "Upgrade Plan", renew: "Renew subscription", noData: "No data yet",
      thisPeriod: "this period", validUntil: "Valid until",
    },
  });

  const [current, setCurrent] = useState(initialCurrent);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    const ch = supabase
      .channel("usage-page:" + businessId)
      .on("postgres_changes", { event: "*", schema: "public", table: "usage_counters", filter: `business_id=eq.${businessId}` },
        (p) => { if (p.new) setCurrent(p.new as Counter); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [businessId, supabase]);

  useEffect(() => {
    fetch("/api/dashboard/usage/check", { method: "POST" }).catch(() => {});
  }, []);

  // wallet math (display in package-price EGP; enforcement uses real budget)
  const balance = Number(current?.balance_egp ?? 0);
  const consumed = Number(current?.cost_egp ?? 0);
  const walletTotal = Number(current?.wallet_egp ?? 0);
  const pct = balance > 0 ? Math.min(100, Math.round((consumed / balance) * 100)) : 0;
  const remainingDisplay = balance > 0 ? Math.max(0, walletTotal * (1 - consumed / balance)) : 0;
  const consumedDisplay = Math.max(0, walletTotal - remainingDisplay);
  const expiry = current?.period_end ?? null;
  const daysLeft = expiry ? Math.ceil((new Date(expiry).getTime() - Date.now()) / 86400000) : null;
  const expired = daysLeft != null && daysLeft < 0;
  const depleted = balance > 0 && consumed >= balance;

  const dailyData = useMemo(() => {
    const days: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days[d.toLocaleDateString("en-CA")] = 0;
    }
    messages.forEach((m) => {
      const key = new Date(m.created_at).toLocaleDateString("en-CA");
      if (key in days) days[key]++;
    });
    return Object.entries(days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" }),
      count,
    }));
  }, [messages, lang]);

  const monthlyData = useMemo(
    () => history.map((h) => {
      const bal = Number(h.balance_egp ?? 0);
      const cst = Number(h.cost_egp ?? 0);
      const wal = Number(h.wallet_egp ?? 0);
      const usedDisplay = bal > 0 ? Math.min(wal, wal * (cst / bal)) : 0;
      return {
        label: new Date(h.period_start).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { month: "short", day: "numeric" }),
        used: Math.round(usedDisplay),
        total: Math.round(wal),
      };
    }),
    [history, lang]
  );

  const planName = plan ? (lang === "ar" ? plan.name_ar : plan.name) : "—";
  const barColor = pct >= 90 ? "var(--danger)" : pct >= 75 ? "var(--warning)" : "var(--accent)";

  return (
    <div className="space-y-6">
      {/* Banner */}
      {(pct >= 75 || expired) && (
        <div className={cn(
          "card p-4 flex flex-wrap items-center gap-3 border",
          expired || depleted ? "border-[var(--danger)] bg-[rgba(248,113,113,0.08)]" : pct >= 90 ? "border-[var(--danger)] bg-[rgba(248,113,113,0.06)]" : "border-[var(--warning)] bg-[rgba(251,191,36,0.06)]"
        )}>
          <AlertTriangle className={cn("w-5 h-5 shrink-0", pct >= 90 || expired ? "text-[var(--danger)]" : "text-[var(--warning)]")} />
          <span className="text-sm font-semibold flex-1">
            {expired ? t.expired : depleted ? t.depleted : pct >= 90 ? t.warn90 : t.warn75}{!expired && ` (${pct}%)`}
          </span>
          <div className="flex gap-2">
            <Link href="/dashboard/subscription" className="btn-outline !py-1.5 text-sm">{t.renew}</Link>
            <Link href="/dashboard/subscription" className="btn-primary !py-1.5 text-sm flex items-center gap-1.5"><Crown className="w-4 h-4" /> {t.upgrade}</Link>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.plan} value={planName} icon={<Crown className="w-5 h-5" />}
          hint={plan ? <span>{formatEGP(plan.monthly_fee_egp, lang)}</span> : null} />
        <StatCard label={t.balance} value={formatEGP(remainingDisplay, lang)} icon={<Wallet className="w-5 h-5" />}
          hint={
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs"><span>{pct}%</span><span>{t.ofWallet}</span></div>
              <div className="h-1.5 rounded-full bg-[rgba(14,32,56,0.1)] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          } />
        <StatCard label={t.consumed} value={formatEGP(consumedDisplay, lang)} icon={<Gauge className="w-5 h-5" />} />
        <StatCard label={t.validity} value={daysLeft != null && !expired ? `${daysLeft} ${t.day}` : (expired ? t.expired : "—")}
          icon={<CalendarClock className="w-5 h-5" />}
          hint={expiry ? <span>{t.validUntil} {formatDate(expiry, lang)}</span> : null} />
      </div>

      {/* Daily activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> {t.daily}</h3>
          <span className="text-sm text-muted flex items-center gap-1.5"><MessageSquare className="w-4 h-4" /> {dailyData.reduce((s, d) => s + d.count, 0).toLocaleString()} {t.messages}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailyData} margin={{ left: -20, right: 8, top: 4 }}>
            <defs>
              <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,32,56,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--bg-solid)", border: "1px solid var(--border)", borderRadius: "0.75rem", color: "var(--fg)" }} />
            <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} fill="url(#usageFill)" name={t.messages} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Period history (EGP consumed) */}
      <div className="card p-5">
        <h3 className="font-bold mb-4">{t.monthly}</h3>
        {monthlyData.length === 0 ? (
          <p className="text-muted text-sm">{t.noData}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ left: -20, right: 8 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,32,56,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--bg-solid)", border: "1px solid var(--border)", borderRadius: "0.75rem", color: "var(--fg)" }} cursor={{ fill: "rgba(14,32,56,0.05)" }} />
              <Bar dataKey="used" radius={[6, 6, 0, 0]} name={t.consumed}>
                {monthlyData.map((d, i) => (
                  <Cell key={i} fill={d.total && d.used / d.total >= 0.9 ? "var(--danger)" : d.total && d.used / d.total >= 0.75 ? "var(--warning)" : "var(--accent)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
