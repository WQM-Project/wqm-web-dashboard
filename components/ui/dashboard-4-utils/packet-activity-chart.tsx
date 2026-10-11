"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { timeLabel } from "@/lib/dashboard";
import { EmptyChart, Panel, tooltipStyle } from "./shared";
import type { ChartProps } from "./shared";

export function PacketActivityChart({ readings }: ChartProps) {
  const buckets = new Map<string, number>();
  for (const row of readings) {
    const hour =
      new Date(row.recorded_at).toISOString().slice(0, 13) + ":00:00Z";
    buckets.set(hour, (buckets.get(hour) || 0) + 1);
  }
  const data = [...buckets].map(([time, packets]) => ({
    time: timeLabel(time),
    packets,
  }));
  return (
    <Panel
      className="lg:col-span-2"
      title="Packet activity"
      subtitle="Stored packets per hour for the selected node."
    >
      {data.length ? (
        <div
          className="h-44"
          role="img"
          aria-label="Stored packet count per hour"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ left: -25, right: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                minTickGap={40}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <YAxis
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                cursor={{ fill: "var(--wqm-chart-fill)" }}
              />
              <Bar
                dataKey="packets"
                name="Packets"
                fill="var(--wqm-chart-line)"
                radius={[3, 3, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyChart />
      )}
    </Panel>
  );
}
