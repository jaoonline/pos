"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export function SalesTrendChart({
  data,
  currencySymbol,
}: {
  data: { date: string; total: number }[];
  currencySymbol: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="salesTrend" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
        <XAxis
          dataKey="date"
          tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
          tick={{ fontSize: 12 }}
          stroke="var(--muted-foreground)"
        />
        <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" width={60} />
        <Tooltip
          formatter={(value) => [`${currencySymbol}${Number(value ?? 0).toFixed(2)}`, "Sales"]}
          labelFormatter={(value) => (value ? new Date(String(value)).toLocaleDateString() : "")}
          contentStyle={{ fontSize: 12 }}
        />
        <Area type="monotone" dataKey="total" stroke="var(--primary)" fill="url(#salesTrend)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
