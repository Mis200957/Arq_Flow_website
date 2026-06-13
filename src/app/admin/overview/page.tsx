import { createAdminClient } from "@/lib/supabase/admin";
import { StatCard } from "@/components/ui";
import { Users, CreditCard, MessageSquare, TrendingUp, Clock, CheckCircle } from "lucide-react";
import { formatEGP } from "@/lib/utils";
import RecentPaymentsWidget from "./RecentPaymentsWidget";
import RecentLogsWidget from "./RecentLogsWidget";
import RevenueChart from "./RevenueChart";

export const dynamic = "force-dynamic";

async function fetchOverviewData() {
  const db = createAdminClient();

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Last 6 months revenue — single query then bucket client-side
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const monthLabels: { label: string; start: Date; end: Date }[] = [];
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    monthLabels.push({ label: start.toLocaleString("en", { month: "short", year: "2-digit" }), start, end });
  }

  const [
    { count: totalClients },
    { count: activeClients },
    { count: pendingApproval },
    { count: provisioning },
    { data: allApprovedPayments },
    { count: pendingPayments },
    { data: usageData },
    { count: newClientsThisWeek },
    { data: recentPayments },
    { data: recentLogs },
  ] = await Promise.all([
    db.from("businesses").select("*", { count: "exact", head: true }),
    db.from("businesses").select("*", { count: "exact", head: true }).eq("status", "active"),
    db.from("businesses").select("*", { count: "exact", head: true }).eq("status", "pending_approval"),
    db.from("businesses").select("*", { count: "exact", head: true }).eq("status", "provisioning"),
    db.from("payments").select("amount_egp, created_at").eq("status", "approved").gte("created_at", sixMonthsAgo.toISOString()),
    db.from("payments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    db.from("usage_counters").select("messages_used").gte("period_start", startOfMonth),
    db.from("businesses").select("*", { count: "exact", head: true }).gte("created_at", startOfWeek),
    db
      .from("payments")
      .select("id, amount_egp, method, status, transaction_ref, created_at, payment_type, businesses(business_name, status), plans(name)")
      .order("created_at", { ascending: false })
      .limit(10),
    db
      .from("automation_logs")
      .select("id, level, workflow, event, created_at, businesses(business_name)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalRevenue = (allApprovedPayments ?? []).reduce((s, r) => s + Number(r.amount_egp), 0);
  const messagesThisMonth = (usageData ?? []).reduce((s, r) => s + r.messages_used, 0);

  // Build monthly revenue chart from single query result
  const months = monthLabels.map((m) => ({
    label: m.label,
    value: (allApprovedPayments ?? [])
      .filter((p) => new Date(p.created_at) >= m.start && new Date(p.created_at) < m.end)
      .reduce((s, p) => s + Number(p.amount_egp), 0),
  }));

  return {
    totalClients: totalClients ?? 0,
    activeClients: activeClients ?? 0,
    pendingApproval: pendingApproval ?? 0,
    provisioning: provisioning ?? 0,
    totalRevenue,
    pendingPayments: pendingPayments ?? 0,
    messagesThisMonth,
    newClientsThisWeek: newClientsThisWeek ?? 0,
    recentPayments: recentPayments ?? [],
    recentLogs: recentLogs ?? [],
    revenueChart: months,
  };
}

export default async function OverviewPage() {
  const data = await fetchOverviewData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Overview / نظرة عامة</h2>
        <p className="text-muted text-sm mt-1">Platform health at a glance</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        <StatCard
          label="Total Clients / إجمالي العملاء"
          value={data.totalClients}
          hint={`${data.activeClients} active · ${data.pendingApproval} pending approval · ${data.provisioning} provisioning`}
          icon={<Users className="w-5 h-5" />}
        />
        <StatCard
          label="Total Revenue / إجمالي الإيرادات"
          value={formatEGP(data.totalRevenue, "en")}
          hint="Approved payments only"
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <StatCard
          label="Pending Payments / مدفوعات معلقة"
          value={data.pendingPayments}
          hint="Awaiting approval"
          icon={<CreditCard className="w-5 h-5" />}
        />
        <StatCard
          label="Messages This Month / رسائل هذا الشهر"
          value={data.messagesThisMonth.toLocaleString()}
          hint="Across all active businesses"
          icon={<MessageSquare className="w-5 h-5" />}
        />
        <StatCard
          label="New Clients This Week / عملاء جدد هذا الأسبوع"
          value={data.newClientsThisWeek}
          hint="Last 7 days"
          icon={<Clock className="w-5 h-5" />}
        />
        <StatCard
          label="Active Businesses / أعمال نشطة"
          value={data.activeClients}
          hint={`Out of ${data.totalClients} total`}
          icon={<CheckCircle className="w-5 h-5" />}
        />
      </div>

      {/* Revenue Chart */}
      <div className="card p-6">
        <h3 className="font-bold text-lg mb-4">Revenue Last 6 Months / الإيرادات آخر 6 أشهر</h3>
        <RevenueChart data={data.revenueChart} />
      </div>

      {/* Recent Payments + Logs */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          <RecentPaymentsWidget payments={data.recentPayments as Parameters<typeof RecentPaymentsWidget>[0]["payments"]} />
        </div>
        <div>
          <RecentLogsWidget logs={data.recentLogs as Parameters<typeof RecentLogsWidget>[0]["logs"]} />
        </div>
      </div>
    </div>
  );
}
