"use client";

import { useState, useMemo } from "react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid,
} from "recharts";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP } from "@/lib/utils";
import { StatCard } from "@/components/ui";
import { TrendingUp, AlertTriangle, DollarSign, MessageSquare } from "lucide-react";

interface Props {
  businessId: string;
  messages: Array<{ created_at: string; cost_egp: number; direction: string; intent: string | null }>;
  orders: Array<{ created_at: string; total_egp: number; status: string }>;
  escalations: Array<{ created_at: string; resolved: boolean }>;
}

const RANGES = [7, 14, 30, 90] as const;
type Range = typeof RANGES[number];

function groupByDay<T extends { created_at: string }>(items: T[], days: number) {
  const map: Record<string, T[]> = {};
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    map[key] = [];
  }
  items.forEach((item) => {
    const key = item.created_at.slice(0, 10);
    if (key in map) map[key].push(item);
  });
  return map;
}

export default function AnalyticsClient({ messages, orders, escalations }: Props) {
  const { lang } = useLang();
  const [range, setRange] = useState<Range>(30);

  const t = useT({
    ar: {
      messages: "الرسائل", orders: "الطلبات", cost: "التكلفة (ج.م)", escalationRate: "معدل التصعيد",
      intents: "أكثر النوايا", days7: "٧ أيام", days14: "١٤ يوم", days30: "٣٠ يوم", days90: "٩٠ يوم",
      totalMessages: "إجمالي الرسائل", totalRevenue: "إجمالي الإيرادات", totalCost: "إجمالي التكلفة",
    },
    en: {
      messages: "Messages", orders: "Orders", cost: "Cost (EGP)", escalationRate: "Escalation Rate",
      intents: "Top Intents", days7: "7 days", days14: "14 days", days30: "30 days", days90: "90 days",
      totalMessages: "Total Messages", totalRevenue: "Total Revenue", totalCost: "Total Cost",
    },
  });

  const rangeLabel: Record<Range, string> = {
    7: t.days7, 14: t.days14, 30: t.days30, 90: t.days90,
  };

  const recentMessages = useMemo(
    () => messages.filter((m) => new Date(m.created_at) >= new Date(Date.now() - range * 86400000)),
    [messages, range]
  );
  const recentOrders = useMemo(
    () => orders.filter((o) => new Date(o.created_at) >= new Date(Date.now() - range * 86400000)),
    [orders, range]
  );
  const recentEsc = useMemo(
    () => escalations.filter((e) => new Date(e.created_at) >= new Date(Date.now() - range * 86400000)),
    [escalations, range]
  );

  const msgByDay = useMemo(() => {
    const grouped = groupByDay(recentMessages, range);
    return Object.entries(grouped).map(([date, msgs]) => ({
      date: date.slice(5),
      count: msgs.length,
      cost: msgs.reduce((s, m) => s + m.cost_egp, 0),
    }));
  }, [recentMessages, range]);

  const ordersByDay = useMemo(() => {
    const grouped = groupByDay(recentOrders, range);
    return Object.entries(grouped).map(([date, ords]) => ({
      date: date.slice(5),
      count: ords.length,
      revenue: ords.reduce((s, o) => s + o.total_egp, 0),
    }));
  }, [recentOrders, range]);

  const totalMessages = recentMessages.length;
  const totalRevenue = recentOrders.reduce((s, o) => s + o.total_egp, 0);
  const totalCost = recentMessages.reduce((s, m) => s + m.cost_egp, 0);
  const escalationRate = recentEsc.length > 0 && totalMessages > 0
    ? ((recentEsc.length / totalMessages) * 100).toFixed(1)
    : "0.0";

  // Top intents
  const intentCounts: Record<string, number> = {};
  recentMessages.forEach((m) => {
    if (m.intent) intentCounts[m.intent] = (intentCounts[m.intent] ?? 0) + 1;
  });
  const topIntents = Object.entries(intentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([intent, count]) => ({ intent, count }));

  const tooltipStyle = { background: "var(--bg-solid)", border: "1px solid var(--border)", borderRadius: "0.75rem", color: "var(--fg)" };

  return (
    <div className="space-y-6">
      {/* Range picker */}
      <div className="flex gap-1">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              "text-xs px-3 py-1.5 rounded-full font-semibold border transition-all",
              range === r
                ? "bg-[rgba(27,27,30,0.2)] text-accent border-[var(--accent)]"
                : "text-muted border-[var(--border)] hover:border-[var(--border-strong)]"
            )}
          >
            {rangeLabel[r]}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label={t.totalMessages} value={totalMessages.toLocaleString()} icon={<MessageSquare className="w-5 h-5" />} />
        <StatCard label={t.totalRevenue} value={formatEGP(totalRevenue, lang)} icon={<TrendingUp className="w-5 h-5" />} />
        <StatCard label={t.totalCost} value={formatEGP(totalCost, lang)} icon={<DollarSign className="w-5 h-5" />} />
        <StatCard label={t.escalationRate} value={`${escalationRate}%`} icon={<AlertTriangle className="w-5 h-5" />} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="font-bold mb-4">{t.messages}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={msgByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,27,30,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "var(--fg-muted)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4">{t.orders}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ordersByDay} barSize={8}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,27,30,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "var(--fg-muted)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="var(--accent)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4">{t.cost}</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={msgByDay}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(27,27,30,0.06)" />
              <XAxis dataKey="date" tick={{ fill: "var(--fg-muted)", fontSize: 10 }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fill: "var(--fg-muted)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatEGP(v, lang)} />
              <Area type="monotone" dataKey="cost" stroke="var(--accent)" fill="rgba(27,27,30,0.15)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h3 className="font-bold mb-4">{t.intents}</h3>
          {topIntents.length === 0 ? (
            <p className="text-muted text-sm">—</p>
          ) : (
            <div className="space-y-2">
              {topIntents.map(({ intent, count }) => {
                const maxCount = topIntents[0].count;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={intent}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="truncate max-w-[70%]">{intent}</span>
                      <span className="text-muted">{count}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[rgba(27,27,30,0.1)] overflow-hidden">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
