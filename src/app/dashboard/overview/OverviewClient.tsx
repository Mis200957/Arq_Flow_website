"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  MessageSquare, ShoppingCart, Users, AlertTriangle, ArrowRight,
} from "lucide-react";
import { StatCard, Badge } from "@/components/ui";
import { useT, useLang } from "@/lib/i18n";
import { cn, formatEGP, timeAgo, STATUS_BADGE } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/database.types";
import { resolveModules } from "@/lib/modules";
import { getIcon } from "@/lib/modules/icons";

type UsageCounter = Tables<"usage_counters">;
type Business = Tables<"businesses">;

interface Props {
  business: Business;
  usage: UsageCounter | null;
  ordersToday: number;
  totalCustomers: number;
  escalations: number;
  recentMessages: Array<{ id: string; content: string | null; direction: string; created_at: string; media_type: string; customer_id: string | null }>;
  recentOrders: Array<{ id: string; order_number: string; total_egp: number; status: string; created_at: string; customer_id: string | null }>;
  weekMessages: Array<{ created_at: string }>;
}

function buildWeekChart(msgs: Array<{ created_at: string }>, lang: "ar" | "en") {
  const days: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const key = d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { weekday: "short" });
    days[key] = 0;
  }
  msgs.forEach((m) => {
    const d = new Date(m.created_at);
    const key = d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-GB", { weekday: "short" });
    if (key in days) days[key]++;
  });
  return Object.entries(days).map(([day, count]) => ({ day, count }));
}

