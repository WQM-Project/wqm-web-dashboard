"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ChevronRight,
  Database,
  Download,
  LayoutDashboard,
  Radio,
  RefreshCw,
  Rows3,
  FlaskConical,
  ShieldCheck,
  Moon,
  Sun,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { dateLabel, METRICS, timeLabel } from "@/lib/dashboard";
import type { DashboardData, MetricKey, Reading } from "@/lib/dashboard";
import { DashboardStats } from "./dashboard-4-utils/stats";
import { MetricTrendChart } from "./dashboard-4-utils/metric-trend-chart";
import { DissolvedSolidsChart } from "./dashboard-4-utils/dissolved-solids-chart";
import { PacketActivityChart } from "./dashboard-4-utils/packet-activity-chart";
import { NodeSummary } from "./dashboard-4-utils/node-summary";
import { QuickActions } from "./dashboard-4-utils/quick-actions";
import { Panel } from "./dashboard-4-utils/shared";
import { DashboardLogo } from './dashboard-4-utils/dashboard-logo';
import { BoatMap } from "./dashboard-4-utils/boat-map";

type View = "overview" | "readings" | "nodes";
const navigation = [
  { key: "overview" as const, label: "Overview", icon: LayoutDashboard },
  { key: "readings" as const, label: "Readings", icon: Rows3 },
  { key: "nodes" as const, label: "Boat", icon: Radio },
];

