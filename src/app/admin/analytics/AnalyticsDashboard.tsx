"use client";

import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Download } from "lucide-react";

interface Props {
  revenueByMonth: { label: string; value: number }[];
  signupsByMonth: { label: string; value: number }[];
  tokensByMonth: { label: string; value: number }[];
  planDistribution: { name: string; count: number }[];
  typeDistribution: { name: string; count: number }[];
}

const CHART_COLORS = ["#6ba0ac", "#2a6072", "#eeedd2", "#4ade80", "#fbbf24", "#f87171"];

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "rgba(17,39,66,0.95)",
    border: "1px solid rgba(238,237,210,0.15)",
    borderRadius: "0.75rem",
    color: "#eeedd2",
    fontSize: 12,
  },
  cursor: { fill: "rgba(238,237,210,0.04)" },
};

const AXIS_PROPS = {
  tick: { fill: "#8fb3bd", fontSize: 11 },
  axisLine: false as const,
  tickLine: false as const,
};

function exportCSV(data: { label: string; value: number }[], filename: string) {
  const csv = ["Label,Value", ...data.map((d) => `${d.label},${d.value}`)].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AnalyticsDashboard({
  revenueByMonth,
  signupsByMonth,
  tokensByMonth,
  planDistribution,
  typeDistribution,
}: Props) {
  const totalRevenue = revenueByMonth.reduce((s, d) => s + d.value, 0);
  const totalSignups = signupsByMonth.reduce((s, d) => s + d.value, 0);
  const totalTokens = tokensByMonth.reduce((s, d) => s + d.value, 0);
  const totalPlan = planDistribution.reduce((s, d) => s + d.count, 0);
  const totalType = typeDistribution.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Revenue Area Chart */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold">Revenue (12 months) / الإيرادات</h3>
            <p className="text-muted text-sm">Total: {totalRevenue.toLocaleString()} EGP</p>
          </div>
          <button
            onClick={() => exportCSV(revenueByMonth, "revenue.csv")}
            className="btn-ghost text-xs gap-1"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={revenueByMonth}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6ba0ac" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6ba0ac" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,237,210,0.07)" />
            <XAxis dataKey="label" {...AXIS_PROPS} />
            <YAxis {...AXIS_PROPS} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={40} />
            <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [`${v.toLocaleString()} EGP`]} />
            <Area dataKey="value" stroke="#6ba0ac" fill="url(#revGrad)" strokeWidth={2} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Signups + Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">Signups / التسجيلات</h3>
              <p className="text-muted text-sm">Total: {totalSignups}</p>
            </div>
            <button onClick={() => exportCSV(signupsByMonth, "signups.csv")} className="btn-ghost text-xs gap-1">
              <Download className="w-3.5 h-3.5" />CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={signupsByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,237,210,0.07)" />
              <XAxis dataKey="label" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} width={30} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="value" fill="#2a6072" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold">Tokens / التوكينز</h3>
              <p className="text-muted text-sm">Total: {totalTokens.toLocaleString()}</p>
            </div>
            <button onClick={() => exportCSV(tokensByMonth, "tokens.csv")} className="btn-ghost text-xs gap-1">
              <Download className="w-3.5 h-3.5" />CSV
            </button>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={tokensByMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(238,237,210,0.07)" />
              <XAxis dataKey="label" {...AXIS_PROPS} />
              <YAxis {...AXIS_PROPS} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={40} />
              <Tooltip {...TOOLTIP_STYLE} formatter={(v: number) => [v.toLocaleString()]} />
              <Line dataKey="value" stroke="#eeedd2" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Plan + Type distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Plan distribution — CSS donut */}
        <div className="card p-6">
          <h3 className="font-bold mb-4">Plan Distribution / توزيع الخطط</h3>
          {planDistribution.length === 0 ? (
            <p className="text-muted text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {planDistribution.map((p, i) => {
                const pct = totalPlan > 0 ? Math.round((p.count / totalPlan) * 100) : 0;
                return (
                  <div key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span>{p.name}</span>
                      <span className="text-muted">{p.count} ({pct}%)</span>
                    </div>
                    <div className="h-2 bg-[rgba(238,237,210,0.08)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Business type distribution */}
        <div className="card p-6">
          <h3 className="font-bold mb-4">Business Types / أنواع الأعمال</h3>
          {typeDistribution.length === 0 ? (
            <p className="text-muted text-sm">No data</p>
          ) : (
            <div className="space-y-3">
              {typeDistribution
                .sort((a, b) => b.count - a.count)
                .map((t, i) => {
                  const pct = totalType > 0 ? Math.round((t.count / totalType) * 100) : 0;
                  return (
                    <div key={t.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="capitalize">{t.name.replace(/_/g, " ")}</span>
                        <span className="text-muted">{t.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-[rgba(238,237,210,0.08)] rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${pct}%`, background: CHART_COLORS[i % CHART_COLORS.length] }}
                        />
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
