"use client";

import { Ship } from "lucide-react";
import { Panel } from "./shared";
import type { Reading } from "@/lib/dashboard";

export function NodeSummary({ readings }: { readings: Reading[] }) {
  return (
    <Panel title="Boat overview" subtitle="Measurement and upload history">
      <div className="mb-5 flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Ship className="size-5 text-muted-foreground" />
        </span>
        <div>
          <p className="text-xs font-semibold">Boat 01</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            One boat, one sensing node
          </p>
        </div>
      </div>
      <p className="text-2xl font-semibold tabular-nums">
        {readings.length}
        <span className="ml-2 text-xs font-normal text-muted-foreground">
          packets in this window
        </span>
      </p>
      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        Boat and LoRa setup is pending. Stored packets do not indicate live
        hardware connectivity.
      </p>
    </Panel>
  );
}
