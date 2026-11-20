"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatValue, GAP_MS, METRICS, timeLabel } from "@/lib/dashboard";
import type { MetricKey } from "@/lib/dashboard";
import { EmptyChart, Panel, tooltipStyle } from "./shared";
import type { ChartProps } from "./shared";

export function MetricTrendChart({
  readings,
  metricKey,
  onMetricChange,
}: ChartProps & {
  metricKey: MetricKey;
  onMetricChange: (key: MetricKey) => void;
}) {
  const metric = METRICS.find((item) => item.key === metricKey)!;
  // A null point breaks the line wherever the boat was off for over 30 minutes.
  const chartData: { time: string; value: number | null }[] = [];
  let previous = 0;
  for (const row of readings) {
    const value = row.payload[metricKey];
    if (value === undefined) continue;
    const t = Date.parse(row.recorded_at);
    if (previous && t - previous > GAP_MS) chartData.push({ time: "", value: null });
    chartData.push({ time: timeLabel(row.recorded_at), value });
    previous = t;
  }
  const latestValue = chartData.findLast((point) => point.value !== null)?.value ?? undefined;
  return (
    <Panel
      className="lg:col-span-3"
      title="Measurement trend"
      subtitle="Explore the readings, one parameter at a time."
      action={
        <select
          aria-label="Chart parameter"
          className="max-w-40 rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground"
          value={metricKey}
          onChange={(event) => onMetricChange(event.target.value as MetricKey)}
        >
          {METRICS.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      }
    >
      {chartData.length ? (
        <>
          <div className="mb-5 flex items-baseline gap-2">
            <span className="text-2xl font-semibold tabular-nums">
              {latestValue?.toFixed(metric.decimals) ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {metric.unit || "pH"} · latest reading
            </span>
          </div>
          <div
            className="h-60 w-full"
            role="img"
            aria-label={`${metric.label} trend for ${chartData.length} readings; exact values available in the readings table`}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ left: -20, right: 8, top: 8, bottom: 0 }}
              >
                <CartesianGrid
                  vertical={false}
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  minTickGap={55}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  dy={8}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value: number) => [
                    `${Number(value).toFixed(metric.decimals)} ${metric.unit}`,
                    metric.label,
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="var(--wqm-chart-line)"
                  fill="var(--wqm-chart-fill)"
                  strokeWidth={2}
                  dot={chartData.length === 1}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </>
      ) : (
        <EmptyChart />
      )}
    </Panel>
  );
}
