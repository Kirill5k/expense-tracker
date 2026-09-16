"use client";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatMoney } from "@/lib/money";
import type { spendingTrend } from "./selectors";
export function SpendingChart({
  data,
  currency,
}: {
  data: ReturnType<typeof spendingTrend>;
  currency: string;
}) {
  return (
    <div
      className="h-56 min-w-0 sm:h-64"
      role="img"
      aria-label={`Spending and income over this period in ${currency}. Totals and category breakdown are provided alongside the chart.`}
    >
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart
          data={data}
          barGap={2}
          margin={{ top: 16, right: 0, bottom: 0, left: -10 }}
          accessibilityLayer
        >
          <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 4" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            minTickGap={32}
            dy={8}
          />
          <YAxis
            tickFormatter={(value: number) =>
              new Intl.NumberFormat("en-GB", { notation: "compact" }).format(value / 100)
            }
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "var(--secondary)" }}
            contentStyle={{
              border: "1px solid var(--border)",
              borderRadius: 16,
              background: "var(--card)",
              color: "var(--foreground)",
              fontSize: 12,
            }}
            formatter={(value, name) => [
              formatMoney(Number(value), currency),
              name === "expense" ? "Expenses" : "Income",
            ]}
          />
          <Bar
            dataKey="income"
            name="income"
            fill="var(--income)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
          <Bar
            dataKey="expense"
            name="expense"
            fill="var(--primary)"
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