function ReadingsTable({
  readings,
  onInspect,
}: {
  readings: Reading[];
  onInspect: (row: Reading) => void;
}) {
  const [page, setPage] = useState(0);
  const size = 8;
  const pages = Math.max(1, Math.ceil(readings.length / size));
  const current = Math.min(page, pages - 1);
  const rows = [...readings]
    .reverse()
    .slice(current * size, (current + 1) * size);
  return (
    <Panel
      title="Recent readings"
      subtitle="Exact stored values. Times are shown in IST."
      className="lg:col-span-4"
      action={
        <span className="rounded-md bg-muted px-2 py-1 text-xs tabular-nums text-muted-foreground">
          {readings.length} packets
        </span>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              {[
                "Time · IST",
                "Node",
                "pH",
                "Turbidity · NTU",
                "DO · mg/L",
                "Water · °C",
                "Packet",
              ].map((label) => (
                <th key={label} className="pb-3 font-medium">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.packet_id}
                className="border-b border-border last:border-0 hover:bg-background"
              >
                <td
                  className="py-3.5 tabular-nums"
                  title={dateLabel(row.recorded_at)}
                >
                  {timeLabel(row.recorded_at)}
                </td>
                <td className="font-medium">Boat 01</td>
                <td className="tabular-nums">{row.payload.pH.toFixed(2)}</td>
                <td className="tabular-nums">
                  {row.payload.turb_ntu.toFixed(1)}
                </td>
                <td className="tabular-nums">
                  {row.payload.do_mgl.toFixed(2)}
                </td>
                <td className="tabular-nums">
                  {row.payload.temp_w1.toFixed(1)}
                </td>
                <td>
                  <button
                    className="flex items-center gap-1 rounded px-1 py-1 text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-neutral-900"
                    onClick={() => onInspect(row)}
                    aria-label={`Inspect packet ${row.packet_id}`}
                  >
                    {row.packet_id.slice(0, 8)}
                    <ArrowUpRight className="size-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No readings in this window. Try another data source or time window.
        </p>
      )}
      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        <span>
          Page {current + 1} of {pages}
        </span>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-md text-xs"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 rounded-md text-xs"
            disabled={current === pages - 1}
            onClick={() => setPage(current + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Panel>
  );
}

export function Dashboard({
  initialData = null,
  initialTheme = "light",
}: {
  initialData?: DashboardData | null;
  initialTheme?: "light" | "dark";
}) {
  const [theme, setTheme] = useState<"light" | "dark">(initialTheme);
  useEffect(() => {
    try {
      const saved = localStorage.getItem("wqm-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* The server-rendered cookie preference remains available. */
    }
  }, []);
  function toggleTheme() {
    const next = theme === "light" ? "dark" : "light";
    setTheme(next);
    try {
      localStorage.setItem("wqm-theme", next);
    } catch {
      /* Cookie still persists the preference. */
    }
    document.cookie = `wqm-theme=${next};Path=/;Max-Age=31536000;SameSite=Lax${location.protocol === "https:" ? ";Secure" : ""}`;
  }
  const [data, setData] = useState(initialData);
  const [source, setSource] = useState<"demo" | "gateway">("demo");
  const [hours, setHours] = useState(24);
  const [metric, setMetric] = useState<MetricKey>("pH");
  const [view, setView] = useState<View>("overview");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(
    initialData ? "" : "Readings could not be loaded. Try refreshing.",
  );
  const [inspected, setInspected] = useState<Reading | null>(null);
  const [sourceInfoOpen, setSourceInfoOpen] = useState(false);
  const requestSequence = useRef(0);
  const refresh = useCallback(async () => {
    const sequence = ++requestSequence.current;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/dashboard?source=${source}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok)
        throw new Error("Readings could not be loaded. Try refreshing.");
      const next: DashboardData = await response.json();
      if (requestSequence.current === sequence) setData(next);
    } catch (cause) {
      if (requestSequence.current === sequence)
        setError(
          cause instanceof Error ? cause.message : "Could not load readings.",
        );
    } finally {
      if (requestSequence.current === sequence) setBusy(false);
    }
  }, [source]);
  useEffect(() => {
    void refresh();
    return () => {
      requestSequence.current++;
    };
  }, [refresh]);
  const active = data?.source === source ? data : null;
  const all = active?.readings || [];
  const nodes = [...new Set(all.map((row) => row.device_id))].sort();
  const selectedNode = source === "demo" ? "DEMO-001" : "WQM-001";
  const reference = all.at(-1)?.recorded_at;
  const cutoff = reference ? Date.parse(reference) - hours * 3600000 : 0;
  const windowRows = all.filter((row) => Date.parse(row.recorded_at) >= cutoff);
  const readings = windowRows.filter((row) => row.device_id === selectedNode);
  const latest = readings.at(-1);
  const demo = source === "demo";
  function exportCsv() {
    const header = [
      "packet_id",
      "device_id",
      "recorded_at_utc",
      ...METRICS.map((item) => item.key),
      "node_uptime_ms",
    ];
    const lines = readings.map((row) =>
      [
        row.packet_id,
        row.device_id,
        row.recorded_at,
        ...METRICS.map((item) => row.payload[item.key]),
        row.payload.ts,
      ].join(","),
    );
    const url = URL.createObjectURL(
      new Blob([header.join(",") + "\n" + lines.join("\n")], {
        type: "text/csv;charset=utf-8;",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `wqm-${source === "demo" ? "workspace" : "gateway"}-boat-01-${hours}h.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div
      data-theme={theme}
      className={cn(
        "wqm-workspace min-h-dvh bg-background text-foreground",
        theme === "dark" && "wqm-dark dark",
      )}
    >
      <div className="mx-auto flex min-h-dvh max-w-[1800px]">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-card px-4 py-7 md:flex">
          <Link href="/" className="mb-9 flex items-center gap-3 px-3">
            <DashboardLogo theme={theme} size={48} />
            <span className="text-lg font-semibold">
              WQM
              <span className="block text-[10px] font-normal text-muted-foreground">
                Water Quality Monitor
              </span>
            </span>
          </Link>
          <p className="mb-3 px-3 text-[10px] font-medium uppercase text-muted-foreground">
            Workspace
          </p>
          <nav aria-label="Dashboard navigation" className="space-y-1">
            {navigation.map((item) => (
              <button
                key={item.key}
                onClick={() => setView(item.key)}
                aria-current={view === item.key ? "page" : undefined}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium focus-visible:outline-2 focus-visible:outline-neutral-900",
                  view === item.key
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-background",
                )}
              >
                <item.icon className="size-4" strokeWidth={1.5} />
                {item.label}
              </button>
            ))}
          </nav>
          <div className="mt-8 border-t border-border pt-5">
            <p className="px-3 text-[10px] font-medium uppercase text-muted-foreground">
              Project
            </p>
            <a
              href="https://github.com/WQM-Project"
              target="_blank"
              rel="noreferrer"
              className="mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-xs text-muted-foreground hover:bg-background"
            >
              Source repositories
              <ArrowUpRight className="size-3.5" />
            </a>
            <Link
              href="/"
              className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground"
            >
              <ArrowLeft className="size-3.5" />
              Back to project
            </Link>
          </div>
          <div className="mt-auto rounded-xl border border-border bg-background p-4">
            <FlaskConical className="mb-3 size-5 text-muted-foreground" />
            <p className="text-xs font-semibold">Built for the river.</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Explore the workspace while boat and LoRa integration are in
              progress.
            </p>
          </div>
          <div className="mt-5 flex items-center gap-2 px-2">
            <DashboardLogo theme={theme} size={32} decorative />
            <div className="text-xs">
              <p className="font-medium">WQM Project</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                Public viewing workspace
              </p>
            </div>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="flex min-h-16 flex-wrap items-center justify-between gap-3 border-b border-border bg-card px-5 py-3 lg:px-8">
            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/"
                className="flex items-center gap-2 font-semibold md:font-normal md:text-muted-foreground"
              >
                <DashboardLogo theme={theme} size={28} />
                <span className="md:hidden">WQM</span>
              </Link>
              <ChevronRight className="size-3 text-muted-foreground" />
              <span className="capitalize">{view}</span>
            </div>
            <div className="flex max-w-full flex-wrap items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-lg border-border bg-card"
                aria-label={
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
                title={
                  theme === "light"
                    ? "Switch to dark mode"
                    : "Switch to light mode"
                }
                onClick={toggleTheme}
              >
                {theme === "light" ? (
                  <Moon className="size-4" />
                ) : (
                  <Sun className="size-4" />
                )}
              </Button>
              <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                <ShieldCheck className="size-3.5" />
                Read-only workspace
              </span>
              <select
                aria-label="Data source"
                value={source}
                onChange={(event) => {
                  setSource(event.target.value as "demo" | "gateway");
                  setHours(24);
                }}
                className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
              >
                <option value="demo">Workspace readings</option>
                <option value="gateway">Gateway history</option>
              </select>
              <Button
                variant="ghost"
                size="icon"
                className="size-8"
                aria-label="About these readings"
                onClick={() => setSourceInfoOpen(true)}
              >
                <Info className="size-4" />
              </Button>
            </div>
          </header>
          <main className="mx-auto max-w-[1440px] px-5 py-7 lg:px-8">
            <nav
              className="mb-5 flex flex-wrap gap-2 md:hidden"
              aria-label="Mobile dashboard navigation"
            >
              {navigation.map((item) => (
                <Button
                  key={item.key}
                  size="sm"
                  variant={view === item.key ? "default" : "outline"}
                  onClick={() => setView(item.key)}
                >
                  {item.label}
                </Button>
              ))}
            </nav>
            <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="mb-2 text-[10px] font-medium uppercase text-muted-foreground">
                  Monitoring workspace
                </p>
                <h1 className="text-balance text-2xl font-semibold">
                  {view === "overview"
                    ? "Water, in perspective."
                    : view === "readings"
                      ? "Every reading, in detail."
                      : "Your monitoring boat."}
                </h1>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Water-quality measurements and trends for Boat 01.
                </p>
              </div>
              <Button
                variant="outline"
                className="rounded-lg border-border bg-card text-xs shadow-none"
                onClick={refresh}
                disabled={busy}
              >
                <RefreshCw className="size-3.5" />
                {busy ? "Refreshing…" : "Refresh"}
              </Button>
            </div>
            {error && (
              <div
                role="alert"
                className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                {error}
                <button onClick={refresh} className="ml-3 underline">
                  Retry
                </button>
              </div>
            )}
            {active?.truncated && (
              <p className="mb-4 text-xs text-muted-foreground">
                Showing the latest 500 stored packets. Export covers this loaded
                window only.
              </p>
            )}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg border border-border bg-card px-3 py-2 text-xs">
                  Boat 01
                </span>
                <div
                  className="flex gap-0.5 rounded-lg border border-border bg-card p-1"
                  aria-label="Chart time window"
                >
                  {[1, 6, 24].map((value) => (
                    <button
                      key={value}
                      aria-pressed={hours === value}
                      onClick={() => setHours(value)}
                      className={cn(
                        "rounded-md px-3 py-1 text-[11px] focus-visible:outline-2",
                        hours === value
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted",
                      )}
                    >
                      {value}h
                    </button>
                  ))}
                </div>
              </div>
              <span className="text-[11px] text-muted-foreground">
                {reference
                  ? `Window ends ${dateLabel(reference)} IST`
                  : busy
                    ? "Loading readings…"
                    : "No stored readings"}
              </span>
            </div>
            {busy && !active ? (
              <div
                role="status"
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
              >
                {[0, 1, 2, 3].map((value) => (
                  <div
                    key={value}
                    className="h-40 rounded-xl border border-border bg-card p-5"
                  >
                    <div className="h-3 w-20 rounded bg-muted" />
                    <div className="mt-7 h-8 w-28 rounded bg-muted" />
                    <div className="mt-5 h-3 w-32 rounded bg-muted" />
                  </div>
                ))}
                <span className="sr-only">Loading dashboard</span>
              </div>
            ) : (
              <>
                {view === "overview" && (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <DashboardStats readings={readings} />
                    <MetricTrendChart
                      readings={readings}
                      metricKey={metric}
                      onMetricChange={setMetric}
                    />
                    <DissolvedSolidsChart readings={readings} />
                    <BoatMap demo={demo} theme={theme} />
                    <PacketActivityChart readings={readings} />
                    <NodeSummary readings={windowRows} />
                    <QuickActions
                      onRefresh={refresh}
                      onExport={exportCsv}
                      onInspect={() => setInspected(latest || null)}
                      busy={busy}
                      empty={!latest}
                    />
                  </div>
                )}
                {view === "readings" && (
                  <div className="space-y-4">
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportCsv}
                        disabled={!readings.length}
                      >
                        <Download className="size-4" />
                        Export CSV
                      </Button>
                    </div>
                    <ReadingsTable
                      readings={readings}
                      onInspect={setInspected}
                    />
                    <Panel
                      title="All 12 measurements"
                      subtitle="Latest stored packet from the selected node."
                    >
                      <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
                        {METRICS.map((item) => (
                          <div key={item.key}>
                            <p className="text-xs text-muted-foreground">
                              {item.label}
                            </p>
                            <p className="mt-2 text-xl font-semibold tabular-nums">
                              {latest?.payload[item.key].toFixed(
                                item.decimals,
                              ) ?? "—"}
                              <span className="ml-1 text-xs font-normal text-muted-foreground">
                                {item.unit}
                              </span>
                            </p>
                          </div>
                        ))}
                      </div>
                    </Panel>
                  </div>
                )}
                {view === "nodes" && (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {nodes.map((id) => {
                      const samples = all.filter((row) => row.device_id === id);
                      return (
                        <Panel
                          key={id}
                          title="Boat 01"
                          subtitle="Measurement and upload history"
                        >
                          <Radio className="mb-5 size-6 text-muted-foreground" />
                          <p className="text-2xl font-semibold tabular-nums">
                            {samples.length}
                            <span className="ml-2 text-xs font-normal text-muted-foreground">
                              stored packets
                            </span>
                          </p>
                          <p className="mt-3 text-xs leading-5 text-muted-foreground">
                            Last stored:{" "}
                            {dateLabel(samples.at(-1)!.recorded_at)} IST
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-5"
                            onClick={() => {
                              setView("readings");
                            }}
                          >
                            View readings
                            <ArrowUpRight className="size-3" />
                          </Button>
                        </Panel>
                      );
                    })}
                    {!nodes.length && (
                      <p className="text-sm text-muted-foreground">
                        No boat packets are stored in this source yet.
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            <footer className="mt-7 flex flex-wrap justify-between gap-2 border-t border-border pt-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Database className="size-3" />
                WQM · Water quality monitoring
              </span>
              <span>
                {active
                  ? `Last checked ${dateLabel(active.checkedAt)} IST`
                  : "Waiting for data"}
              </span>
            </footer>
          </main>
        </div>
      </div>
      <Dialog
        open={!!inspected}
        onOpenChange={(open) => {
          if (!open) setInspected(null);
        }}
      >
        <DialogContent
          aria-describedby="packet-description"
          className={cn(
            "wqm-workspace max-h-[85dvh] overflow-y-auto rounded-xl bg-card text-foreground sm:max-w-xl",
            theme === "dark" && "wqm-dark dark",
          )}
        >
          <DialogHeader>
            <DialogTitle>Stored packet</DialogTitle>
            <p
              id="packet-description"
              className="break-all text-xs text-muted-foreground"
            >
              {inspected?.packet_id} ·{" "}
              {inspected ? dateLabel(inspected.recorded_at) + " IST" : ""}
            </p>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            The ts field is node uptime, not a calendar timestamp.
          </p>
          <pre className="overflow-x-auto rounded-lg bg-background p-4 text-xs leading-6">
            {JSON.stringify(inspected?.payload, null, 2)}
          </pre>
        </DialogContent>
      </Dialog>
      <Dialog open={sourceInfoOpen} onOpenChange={setSourceInfoOpen}>
        <DialogContent
          aria-describedby="source-description"
          className={cn(
            "wqm-workspace rounded-xl bg-card text-foreground sm:max-w-md",
            theme === "dark" && "wqm-dark dark",
          )}
        >
          <DialogHeader>
            <DialogTitle>About these readings</DialogTitle>
          </DialogHeader>
          <p
            id="source-description"
            className="text-sm leading-6 text-muted-foreground"
          >
            {demo
              ? "Workspace readings are generated values for building the interface. They are separate from boat uploads and are not field measurements."
              : "Gateway history contains stored uploads, including the verified test packet. It does not show current hardware connectivity."}
          </p>
          <p className="text-sm leading-6 text-muted-foreground">
            Map coordinates are a reference near North Campus until GPS fixes
            arrive. These readings are not a water-safety assessment.
          </p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default Dashboard;
