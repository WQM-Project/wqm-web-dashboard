"use client";

// Adapted from 21st.dev "audit-log" (corr). The original's filter bar depends on
// a file that is not part of this project, so it is replaced by simple type
// chips. Timeline layout and the right-click menu are kept.
import * as React from "react";
import { Copy, ExternalLink } from "lucide-react";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";

export type AuditLogItem = {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  actor?: string;
  type?: string;
  status?: string;
  icon?: React.ReactNode;
  /** Optional accent for the icon ring (any CSS colour). */
  tone?: string;
};

export function AuditLog({
  items,
  enableFilters = true,
  onOpenRecord,
  emptyText = "Nothing to show.",
  className,
}: {
  items: AuditLogItem[];
  enableFilters?: boolean;
  onOpenRecord?: (item: AuditLogItem) => void;
  emptyText?: string;
  className?: string;
}) {
  const types = React.useMemo(
    () => Array.from(new Set(items.map((item) => item.type).filter(Boolean) as string[])).sort(),
    [items],
  );
  const [type, setType] = React.useState<string | null>(null);
  const visibleItems = type ? items.filter((item) => item.type === type) : items;

  return (
    <div className={cn("grid gap-3", className)}>
      {enableFilters && types.length > 1 ? (
        <div className="flex flex-wrap gap-1.5">
          {[null, ...types].map((t) => (
            <button
              key={t ?? "all"}
              onClick={() => setType(t)}
              aria-pressed={type === t}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-xs capitalize",
                type === t ? "border-foreground bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
              )}
            >
              {t ?? "All"}
            </button>
          ))}
        </div>
      ) : null}

      <div className="rounded-md border bg-card">
        {visibleItems.length > 0 ? (
          visibleItems.map((item, index) => (
            <ContextMenu key={item.id}>
              <ContextMenuTrigger asChild>
                <div className="relative flex gap-3 px-4 py-3">
                  {index < visibleItems.length - 1 ? (
                    <div className="absolute top-9 bottom-0 left-[1.55rem] w-px bg-border" />
                  ) : null}
                  <div
                    className="z-1 flex size-5 shrink-0 items-center justify-center rounded-full border bg-background text-muted-foreground"
                    style={item.tone ? { borderColor: item.tone, color: item.tone } : undefined}
                  >
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-sm font-medium">{item.title}</div>
                      <div className="text-xs tabular-nums text-muted-foreground">{item.timestamp}</div>
                    </div>
                    {item.description ? (
                      <div className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</div>
                    ) : null}
                    {item.actor || item.type || item.status ? (
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                        {item.actor ? <span className="font-medium">{item.actor}</span> : null}
                        {item.type ? (
                          <span className="rounded-full border px-2 py-0.5 capitalize text-muted-foreground">{item.type}</span>
                        ) : null}
                        {item.status ? (
                          <span className="rounded-full border px-2 py-0.5 text-muted-foreground">{item.status}</span>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent className="w-44">
                {onOpenRecord ? (
                  <ContextMenuItem onSelect={() => onOpenRecord(item)}>
                    <ExternalLink className="mr-2 size-4" />
                    Open record
                  </ContextMenuItem>
                ) : null}
                {onOpenRecord ? <ContextMenuSeparator /> : null}
                <ContextMenuItem onSelect={() => navigator.clipboard?.writeText(`${item.title} · ${item.timestamp}`)}>
                  <Copy className="mr-2 size-4" />
                  Copy event
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

export default AuditLog;
