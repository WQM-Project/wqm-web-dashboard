"use client";

import { useMemo, useState } from "react";
import { Area, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Panel } from "./shared";
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
const fmt = (key: Param, v: number) => v.toFixed(param(key).decimals);

function Chip({ tone, children }: { tone: Tone; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
      style={{ background: `${TONE[tone]}1f`, color: TONE[tone] }}
    >
      <span className="size-1.5 rounded-full" style={{ background: TONE[tone] }} />
      {children}
    </span>
  );
}

function Ring({ value, color, size = 92 }: { value: number; color: string; size?: number }) {
  const r = size / 2 - 7, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="shrink-0 -rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={8} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        strokeDasharray={`${(Math.min(100, Math.max(0, value)) / 100) * c} ${c}`}
      />
    </svg>
  );
}

function Kpi({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col justify-between gap-3 rounded-xl border border-border bg-card p-5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

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

  const okSensors = r.health.filter((h) => h.status === "ok").length;
  const sat = r.oxygen.saturation;

  return (
    <div className="space-y-4">
      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <div className="col-span-2 flex items-center gap-5 rounded-xl border border-border bg-card p-5 lg:col-span-1">
          {r.score ? (
            <>
              <div className="relative">
                <Ring value={r.score.score} color={CLASS_COLOR[r.score.label]} />
                <span className="absolute inset-0 grid place-items-center text-2xl font-semibold tabular-nums">{r.score.score}</span>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Quality score</p>
                <p className="text-lg font-semibold" style={{ color: CLASS_COLOR[r.score.label] }}>
                  {r.score.label}
                </p>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Quality score —</p>
          )}
        </div>
        <Kpi label="Dissolved oxygen">
          <p className="text-3xl font-semibold tabular-nums">
            {r.oxygen.now?.toFixed(2) ?? "—"}
            <span className="ml-1 text-xs font-normal text-muted-foreground">mg/L</span>
          </p>
          <Chip tone={r.oxygen.level}>{r.oxygen.level === "ok" ? "Above 4 mg/L" : r.oxygen.level === "watch" ? "Falling" : "Below limit"}</Chip>
        </Kpi>
        <Kpi label="O₂ saturation">
          <p className="text-3xl font-semibold tabular-nums">
            {sat !== undefined ? Math.round(sat) : "—"}
            <span className="ml-0.5 text-xs font-normal text-muted-foreground">%</span>
          </p>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, sat ?? 0)}%` }} />
          </div>
        </Kpi>
        <Kpi label="Pollution screen">
          <p className="text-lg font-semibold">{r.screening.status === "clear" ? "Clear" : "Inspect"}</p>
          <Chip tone={r.screening.status}>{r.screening.reasons.length ? `${r.screening.reasons.length} flag${r.screening.reasons.length > 1 ? "s" : ""}` : "No flags"}</Chip>
        </Kpi>
        <Kpi label="Sensors">
          <p className="text-3xl font-semibold tabular-nums">
            {okSensors}
            <span className="text-lg font-normal text-muted-foreground">/{r.health.length}</span>
          </p>
          <Chip tone={okSensors === r.health.length ? "ok" : "attention"}>{okSensors === r.health.length ? "All healthy" : "Check needed"}</Chip>
        </Kpi>
      </div>

      {/* Forecast */}
      <Panel
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

      <div className="grid gap-4 lg:grid-cols-3">
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

        {/* Pollution + anomalies */}
        <Panel title="Events">
          <div className="space-y-4">
            {r.screening.reasons.map((x) => (
              <div key={x} className="flex items-start gap-2 text-sm">
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ background: TONE.inspect }} />
                {x}
              </div>
            ))}
            {r.anoms.slice(0, 5).map((a) => (
              <div key={`${a.key}-${a.t}`} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full" style={{ background: TONE.watch }} />
                  {param(a.key).label} {a.z > 0 ? "↑" : "↓"} {fmt(a.key, a.value)}
                </span>
                <span className="text-xs tabular-nums text-muted-foreground">{timeLabel(new Date(a.t).toISOString())}</span>
              </div>
            ))}
            {!r.screening.reasons.length && !r.anoms.length && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="size-1.5 rounded-full" style={{ background: TONE.ok }} />
                No events in this window
              </div>
            )}
          </div>
        </Panel>

        {/* Score breakdown + hotspots */}
        <Panel title="Score breakdown">
          {r.score ? (
            <div className="space-y-3">
              {r.score.parts.map((p) => (
                <div key={p.key}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span>{p.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {fmt(p.key, p.value)} {param(p.key).unit}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-foreground" style={{ width: `${Math.round(p.sub * 100)}%` }} />
                  </div>
                </div>
              ))}
              <div className="flex flex-wrap gap-2 pt-1">
                <Chip tone={r.score.cpcbB ? "ok" : r.score.cpcbB === null ? "watch" : "fault"}>CPCB B</Chip>
                <Chip tone={r.score.cpcbD ? "ok" : r.score.cpcbD === null ? "watch" : "fault"}>CPCB D</Chip>
                {r.spots[0] && (
                  <a
                    href={`https://www.google.com/maps?q=${r.spots[0].lat.toFixed(6)},${r.spots[0].lon.toFixed(6)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Worst spot ↗
                  </a>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </Panel>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Rule-based and statistical models · {readings.length} readings · trained models to follow as river data grows.
      </p>
    </div>
  );
}
