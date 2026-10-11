"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { Reading } from "@/lib/dashboard";

export type ChartProps = { readings: Reading[] };
export function Panel({
  title,
  subtitle,
  children,
  action,
  className,
  id,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <Card
      id={id}
      className={cn(
        "gap-0 rounded-xl border-border bg-card py-0 shadow-none",
        className,
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between gap-3 px-5 py-5">
        <div>
          <h2 className="text-balance text-sm font-semibold text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
              {subtitle}
            </p>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className="px-5 pb-5">{children}</CardContent>
    </Card>
  );
}
export function EmptyChart() {
  return (
    <div className="flex h-48 items-center justify-center rounded-lg bg-background text-sm text-muted-foreground">
      No readings in this window.
    </div>
  );
}
export const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
  color: "var(--foreground)",
  boxShadow: "0 4px 12px #0000000a",
};
