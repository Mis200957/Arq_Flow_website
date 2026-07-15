"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Props {
  data: { label: string; value: number }[];
}

export default function RevenueChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(14,32,56,0.07)" />
        <XAxis
          dataKey="label"
          tick={{ fill: "#8fb3bd", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: "#8fb3bd", fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
          width={40}
        />
        <Tooltip
          contentStyle={{
            background: "rgba(17,39,66,0.95)",
            border: "1px solid rgba(184,144,99,0.15)",
            borderRadius: "0.75rem",
            color: "#eeedd2",
            fontSize: 13,
          }}
          formatter={(value: number) => [`${value.toLocaleString()} EGP`, "Revenue"]}
          cursor={{ fill: "rgba(14,32,56,0.05)" }}
        />
        <Bar
          dataKey="value"
          fill="url(#barGrad)"
          radius={[6, 6, 0, 0]}
        />
        <defs>
          <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6ba0ac" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#2a6072" stopOpacity={0.7} />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
}
