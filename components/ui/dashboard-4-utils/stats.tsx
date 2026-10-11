"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  Droplets,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { Card } from "@/components/ui/card";
import { METRICS } from "@/lib/dashboard";
import type { ChartProps } from "./shared";

const icons = [Droplets, Waves, Wind, Thermometer];
export function DashboardStats({ readings }: ChartProps) {
  const latest = readings.at(-1)?.payload;
  const first = readings[0]?.payload;
  return (
    <>
      {METRICS.slice(0, 4).map((metric, index) => {
        const Icon = icons[index];
        const value = latest?.[metric.key];
        const delta =
          value !== undefined && first && readings.length > 1
            ? value - first[metric.key]
            : null;
        const Change =
          delta !== null && delta < 0 ? ArrowDownRight : ArrowUpRight;
        return (
          <Card
            key={metric.key}
            className="gap-0 rounded-xl border-border bg-card p-5 shadow-none"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">{metric.label}</span>
              <Icon className="size-4" strokeWidth={1.5} />
            </div>
            <div className="mt-4 flex items-end justify-between gap-2">
              <div className="whitespace-nowrap">
                <span className="text-3xl font-semibold tabular-nums text-foreground">
                  {value?.toFixed(metric.decimals) ?? "—"}
                </span>
                <span className="ml-1.5 text-xs text-muted-foreground">
                  {metric.unit}
                </span>
              </div>
              <div
                className="hidden h-10 w-20 shrink-0 sm:block lg:hidden xl:block"
                aria-hidden="true"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={readings
                      .slice(-24)
                      .map((row) => ({ value: row.payload[metric.key] }))}
                  >
                    <YAxis hide domain={["dataMin", "dataMax"]} />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="var(--wqm-chart-line)"
                      fill="var(--wqm-chart-fill)"
                      strokeWidth={1.5}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
              {delta !== null && (
                <>
                  <Change className="size-3.5" />
                  <span className="font-medium tabular-nums text-foreground">
                    {delta >= 0 ? "+" : ""}
                    {delta.toFixed(metric.decimals)} {metric.unit}
                  </span>
                </>
              )}
              <span>
                {delta === null
                  ? latest
                    ? "One reading; no comparison yet"
                    : "No reading available"
                  : "over selected window"}
              </span>
            </div>
          </Card>
        );
      })}
    </>
  );
}
