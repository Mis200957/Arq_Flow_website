"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from "recharts";
import { MessageSquare, Gauge, Wallet, CalendarClock, Crown, AlertTriangle, ArrowRight, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";

type Counter = Tables<"usage_counters">;
interface PlanRow { id: string; name: string; name_ar: string; message_limit: number; monthly_fee_egp: number }
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
      plan: "الباقة الحالية", used: "الرسائل المستخدمة", remaining: "المتبقي", cost: "تكلفة الذكاء",
      estDays: "أيام متبقية (تقديري)", monthly: "الاستهلاك الشهري", daily: "النشاط آخر ٣٠ يوم",
      ofLimit: "من الحد", day: "يوم", messages: "رسالة", limitReached: "لقد وصلت إلى حد رسائلك",
      warn75: "اقترب استهلاكك من الحد — راجع باقتك", warn90: "أوشكت رسائلك على الانتهاء",
      upgrade: "ترقية الباقة", buyMore: "شراء رسائل إضافية", noData: "لا توجد بيانات بعد",
      thisPeriod: "هذه الفترة", inbound: "واردة", outbound: "صادرة",
    },
    en: {
      plan: "Current Plan", used: "Messages Used", remaining: "Remaining", cost: "AI Cost",
      estDays: "Est. Days Left", monthly: "Monthly Usage", daily: "Last 30 Days Activity",
      ofLimit: "of limit", day: "day", messages: "messages", limitReached: "You've reached your message limit",
      warn75: "You're approaching your limit — review your plan", warn90: "Your messages are almost out",
      upgrade: "Upgrade Plan", buyMore: "Buy Extra Messages", noData: "No data yet",
      thisPeriod: "this period", inbound: "Inbound", outbound: "Outbound",
    },
  });

  const [current, setCurrent] = useState(initialCurrent);
  const supabase = useMemo(() => createClient(), []);

  // Realtime usage updates
  useEffect(() => {
    const ch = supabase
      .channel("usage-page:" + businessId)
      .on("postgres_changes", { event: "*", schema: "public", table: "usage_counters", filter: `business_id=eq.${businessId}` },
        (p) => { if (p.new) setCurrent(p.new as Counter); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [businessId, supabase]);

  // Evaluate thresholds (best-effort, server inserts notifications + logs automation)
  useEffect(() => {
    fetch("/api/dashboard/usage/check", { method: "POST" }).catch(() => {});
  }, []);

  const limit = current?.message_limit ?? plan?.message_limit ?? 0;
  const used = current?.messages_used ?? 0;
  const remaining = Math.max(0, limit - used);
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const cost = current?.cost_egp ?? 0;

  const estDays = useMemo(() => {
    if (!current?.period_start || used <= 0) return null;
    const start = new Date(current.period_start).getTime();
    const daysElapsed = Math.max(1, (Date.now() - start) / 86400000);
    const rate = used / daysElapsed;
    if (rate <= 0) return null;
    return Math.max(0, Math.round(remaining / rate));
  }, [current?.period_start, used, remaining]);

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
    () => history.map((h) => ({
      label: new Date(h.period_start).toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { month: "short", year: "2-digit" }),
      used: h.messages_used,
      limit: h.message_limit,
    })),
    [history, lang]
  );

  const planName = plan ? (lang === "ar" ? plan.name_ar : plan.name) : "—";
  const barColor = pct >= 90 ? "var(--danger)" : pct >= 75 ? "var(--warning)" : "var(--accent)";

  return (
    <div className="space-y-6">
      {/* Threshold banner */}
      {pct >= 75 && (
        <div className={cn(
          "card p-4 flex flex-wrap items-center gap-3 border",
          pct >= 100 ? "border-[var(--danger)] bg-[rgba(248,113,113,0.08)]" : pct >= 90 ? "border-[var(--danger)] bg-[rgba(248,113,113,0.06)]" : "border-[var(--warning)] bg-[rgba(251,191,36,0.06)]"
        )}>
          <AlertTriangle className={cn("w-5 h-5 shrink-0", pct >= 90 ? "text-[var(--danger)]" : "text-[var(--warning)]")} />
          <span className="text-sm font-semibold flex-1">
            {pct >= 100 ? t.limitReached : pct >= 90 ? t.warn90 : t.warn75} ({pct}%)
          </span>
          <div className="flex gap-2">
            <Link href="/dashboard/subscription?action=extra" className="btn-outline !py-1.5 text-sm">{t.buyMore}</Link>
            <Link href="/dashboard/subscription?action=upgrade" className="btn-primary !py-1.5 text-sm flex items-center gap-1.5"><Crown className="w-4 h-4" /> {t.upgrade}</Link>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.plan} value={planName} icon={<Crown className="w-5 h-5" />}
          hint={plan ? <span>{formatEGP(plan.monthly_fee_egp, lang)} / {lang === "ar" ? "شهر" : "mo"}</span> : null} />
        <StatCard label={t.used} value={`${used.toLocaleString()} / ${limit.toLocaleString()}`} icon={<MessageSquare className="w-5 h-5" />}
          hint={
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs"><span>{pct}%</span><span>{t.ofLimit}</span></div>
              <div className="h-1.5 rounded-full bg-[rgba(238,237,210,0.1)] overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
              </div>
            </div>
          } />
        <StatCard label={t.remaining} value={remaining.toLocaleString()} icon={<Gauge className="w-5 h-5" />} />
        <StatCard label={t.estDays} value={estDays != null ? `${estDays} ${t.day}` : "—"} icon={<CalendarClock className="w-5 h-5" />} />
      </div>

      {/* Daily activity */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-accent" /> {t.daily}</h3>
          <span className="text-sm text-muted flex items-center gap-1.5"><Wallet className="w-4 h-4" /> {formatEGP(cost, lang)} {t.thisPeriod}</span>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={dailyData} margin={{ left: -20, right: 8, top: 4 }}>
            <defs>
              <linearGradient id="usageFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity={0.4} />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,237,210,0.06)" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={{ background: "var(--bg-solid)", border: "1px solid var(--border)", borderRadius: "0.75rem", color: "var(--fg)" }} />
            <Area type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} fill="url(#usageFill)" name={t.messages} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly history */}
      <div className="card p-5">
        <h3 className="font-bold mb-4">{t.monthly}</h3>
        {monthlyData.length === 0 ? (
          <p className="text-muted text-sm">{t.noData}</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyData} margin={{ left: -20, right: 8 }} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,237,210,0.06)" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: "var(--bg-solid)", border: "1px solid var(--border)", borderRadius: "0.75rem", color: "var(--fg)" }} cursor={{ fill: "rgba(238,237,210,0.05)" }} />
              <Bar dataKey="used" radius={[6, 6, 0, 0]} name={t.used}>
                {monthlyData.map((d, i) => (
                  <Cell key={i} fill={d.limit && d.used / d.limit >= 0.9 ? "var(--danger)" : d.limit && d.used / d.limit >= 0.75 ? "var(--warning)" : "var(--accent)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
