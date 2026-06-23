import { createAdminClient } from "@/lib/supabase/admin";
import AnalyticsDashboard from "./AnalyticsDashboard";

export const dynamic = "force-dynamic";

async function fetchAnalyticsData() {
  const db = createAdminClient();
  const now = new Date();

  // Build last 12 months buckets
  const months: { key: string; label: string; start: Date; end: Date }[] = [];
  for (let i = 11; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    months.push({
      key: start.toISOString(),
      label: start.toLocaleString("en", { month: "short", year: "2-digit" }),
      start,
      end,
    });
  }

  const [
    { data: allPayments },
    { data: allBusinesses },
    { data: usageData },
    { data: plans },
  ] = await Promise.all([
    db.from("payments").select("amount_egp, status, created_at"),
    db.from("businesses").select("created_at, business_type, plan_id, status"),
    db.from("usage_counters").select("total_tokens, period_start"),
    db.from("plans").select("id, name"),
  ]);

  // Revenue by month
  const revenueByMonth = months.map((m) => ({
    label: m.label,
    value: (allPayments ?? [])
      .filter(
        (p) =>
          p.status === "approved" &&
          new Date(p.created_at) >= m.start &&
          new Date(p.created_at) < m.end
      )
      .reduce((s, p) => s + Number(p.amount_egp), 0),
  }));

  // Signups by month
  const signupsByMonth = months.map((m) => ({
    label: m.label,
    value: (allBusinesses ?? []).filter(
      (b) => new Date(b.created_at) >= m.start && new Date(b.created_at) < m.end
    ).length,
  }));

  // Tokens by month
  const tokensByMonth = months.map((m) => ({
    label: m.label,
    value: (usageData ?? [])
      .filter(
        (u) =>
          u.period_start &&
          new Date(u.period_start) >= m.start &&
          new Date(u.period_start) < m.end
      )
      .reduce((s, u) => s + Number(u.total_tokens ?? 0), 0),
  }));

  // Plan distribution
  const planCounts: Record<string, number> = {};
  const planNames: Record<string, string> = {};
  for (const p of plans ?? []) planNames[p.id] = p.name;
  for (const b of allBusinesses ?? []) {
    planCounts[b.plan_id] = (planCounts[b.plan_id] ?? 0) + 1;
  }
  const planDistribution = Object.entries(planCounts).map(([id, count]) => ({
    name: planNames[id] ?? id,
    count,
  }));

  // Business type distribution
  const typeCounts: Record<string, number> = {};
  for (const b of allBusinesses ?? []) {
    typeCounts[b.business_type] = (typeCounts[b.business_type] ?? 0) + 1;
  }
  const typeDistribution = Object.entries(typeCounts).map(([type, count]) => ({
    name: type,
    count,
  }));

  return { revenueByMonth, signupsByMonth, tokensByMonth, planDistribution, typeDistribution };
}

export default async function AnalyticsPage() {
  const data = await fetchAnalyticsData();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold gradient-text">Analytics / التحليلات</h2>
        <p className="text-muted text-sm mt-1">Platform-wide metrics and trends</p>
      </div>
      <AnalyticsDashboard {...data} />
    </div>
  );
}
