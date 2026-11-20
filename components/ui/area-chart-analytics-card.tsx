"use client";

// Adapted from 21st.dev "area-chart-analytics-card": same layout (headline value,
// badge, small area chart, side stat), but driven by props instead of demo data.
import { Area, AreaChart, XAxis, YAxis } from "recharts";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export type AnalyticsCardProps = {
  title: string;
  info?: string;
  value: string;
  unit?: string;
  badge?: { text: string; tone: "good" | "warn" | "bad" };
  data: { label: string; value: number }[];
  color?: string;
  side?: { value: string; label: string };
  format?: (value: number) => string;
  className?: string;
};

const BADGE_TONE = {
  good: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-500",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-500",
  bad: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-500",
};

export function AnalyticsCard({
  title,
  info,
  value,
  unit,
  badge,
  data,
  color = "var(--color-cyan-600)",
  side,
  format = (v) => v.toFixed(2),
  className,
}: AnalyticsCardProps) {
  const chartConfig: ChartConfig = { value: { label: title, color } };
  return (
    <Card className={cn("flex h-full w-full flex-col gap-0 overflow-hidden p-0 shadow-none", className)}>
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 px-5 pt-4 pb-0">
        <div className="flex flex-row items-center gap-1">
          <CardTitle className="whitespace-nowrap text-sm font-medium text-muted-foreground">{title}</CardTitle>
          {info && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger aria-label={`About ${title}`}>
                  <svg width={18} height={18} viewBox="0 0 20 20" fill="none" className="size-4 text-muted-foreground/50">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M10 16.25a6.25 6.25 0 100-12.5 6.25 6.25 0 000 12.5zm1.116-3.041l.1-.408a1.709 1.709 0 01-.25.083 1.176 1.176 0 01-.308.048c-.193 0-.329-.032-.407-.095-.079-.064-.118-.184-.118-.359a3.514 3.514 0 01.118-.672l.373-1.318c.037-.121.062-.255.075-.4a3.73 3.73 0 00.02-.304.866.866 0 00-.292-.678c-.195-.174-.473-.26-.833-.26-.2 0-.412.035-.636.106-.224.07-.459.156-.704.256l-.1.409c.073-.028.16-.057.262-.087.101-.03.2-.045.297-.045.198 0 .331.034.4.1.07.066.105.185.105.354 0 .093-.01.197-.034.31a6.216 6.216 0 01-.084.36l-.374 1.325c-.033.14-.058.264-.073.374-.015.11-.022.22-.022.325 0 .272.1.496.301.673.201.177.483.265.846.265.236 0 .443-.03.621-.092s.417-.152.717-.27zM11.05 7.85a.772.772 0 00.26-.587.78.78 0 00-.26-.59.885.885 0 00-.628-.244.893.893 0 00-.63.244.778.778 0 00-.264.59c0 .23.088.426.263.587a.897.897 0 00.63.243.888.888 0 00.629-.243z"
                      fill="currentColor"
                    />
                  </svg>
                </TooltipTrigger>
                <TooltipContent className="max-w-70">
                  <p className="text-xs">{info}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        {badge && <Badge className={cn("shrink-0 whitespace-nowrap rounded-full border-0 text-xs", BADGE_TONE[badge.tone])}>{badge.text}</Badge>}
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-3 p-0 pt-2">
        <div className="flex items-baseline gap-1.5 px-5">
          <span className="text-3xl font-medium tracking-tight tabular-nums">{value}</span>
          {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
        </div>

        <div className={cn("mt-auto grid h-[90px] border-t border-border", side ? "grid-cols-[1fr_120px]" : "grid-cols-1")}>
          <ChartContainer config={chartConfig} className="aspect-auto h-full w-full">
            <AreaChart accessibilityLayer data={data} margin={{ right: -5, left: 0, top: 6, bottom: 0 }}>
              <XAxis dataKey="label" hide />
              <YAxis hide domain={["dataMin", "dataMax"]} />
              <ChartTooltip
                content={<ChartTooltipContent formatter={(v) => `${format(Number(v))}${unit ? ` ${unit}` : ""}`} />}
                cursor={{ stroke: "var(--color-border)", strokeWidth: 1 }}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke={color}
                fill={color}
                fillOpacity={0.15}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, fill: color, stroke: "#ffffff", strokeWidth: 2 }}
              />
            </AreaChart>
          </ChartContainer>
          {side && (
            <div className="flex flex-col items-start justify-end border-l-2 px-4 pb-4" style={{ borderColor: color }}>
              <div className="text-sm font-semibold tabular-nums text-foreground">{side.value}</div>
              <div className="text-xs font-medium text-muted-foreground">{side.label}</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
