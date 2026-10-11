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

export function DissolvedSolidsChart({ readings }: ChartProps) {
  const latest = readings.at(-1)?.payload;
  const value = latest?.tds_ppm.toFixed(1) ?? "—";
  return (
    <Panel
      title="Dissolved solids"
      subtitle="Total dissolved solids (TDS)."
    >
      <p className="mt-1 text-3xl font-semibold tabular-nums">
        {value}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          ppm
        </span>
      </p>
      <p className="mb-6 mt-2 text-xs text-muted-foreground">
        Latest stored reading
      </p>
      {readings.length ? (
        <div
          className="h-40"
          role="img"
          aria-label="Total dissolved solids trend in parts per million"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={readings.map((row) => ({
                time: timeLabel(row.recorded_at),
                tds: row.payload.tds_ppm,
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
                  `${Number(value).toFixed(1)} ppm`,
                  name,
                ]}
              />
              <Line
                type="monotone"
                dataKey="tds"
                name="TDS"
                stroke="var(--wqm-chart-line)"
                strokeWidth={2}
                dot={readings.length === 1}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart />
      )}
      <div className="mt-4 flex gap-4 text-xs text-muted-foreground">
        <span>● TDS · ppm</span>
      </div>
    </Panel>
  );
}
