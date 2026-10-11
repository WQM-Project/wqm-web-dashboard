"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { timeLabel } from "@/lib/dashboard";
import { EmptyChart, Panel, tooltipStyle } from "./shared";
import type { ChartProps } from "./shared";

export function WaterTemperatureChart({ readings }: ChartProps) {
  const latest = readings.at(-1)?.payload;
  const difference = latest
    ? Math.abs(latest.temp_w1 - latest.temp_w2).toFixed(2)
    : "—";
  return (
    <Panel
      title="Water temperature"
      subtitle="Primary and backup probes, in °C."
    >
      <p className="mt-1 text-3xl font-semibold tabular-nums">
        {difference}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          °C apart
        </span>
      </p>
      <p className="mb-6 mt-2 text-xs text-muted-foreground">
        Difference in the latest reading
      </p>
      {readings.length ? (
        <div
          className="h-40"
          role="img"
          aria-label="Primary and backup water temperature trends"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={readings.map((row) => ({
                time: timeLabel(row.recorded_at),
                primary: row.payload.temp_w1,
                backup: row.payload.temp_w2,
              }))}
              margin={{ left: -30, right: 3 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                minTickGap={70}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                domain={["auto", "auto"]}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number, name: string) => [
                  `${Number(value).toFixed(2)} °C`,
                  name,
                ]}
              />
              <Line
                type="monotone"
                dataKey="primary"
                name="Primary"
                stroke="var(--wqm-chart-line)"
                strokeWidth={2}
                dot={readings.length === 1}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="backup"
                name="Backup"
                stroke="var(--wqm-chart-secondary)"
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart />
      )}
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span>● Primary</span>
        <span className="text-muted-foreground">● Backup</span>
      </div>
    </Panel>
  );
}
