"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Panel } from "./shared";
import { cn } from "@/lib/utils";
import { dateLabel, timeLabel, type Reading } from "@/lib/dashboard";
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

const CLASS_TONE: Record<QualityClass, string> = {
  Excellent: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  Good: "bg-lime-500/15 text-lime-700 dark:text-lime-400",
  Poor: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  Dangerous: "bg-red-500/15 text-red-700 dark:text-red-400",
};
const STATUS_TONE = {
  ok: "bg-emerald-500",
  watch: "bg-amber-500",
  attention: "bg-amber-500",
  warning: "bg-red-500",
  fault: "bg-red-500",
  clear: "bg-emerald-500",
  inspect: "bg-amber-500",
} as const;

const fmt = (key: Param, v: number) => {
  const p = PARAMS.find((x) => x.key === key)!;
  return `${v.toFixed(p.decimals)}${p.unit ? ` ${p.unit}` : ""}`;
};

function Dot({ tone }: { tone: keyof typeof STATUS_TONE }) {
  return <span className={cn("inline-block size-2 shrink-0 rounded-full", STATUS_TONE[tone])} aria-hidden="true" />;
}

function Empty({ text }: { text: string }) {
  return <p className="text-sm text-muted-foreground">{text}</p>;
}

/** The "ML Predictions" view: eight analyses computed from the selected boat's readings. */
export function PredictionsView({ readings }: { readings: Reading[] }) {
  const [param, setParam] = useState<Param>("do_mgl");
  const r = useMemo(() => {
    const anoms = anomalies(readings);
    return {
      score: qualityScore(readings),
      oxygen: oxygenWarning(readings),
      anoms,
      screening: pollutionScreening(readings, anoms),
      health: sensorHealth(readings),
      spots: hotspots(readings),
      forecasts: PARAMS.map((p) => forecast(readings, p.key)),
    };
  }, [readings]);
  const fc = r.forecasts.find((f) => f?.key === param) ?? null;
  const last = readings.at(-1);

  if (!readings.length) {
    return (
      <Panel title="ML Predictions" subtitle="Model outputs for the selected boat.">
        <Empty text="No readings in this window yet. Pick a longer window or another data source." />
      </Panel>
    );
  }

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          Rule-based and statistical models run on {readings.length} readings
          {last ? `, latest ${dateLabel(last.recorded_at)} IST` : ""}. Trained models will be added as more river data is collected.
        </span>
      </p>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 1. Score */}
        <Panel title="Water quality score" subtitle="Weighted index of DO, pH, TDS and ORP, with CPCB class checks.">
          {r.score ? (
            <div className="space-y-4">
              <div className="flex items-end gap-3">
                <span className="text-5xl font-semibold tabular-nums">{r.score.score}</span>
                <span className="mb-1 text-sm text-muted-foreground">/ 100</span>
                <span className={cn("mb-1 ml-auto rounded-full px-3 py-1 text-xs font-medium", CLASS_TONE[r.score.label])}>
                  {r.score.label}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground" style={{ width: `${r.score.score}%` }} />
              </div>
              <ul className="space-y-1.5 text-sm">
                {r.score.parts.map((p) => (
                  <li key={p.key} className="flex justify-between gap-2">
                    <span className="truncate text-muted-foreground">{p.label}</span>
                    <span className="shrink-0 whitespace-nowrap tabular-nums">
                      {fmt(p.key, p.value)} · {Math.round(p.sub * 100)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2 text-xs">
                {([["CPCB Class B (bathing)", r.score.cpcbB], ["CPCB Class D (fisheries)", r.score.cpcbD]] as const).map(([name, ok]) => (
                  <span key={name} className="rounded-md border border-border px-2 py-1">
                    {name}: <b>{ok === null ? "n/a" : ok ? "meets" : "fails"}</b>
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <Empty text="Needs at least one valid DO, pH, TDS or ORP reading." />
          )}
        </Panel>

        {/* 2. Low oxygen */}
        <Panel title="Low-oxygen warning" subtitle="Current DO and its trend against the 4 mg/L aquatic-life limit.">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Dot tone={r.oxygen.level} />
              {r.oxygen.level === "ok" ? "No warning" : r.oxygen.level === "watch" ? "Watch" : "Warning"}
            </div>
            <p className="text-sm text-muted-foreground">{r.oxygen.message}</p>
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">DO now</dt>
                <dd className="text-xl font-semibold tabular-nums">{r.oxygen.now !== undefined ? r.oxygen.now.toFixed(2) : "—"} <span className="text-xs font-normal">mg/L</span></dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Lowest in 3 h</dt>
                <dd className="text-xl font-semibold tabular-nums">{r.oxygen.minForecast !== undefined ? r.oxygen.minForecast.toFixed(2) : "—"} <span className="text-xs font-normal">mg/L</span></dd>
              </div>
            </dl>
          </div>
        </Panel>

        {/* 3. Oxygen availability */}
        <Panel title="Oxygen availability" subtitle="DO as a share of what the water can hold at its temperature and pressure.">
          {r.oxygen.saturation !== undefined ? (
            <div className="space-y-3">
              <div className="text-5xl font-semibold tabular-nums">
                {Math.round(r.oxygen.saturation)}
                <span className="text-lg font-normal text-muted-foreground">%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.min(100, r.oxygen.saturation)}%` }} />
              </div>
              <p className="text-sm text-muted-foreground">
                {r.oxygen.saturation >= 80
                  ? "Well oxygenated, healthy for fish."
                  : r.oxygen.saturation >= 60
                    ? "Moderately oxygenated; sensitive species may be stressed."
                    : "Poorly oxygenated; likely organic load or still water."}
              </p>
            </div>
          ) : (
            <Empty text="Needs a valid DO and water temperature reading." />
          )}
        </Panel>
      </div>

      {/* 4. Forecast */}
      <Panel
        title="Short-term prediction"
        subtitle="Trend fitted to the last two hours of valid readings, with an uncertainty range."
        action={
          <select
            value={param}
            onChange={(e) => setParam(e.target.value as Param)}
            aria-label="Parameter to forecast"
            className="rounded-md border border-border bg-card px-2 py-1 text-sm"
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
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Now</p>
              <p className="text-2xl font-semibold tabular-nums">{fmt(param, fc.now)}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {fc.slopePerHour >= 0 ? "▲" : "▼"} {Math.abs(fc.slopePerHour).toFixed(PARAMS.find((p) => p.key === param)!.decimals + 1)} per hour
              </p>
            </div>
            {fc.horizons.map((h) => (
              <div key={h.minutes} className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">In {h.minutes >= 60 ? `${h.minutes / 60} h` : `${h.minutes} min`}</p>
                <p className="text-2xl font-semibold tabular-nums">{fmt(param, h.value)}</p>
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                  range {fmt(param, h.low)} – {fmt(param, h.high)}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <Empty text="Needs at least six valid readings of this parameter." />
        )}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* 5. Unusual changes */}
        <Panel title="Unusual water changes" subtitle="Readings far outside the recent normal (rolling z-score above 3.5).">
          {r.anoms.length ? (
            <ul className="divide-y divide-border text-sm">
              {r.anoms.slice(0, 6).map((a) => (
                <li key={`${a.key}-${a.t}`} className="flex items-center justify-between gap-3 py-2">
                  <span>
                    <b>{PARAMS.find((p) => p.key === a.key)!.label}</b>{" "}
                    <span className="text-muted-foreground">{a.z > 0 ? "jumped to" : "dropped to"} {fmt(a.key, a.value)}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                    {timeLabel(new Date(a.t).toISOString())} · z {a.z.toFixed(1)}
                  </span>
                </li>
              ))}
              {r.anoms.length > 6 && <li className="pt-2 text-xs text-muted-foreground">{r.anoms.length - 6} more in this window</li>}
            </ul>
          ) : (
            <div className="flex items-center gap-2 text-sm">
              <Dot tone="ok" /> No unusual changes in this window.
            </div>
          )}
        </Panel>

        {/* 6. Pollution screening */}
        <Panel title="Possible pollution event" subtitle="Flags readings that breach limits or change sharply together.">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Dot tone={r.screening.status} />
              {r.screening.status === "clear" ? "No event detected" : "Inspection recommended"}
            </div>
            {r.screening.reasons.length ? (
              <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {r.screening.reasons.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">All checked parameters are within CPCB/BIS limits and stable.</p>
            )}
          </div>
        </Panel>

        {/* 7. Sensor health */}
        <Panel title="Sensor health" subtitle="Share of the last 30 packets with a valid reading from each sensor.">
          <ul className="divide-y divide-border text-sm">
            {r.health.map((h) => (
              <li key={h.key} className="flex items-center gap-3 py-2">
                <Dot tone={h.status} />
                <span className="w-36 shrink-0 font-medium">{h.label}</span>
                <span className="flex-1 truncate text-muted-foreground">{h.detail}</span>
                <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">{h.validPct}%</span>
              </li>
            ))}
          </ul>
        </Panel>

        {/* 8. Hotspots */}
        <Panel title="River hotspots" subtitle="GPS locations ranked by water quality, worst first.">
          {r.spots.length ? (
            <ul className="divide-y divide-border text-sm">
              {r.spots.map((s, i) => (
                <li key={`${s.lat}-${s.lon}`} className="flex items-center justify-between gap-3 py-2">
                  <span className="flex items-center gap-2">
                    <span className="w-5 text-xs text-muted-foreground">{i + 1}</span>
                    <a
                      className="tabular-nums underline-offset-4 hover:underline"
                      href={`https://www.google.com/maps?q=${s.lat.toFixed(6)},${s.lon.toFixed(6)}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {s.lat.toFixed(5)}, {s.lon.toFixed(5)}
                    </a>
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{s.samples} readings</span>
                    <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", CLASS_TONE[s.label])}>
                      {s.score} · {s.label}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="Needs GPS-tagged readings in this window." />
          )}
        </Panel>
      </div>
    </div>
  );
}