export default function OverviewClient({
  business, usage: initialUsage, ordersToday, totalCustomers,
  escalations, recentMessages, recentOrders, weekMessages,
}: Props) {
  const { lang } = useLang();
  const t = useT({
    ar: {
      messagesUsed: "الرسائل المستخدمة",
      limit: "الحد",
      ordersToday: "طلبات اليوم",
      customers: "إجمالي العملاء",
      escalations: "تصعيدات غير محلولة",
      weekActivity: "نشاط الأسبوع",
      recentConvs: "أحدث المحادثات",
      recentOrders: "أحدث الطلبات",
      quickActions: "إجراءات سريعة",
      addFaq: "أضف سؤالاً شائعاً",
      addProduct: "أضف منتجاً",
      viewConvs: "عرض المحادثات",
      viewAll: "عرض الكل",
      noMessages: "لا توجد رسائل بعد",
      noOrders: "لا توجد طلبات بعد",
      of: "من",
    },
    en: {
      messagesUsed: "Messages Used",
      limit: "Limit",
      ordersToday: "Orders Today",
      customers: "Total Customers",
      escalations: "Unresolved Escalations",
      weekActivity: "Week Activity",
      recentConvs: "Recent Conversations",
      recentOrders: "Recent Orders",
      quickActions: "Quick Actions",
      addFaq: "Add FAQ",
      addProduct: "Add Product",
      viewConvs: "View Conversations",
      viewAll: "View All",
      noMessages: "No messages yet",
      noOrders: "No orders yet",
      of: "of",
    },
  });

  const [usage, setUsage] = useState(initialUsage);
  const supabase = useMemo(() => createClient(), []);

  // Industry-aware overview: quick actions + which panels to show
  // are driven by the business type. Legacy/unknown types keep the
  // current behaviour (orders shown, commerce quick actions).
  const { quickActions, nav } = useMemo(
    () => resolveModules(business.business_type),
    [business.business_type]
  );
  const availableQuickActions = quickActions.filter((m) => m.available);
  const showOrders = nav.some((m) => m.key === "orders" && m.available);

  useEffect(() => {
    const channel = supabase
      .channel("usage:" + business.id)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "usage_counters", filter: `business_id=eq.${business.id}` },
        (payload) => {
          if (payload.new) setUsage(payload.new as UsageCounter);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [business.id, supabase]);

  const usedPct = usage
    ? Math.min(100, Math.round((usage.messages_used / usage.message_limit) * 100))
    : 0;

  const chartData = buildWeekChart(weekMessages, lang);
  const maxMessages = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label={t.messagesUsed}
          value={usage ? `${usage.messages_used.toLocaleString()} / ${usage.message_limit.toLocaleString()}` : "—"}
          hint={
            usage ? (
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{usedPct}%</span>
                  <span>{t.limit}: {usage.message_limit.toLocaleString()}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[rgba(238,237,210,0.1)] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${usedPct}%`,
                      background: usedPct > 85 ? "var(--danger)" : usedPct > 65 ? "var(--warning)" : "var(--accent)",
                    }}
                  />
                </div>
              </div>
            ) : null
          }
          icon={<MessageSquare className="w-5 h-5" />}
        />
        {showOrders && (
          <StatCard
            label={t.ordersToday}
            value={ordersToday}
            icon={<ShoppingCart className="w-5 h-5" />}
          />
        )}
        <StatCard
          label={t.customers}
          value={totalCustomers.toLocaleString()}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label={t.escalations}
          value={escalations}
          hint={escalations > 0 ? <Link href="/dashboard/conversations?filter=escalated" className="text-accent hover:underline text-xs">{t.viewAll}</Link> : null}
          icon={<AlertTriangle className="w-5 h-5" />}
        />
      </div>

      {/* Charts + quick actions */}
      <div className="grid lg:grid-cols-3 gap-4">
        {/* Week bar chart */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="font-bold mb-4">{t.weekActivity}</h3>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={chartData} barSize={24}>
              <XAxis dataKey="day" tick={{ fill: "var(--fg-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "var(--bg-solid)", border: "1px solid var(--border)", borderRadius: "0.75rem", color: "var(--fg)" }}
                cursor={{ fill: "rgba(238,237,210,0.05)" }}
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.count === maxMessages ? "var(--accent)" : "rgba(107,160,172,0.3)"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Quick actions — industry-aware */}
        <div className="card p-5">
          <h3 className="font-bold mb-4">{t.quickActions}</h3>
          <div className="space-y-2">
            {availableQuickActions.map((mod) => {
              const Icon = getIcon(mod.icon);
              const label = lang === "ar" ? mod.label.ar : mod.label.en;
              return (
                <Link
                  key={mod.key}
                  href={mod.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(238,237,210,0.06)] transition-colors group"
                >
                  <div className="w-8 h-8 rounded-lg bg-[rgba(107,160,172,0.12)] flex items-center justify-center">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="text-sm font-medium flex-1">{label}</span>
                  <ArrowRight className={cn("w-4 h-4 text-muted group-hover:text-accent transition-colors", lang === "ar" ? "rotate-180" : "")} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent rows */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Recent messages */}
        <div className={cn("card p-5", !showOrders && "lg:col-span-2")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">{t.recentConvs}</h3>
            <Link href="/dashboard/conversations" className="text-xs text-accent hover:underline">{t.viewAll}</Link>
          </div>
          {recentMessages.length === 0 ? (
            <p className="text-muted text-sm">{t.noMessages}</p>
          ) : (
            <div className="space-y-3">
              {recentMessages.map((m) => (
                <div key={m.id} className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    m.direction === "inbound" ? "bg-[var(--success)]" : "bg-[var(--accent)]"
                  )} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm truncate">{m.content ?? `[${m.media_type}]`}</p>
                    <p className="text-xs text-muted mt-0.5">{timeAgo(m.created_at, lang)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent orders — only for industries that use the Orders module */}
        {showOrders && (
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">{t.recentOrders}</h3>
              <Link href="/dashboard/orders" className="text-xs text-accent hover:underline">{t.viewAll}</Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-muted text-sm">{t.noOrders}</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium">{o.order_number}</p>
                      <p className="text-xs text-muted">{formatEGP(o.total_egp, lang)}</p>
                    </div>
                    <Badge variant={STATUS_BADGE[o.status] ?? "neutral"}>{o.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
