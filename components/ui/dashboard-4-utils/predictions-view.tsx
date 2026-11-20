"use client";

import { useMemo, useState } from "react";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "./shared";
import { Gauge } from "@/components/ui/gauge-1";
import { AnalyticsCard } from "@/components/ui/area-chart-analytics-card";
import StatusDot from "@/components/ui/status-dot";
import PartitionBar, { PartitionBarSegment, PartitionBarSegmentTitle, PartitionBarSegmentValue } from "@/components/ui/partition-bar";
import { AuditLog } from "@/components/ui/audit-log";
import { AlertTriangle, ArrowUpRight, MapPin, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { timeLabel, type Reading } from "@/lib/dashboard";
import {
  anomalies,
  forecast,
  hotspots,
  oxygenWarning,
  PARAMS,
  pollutionScreening,
  qualityScore,
  sensorHealth,
  WEIGHTS,
  type Param,
  type QualityClass,
} from "@/lib/predictions";

const CLASS_COLOR: Record<QualityClass, string> = {
  Excellent: "#10b981",
  Good: "#84cc16",
  Poor: "#f59e0b",
  Dangerous: "#ef4444",
};
const TONE = { ok: "#10b981", watch: "#f59e0b", attention: "#f59e0b", warning: "#ef4444", fault: "#ef4444", clear: "#10b981", inspect: "#f59e0b" } as const;
type Tone = keyof typeof TONE;

const param = (key: Param) => PARAMS.find((p) => p.key === key)!;
const SEGMENT_COLOR: Partial<Record<Param, string>> = { do_mgl: "border-0 bg-[#0891b2]", pH: "border-0 bg-[#7c3aed]", tds_ppm: "border-0 bg-[#f59e0b]", orp_mv: "border-0 bg-[#10b981]" };
const SHORT: Partial<Record<Param, string>> = { do_mgl: "DO", pH: "pH", tds_ppm: "TDS", orp_mv: "ORP" };
const phBadge = (v?: number) =>
  v === undefined
    ? undefined
    : v >= 6.5 && v <= 8.5
      ? { text: "Within 6.5–8.5", tone: "good" as const }
      : { text: "Outside 6.5–8.5", tone: "bad" as const };
const fmt = (key: Param, v: number) => v.toFixed(param(key).decimals);

/** "ML Predictions": eight analyses computed from the selected boat's readings. */
export function PredictionsView({ readings }: { readings: Reading[] }) {
  const [key, setKey] = useState<Param>("do_mgl");
  const r = useMemo(() => {
    const anoms = anomalies(readings);
    return {
      score: qualityScore(readings),
      oxygen: oxygenWarning(readings),
      anoms,
      screening: pollutionScreening(readings, anoms),
      health: sensorHealth(readings),
      spots: hotspots(readings),
    };
  }, [readings]);

  const fc = useMemo(() => forecast(readings, key), [readings, key]);
  const chart = useMemo(() => {
    if (!fc) return [];
    const end = Date.parse(readings.at(-1)!.recorded_at);
    const past = readings
      .filter((row) => Date.parse(row.recorded_at) >= end - 2 * 3600000)
      .flatMap((row) => {
        const v = (row.payload as Record<string, unknown>)[key];
        return typeof v === "number" && v > param(key).min && v < param(key).max && v !== 0
          ? [{ t: Date.parse(row.recorded_at), actual: v }]
          : [];
      });
    const last = past.at(-1);
    const future = fc.horizons.map((h) => ({ t: end + h.minutes * 60000, forecast: h.value, band: [h.low, h.high] as [number, number] }));
    return [...past, ...(last ? [{ t: last.t, forecast: last.actual, band: [last.actual, last.actual] as [number, number] }] : []), ...future];
  }, [fc, readings, key]);

  if (!readings.length) {
    return (
      <Panel title="ML Predictions">
        <p className="text-sm text-muted-foreground">No readings in this window.</p>
      </Panel>
    );
  }

  const last = readings.at(-1);
  const okSensors = r.health.filter((h) => h.status === "ok").length;
  // Last 48 valid readings of a parameter, for the small area charts.
  const recent = (k: Param) =>
    readings
      .flatMap((row) => {
        const v = (row.payload as Record<string, unknown>)[k];
        return typeof v === "number" && v !== 0 && v > param(k).min && v < param(k).max
          ? [{ label: timeLabel(row.recorded_at), value: v }]
          : [];
      })
      .slice(-48);
  const sat = r.oxygen.saturation;

  return (
    <div className="grid gap-4 lg:grid-cols-4">
      {/* Bento: tall quality tile on the left, metric tiles across the top,
          wide forecast below them, then sensors / events / score breakdown. */}
        <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-border bg-card p-6 text-center md:col-span-2 lg:col-span-1 lg:row-span-2">
          {r.score ? (
            <>
              <Gauge value={r.score.score} size={168} strokeWidth={8} primary={CLASS_COLOR[r.score.label]} showValue />
              <div className="flex flex-col items-center space-y-2">
                <p className="text-sm text-muted-foreground">Water quality</p>
                <p className="text-xl font-semibold" style={{ color: CLASS_COLOR[r.score.label] }}>
                  {r.score.label}
                </p>
                <StatusDot
                  tone={r.score.cpcbD ? "success" : r.score.cpcbD === null ? "neutral" : "error"}
                  label={r.score.cpcbD ? "Meets CPCB D" : r.score.cpcbD === null ? "CPCB n/a" : "Fails CPCB D"}
                  showLabel
                  size="sm"
                  labelClassName="whitespace-nowrap text-xs"
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not enough readings</p>
          )}
        </div>
        <AnalyticsCard
          title="Dissolved oxygen"
          info="Oxygen dissolved in the water. Below 4 mg/L fish and aquatic life are at risk (CPCB)."
          value={r.oxygen.now?.toFixed(2) ?? "—"}
          unit="mg/L"
          badge={{ text: r.oxygen.level === "ok" ? "Safe" : r.oxygen.level === "watch" ? "Falling" : "Below limit", tone: r.oxygen.level === "ok" ? "good" : r.oxygen.level === "watch" ? "warn" : "bad" }}
          data={recent("do_mgl")}
          color="#0891b2"
          side={{ value: sat !== undefined ? `${Math.round(sat)}%` : "—", label: "O₂ saturation" }}
        />
        <AnalyticsCard
          title="pH"
          info="Acidity of the water. CPCB limits for bathing and fisheries: 6.5–8.5."
          value={recent("pH").at(-1)?.value.toFixed(2) ?? "—"}
          badge={phBadge(recent("pH").at(-1)?.value)}
          data={recent("pH")}
          color="#7c3aed"
          side={{ value: recent("orp_mv").at(-1) ? `${Math.round(recent("orp_mv").at(-1)!.value)} mV` : "—", label: "Redox (ORP)" }}
        />
        <div className="flex flex-col justify-center gap-4 rounded-xl border border-border bg-card p-5 md:col-span-2 lg:col-span-1">
          <p className="text-sm text-muted-foreground">System status</p>
          <StatusDot
            tone={r.screening.status === "clear" ? "success" : "warning"}
            animate={r.screening.status !== "clear"}
            label={r.screening.status === "clear" ? "No pollution flags" : `Inspect · ${r.screening.reasons.length} flag${r.screening.reasons.length > 1 ? "s" : ""}`}
            showLabel
            labelClassName="text-foreground"
          />
          <StatusDot
            tone={okSensors === r.health.length ? "success" : "warning"}
            label={`Sensors ${okSensors}/${r.health.length} healthy`}
            showLabel
            labelClassName="text-foreground"
          />
          <StatusDot
            tone="active"
            label={`Live · ${readings.length} readings`}
            showLabel
            labelClassName="text-foreground"
          />
        </div>

      {/* Forecast */}
      <Panel
        className="md:col-span-2 lg:col-span-3"
        title="Short-term forecast"
        action={
          <select
            value={key}
            onChange={(e) => setKey(e.target.value as Param)}
            aria-label="Parameter to forecast"
            className="rounded-lg border border-border bg-card px-3 py-2 text-xs"
          >
            {PARAMS.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
          </select>
        }
      >
        {fc ? (
          <div className="grid gap-6 lg:grid-cols-[1fr_220px]">
            <div className="h-56" role="img" aria-label={`${param(key).label}: last two hours and forecast`}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chart} margin={{ left: -18, right: 8, top: 8 }}>
                  <XAxis dataKey="t" type="number" domain={["dataMin", "dataMax"]} scale="time" minTickGap={48} tickFormatter={(t) => timeLabel(new Date(t).toISOString())} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                  <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={56} tickFormatter={(v) => Number(v).toFixed(param(key).decimals)} />
                  <Tooltip
                    labelFormatter={(t) => timeLabel(new Date(Number(t)).toISOString())}
                    formatter={(v: unknown, name: string) => [Array.isArray(v) ? `${fmt(key, v[0])} – ${fmt(key, v[1])}` : fmt(key, Number(v)), name === "band" ? "Range" : name === "forecast" ? "Forecast" : "Measured"]}
                    contentStyle={{ fontSize: 12, borderRadius: 8, background: "var(--card)", border: "1px solid var(--border)" }}
                  />
                  <Area dataKey="band" stroke="none" fill="var(--wqm-chart-secondary)" fillOpacity={0.25} isAnimationActive={false} />
                  <Line dataKey="actual" stroke="var(--wqm-chart-line)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  <Line dataKey="forecast" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} isAnimationActive={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-3 gap-2 lg:grid-cols-1">
              {fc.horizons.map((h) => (
                <div key={h.minutes} className="flex items-baseline justify-between rounded-lg bg-muted px-3 py-2.5">
                  <span className="text-xs text-muted-foreground">+{h.minutes >= 60 ? `${h.minutes / 60} h` : `${h.minutes} m`}</span>
                  <span className="text-base font-semibold tabular-nums">
                    {fmt(key, h.value)}
                    <span className="ml-1 text-[10px] font-normal text-muted-foreground">{param(key).unit}</span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not enough readings to forecast.</p>
        )}
      </Panel>

        {/* Sensor health */}
        <Panel title="Sensor health">
          <ul className="space-y-3">
            {r.health.map((h) => (
              <li key={h.key} title={h.detail}>
                <div className="mb-1 flex justify-between text-xs">
                  <span>{h.label}</span>
                  <span className="tabular-nums text-muted-foreground">{h.validPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full" style={{ width: `${h.validPct}%`, background: TONE[h.status] }} />
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        {/* Pollution flags + sudden changes, as a timeline */}
        <Panel title="Events" className="md:col-span-2">
          <AuditLog
            className="max-h-[320px] overflow-y-auto"
            emptyText="No events in this window"
            items={[
              ...r.screening.reasons.map((x, i) => ({
                id: `flag-${i}`,
                title: x,
                timestamp: last ? timeLabel(last.recorded_at) : "",
                type: "pollution",
                tone: TONE.inspect,
                icon: <AlertTriangle className="size-3" />,
              })),
              ...r.anoms.slice(0, 12).map((a) => ({
                id: `${a.key}-${a.t}`,
                title: `${param(a.key).label} ${a.z > 0 ? "jumped" : "dropped"} to ${fmt(a.key, a.value)}${param(a.key).unit ? ` ${param(a.key).unit}` : ""}`,
                timestamp: timeLabel(new Date(a.t).toISOString()),
                type: "change",
                tone: TONE.watch,
                icon: a.z > 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />,
              })),
            ]}
          />
        </Panel>

        {/* Score breakdown + hotspots */}
        <Panel title="Score breakdown">
          {r.score ? (
            <div className="space-y-5">
              {/* Each segment is the points a parameter adds to the 0–100 score; "Lost" is what is missing. */}
              <PartitionBar size="sm" gap={1}>
                {[
                  ...r.score.parts.map((p) => {
                    const total = r.score!.parts.reduce((s, x) => s + (WEIGHTS[x.key] ?? 0), 0);
                    const pts = Math.round((100 * (WEIGHTS[p.key] ?? 0) * p.sub) / total);
                    return (
                      <PartitionBarSegment key={p.key} num={Math.max(pts, 1)} className={SEGMENT_COLOR[p.key]} variant="outline" alignment="left">
                        {pts >= 12 ? (
                          <>
                            <PartitionBarSegmentTitle>{SHORT[p.key]}</PartitionBarSegmentTitle>
                            <PartitionBarSegmentValue>{pts} pts</PartitionBarSegmentValue>
                          </>
                        ) : null}
                      </PartitionBarSegment>
                    );
                  }),
                  <PartitionBarSegment key="lost" num={Math.max(100 - r.score.score, 1)} variant="muted" className="bg-muted" alignment="right">
                    <PartitionBarSegmentTitle className="text-muted-foreground">Lost</PartitionBarSegmentTitle>
                    <PartitionBarSegmentValue>{100 - r.score.score} pts</PartitionBarSegmentValue>
                  </PartitionBarSegment>,
                ]}
              </PartitionBar>
              <ul className="space-y-1.5 text-xs">
                {r.score.parts.map((p) => {
                  const total = r.score!.parts.reduce((s, x) => s + (WEIGHTS[x.key] ?? 0), 0);
                  const pts = Math.round((100 * (WEIGHTS[p.key] ?? 0) * p.sub) / total);
                  return (
                    <li key={p.key} className="flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className={cn("size-2 rounded-full", SEGMENT_COLOR[p.key])} />
                        {p.label}
                      </span>
                      <span className="tabular-nums">
                        {fmt(p.key, p.value)} {param(p.key).unit}
                        <span className="ml-2 text-muted-foreground">· {pts} pts</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className="divide-y divide-border border-t border-border text-xs">
                {([["Bathing", "CPCB B", r.score.cpcbB], ["Fisheries", "CPCB D", r.score.cpcbD]] as const).map(([use, cls, ok]) => (
                  <div key={cls} className="flex items-center justify-between py-2">
                    <StatusDot
                      size="sm"
                      tone={ok ? "success" : ok === null ? "neutral" : "error"}
                      label={`${use} (${cls.slice(-1)})`}
                      showLabel
                      labelClassName="whitespace-nowrap text-xs font-normal text-foreground"
                    />
                    <span className={cn("font-medium", ok ? "text-emerald-600" : ok === null ? "text-muted-foreground" : "text-red-600")}>
                      {ok ? "Meets" : ok === null ? "n/a" : "Fails"}
                    </span>
                  </div>
                ))}
                {r.spots[0] && (
                  <div className="flex items-center justify-between py-2">
                    <span className="flex items-center gap-2 whitespace-nowrap text-foreground">
                      <MapPin className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      Worst spot
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${r.spots[0].lat.toFixed(6)},${r.spots[0].lon.toFixed(6)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-border px-2 py-1 font-medium hover:bg-muted"
                    >
                      Open map <ArrowUpRight className="size-3" aria-hidden="true" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </Panel>

      <p className="text-[11px] text-muted-foreground md:col-span-2 lg:col-span-4">
        Rule-based and statistical models · {readings.length} readings · trained models to follow as river data grows.
      </p>
    </div>
  );
}
