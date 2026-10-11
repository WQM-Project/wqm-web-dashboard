"use client";

import { ArrowUpRight, Download, FileJson, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "./shared";
export function QuickActions({
  onRefresh,
  onExport,
  onInspect,
  busy,
  empty,
}: {
  onRefresh: () => void;
  onExport: () => void;
  onInspect: () => void;
  busy: boolean;
  empty: boolean;
}) {
  return (
    <Panel title="Quick actions" subtitle="A closer look at your readings.">
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-between rounded-lg border-border bg-card text-xs shadow-none"
          onClick={onInspect}
          disabled={empty}
        >
          <span className="flex items-center gap-2">
            <FileJson className="size-4" />
            Inspect latest packet
          </span>
          <ArrowUpRight className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          className="w-full justify-between rounded-lg border-border bg-card text-xs shadow-none"
          onClick={onExport}
          disabled={empty}
        >
          <span className="flex items-center gap-2">
            <Download className="size-4" />
            Export selected CSV
          </span>
          <ArrowUpRight className="size-3.5" />
        </Button>
        <Button
          variant="outline"
          className="w-full justify-between rounded-lg border-border bg-card text-xs shadow-none"
          onClick={onRefresh}
          disabled={busy}
        >
          <span className="flex items-center gap-2">
            <RefreshCw className="size-4" />
            {busy ? "Refreshing…" : "Refresh readings"}
          </span>
          <ArrowUpRight className="size-3.5" />
        </Button>
      </div>
    </Panel>
  );
}
