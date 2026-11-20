import type { Reading } from "@/lib/dashboard";

/**
 * Water-quality analysis on the boat's own readings. Everything here is a
 * rule-based or statistical method (CPCB limits, DO saturation, rolling
 * statistics, linear trend). Trained models can replace each function later
 * as long as they return the same shapes.
 */

export type Param = "pH" | "do_mgl" | "tds_ppm" | "orp_mv" | "temp_w1";
export const PARAMS: { key: Param; label: string; unit: string; decimals: number; min: number; max: number }[] = [
  { key: "pH", label: "pH", unit: "", decimals: 2, min: 0.5, max: 14 },
  { key: "do_mgl", label: "Dissolved oxygen", unit: "mg/L", decimals: 2, min: 0.05, max: 20 },
  { key: "tds_ppm", label: "Dissolved solids", unit: "ppm", decimals: 0, min: 1, max: 2000 },
  { key: "orp_mv", label: "Redox potential", unit: "mV", decimals: 0, min: -1990, max: 1990 },
  { key: "temp_w1", label: "Water temperature", unit: "°C", decimals: 1, min: -5, max: 45 },
];

type Point = { t: number; v: number };
const raw = (r: Reading, k: string) => (r.payload as Record<string, unknown>)[k];
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined);

/** A reading is usable when it is a finite number inside the sensor's physical range (and not a 0 placeholder). */
export function valid(r: Reading, key: Param) {
  const p = PARAMS.find((x) => x.key === key)!;
  const v = num(raw(r, key));
  return v !== undefined && v !== 0 && v > p.min && v < p.max ? v : undefined;
}

function series(rows: Reading[], key: Param): Point[] {
  return rows.flatMap((r) => {
    const v = valid(r, key);
    return v === undefined ? [] : [{ t: Date.parse(r.recorded_at), v }];
  });
}

const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;
const sd = (a: number[]) => {
  if (a.length < 2) return 0;
  const m = mean(a);
  return Math.sqrt(a.reduce((s, x) => s + (x - m) ** 2, 0) / (a.length - 1));
};

/* ---------------------------------------------------------- oxygen saturation */
/** DO at 100 % saturation (mg/L) for fresh water, Benson–Krause polynomial, scaled for air pressure. */
export function doSaturation(tempC: number, pressureHpa = 1013.25) {
  const s = 14.652 - 0.41022 * tempC + 0.007991 * tempC ** 2 - 0.000077774 * tempC ** 3;
  return s * (pressureHpa / 1013.25);
}

/* ---------------------------------------------------------- quality score */
export type QualityClass = "Excellent" | "Good" | "Poor" | "Dangerous";
export type Score = {
  score: number;
  label: QualityClass;
  parts: { key: Param; label: string; value: number; sub: number }[];
  cpcbB: boolean | null; // bathing (pH 6.5–8.5, DO ≥ 5)
  cpcbD: boolean | null; // wildlife and fisheries (pH 6.5–8.5, DO ≥ 4)
};

const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
function subScore(key: Param, v: number, tempC?: number) {
  switch (key) {
    case "pH":
      return v >= 6.5 && v <= 8.5 ? 1 - Math.abs(v - 7.25) / 2.5 : clamp01(0.4 - Math.abs(v - 7.5) / 5);
    case "do_mgl": {
      const sat = tempC !== undefined ? v / doSaturation(tempC) : v / 9;
      return clamp01((sat - 0.3) / 0.6);
    }
    case "tds_ppm":
      return v <= 500 ? 1 - v / 1500 : clamp01(0.66 - (v - 500) / 1500);
    case "orp_mv":
      return clamp01((v - 50) / 250);
    default:
      return 1;
  }
}
const WEIGHTS: Partial<Record<Param, number>> = { do_mgl: 0.4, pH: 0.3, tds_ppm: 0.2, orp_mv: 0.1 };

/** Weighted 0–100 index from the latest valid value of each parameter in the recent window. */
export function qualityScore(rows: Reading[]): Score | null {
  const recent = rows.slice(-30);
  const last = (k: Param) => series(recent, k).at(-1)?.v;
  const temp = last("temp_w1");
  const parts = (Object.keys(WEIGHTS) as Param[]).flatMap((k) => {
    const v = last(k);
    return v === undefined ? [] : [{ key: k, label: PARAMS.find((p) => p.key === k)!.label, value: v, sub: subScore(k, v, temp) }];
  });
  if (!parts.length) return null;
  const w = parts.reduce((s, p) => s + WEIGHTS[p.key]!, 0);
  const score = Math.round((100 * parts.reduce((s, p) => s + WEIGHTS[p.key]! * p.sub, 0)) / w);
  const ph = last("pH"), dox = last("do_mgl");
  const phOk = ph === undefined ? null : ph >= 6.5 && ph <= 8.5;
  const cls = (minDo: number) => (phOk === null || dox === undefined ? null : phOk && dox >= minDo);
  const label: QualityClass = score >= 80 ? "Excellent" : score >= 60 ? "Good" : score >= 35 ? "Poor" : "Dangerous";
  return { score, label, parts, cpcbB: cls(5), cpcbD: cls(4) };
}

/* ---------------------------------------------------------- forecast */
export type Forecast = { key: Param; now: number; horizons: { minutes: number; value: number; low: number; high: number }[]; slopePerHour: number; points: number };
export const HORIZONS = [10, 30, 180];

/** Least-squares trend through the last 2 h of valid readings, projected forward with a ±2σ band. */
export function forecast(rows: Reading[], key: Param): Forecast | null {
  const s = series(rows, key);
  if (s.length < 6) return null;
  const end = s.at(-1)!.t;
  const w = s.filter((p) => p.t >= end - 2 * 3600000);
  const pts = w.length >= 6 ? w : s.slice(-20);
  const xs = pts.map((p) => (p.t - end) / 3600000), ys = pts.map((p) => p.v);
  const mx = mean(xs), my = mean(ys);
  const den = xs.reduce((a, x) => a + (x - mx) ** 2, 0);
  const slope = den ? xs.reduce((a, x, i) => a + (x - mx) * (ys[i] - my), 0) / den : 0;
  const icpt = my - slope * mx;
  const resid = sd(ys.map((y, i) => y - (icpt + slope * xs[i])));
  const p = PARAMS.find((x) => x.key === key)!;
  const bound = (v: number) => Math.max(p.min, Math.min(p.max, v));
  // Damp long horizons: a straight line should not run away over three hours.
  const horizons = HORIZONS.map((m) => {
    const h = m / 60, damp = h <= 0.5 ? h : 0.5 + 0.4 * Math.log1p(h - 0.5);
    const v = bound(icpt + slope * damp);
    const band = 2 * resid * Math.sqrt(1 + damp);
    return { minutes: m, value: v, low: bound(v - band), high: bound(v + band) };
  });
  return { key, now: s.at(-1)!.v, horizons, slopePerHour: slope, points: pts.length };
}

/* ---------------------------------------------------------- low oxygen */
export type OxygenWarning = { level: "ok" | "watch" | "warning"; now?: number; minForecast?: number; saturation?: number; message: string };
export function oxygenWarning(rows: Reading[]): OxygenWarning {
  const f = forecast(rows, "do_mgl");
  const now = series(rows, "do_mgl").at(-1)?.v;
  if (now === undefined) return { level: "watch", message: "No valid dissolved-oxygen reading in this window." };
  const temp = series(rows, "temp_w1").at(-1)?.v;
  const pres = rows.map((r) => num(raw(r, "pressure_hpa"))).filter((v): v is number => v !== undefined && v > 800).at(-1);
  const saturation = temp !== undefined ? (100 * now) / doSaturation(temp, pres) : undefined;
  const minForecast = f ? Math.min(...f.horizons.map((h) => h.low)) : undefined;
  if (now < 4) return { level: "warning", now, minForecast, saturation, message: "Dissolved oxygen is below the 4 mg/L limit for aquatic life." };
  if (minForecast !== undefined && minForecast < 4)
    return { level: "watch", now, minForecast, saturation, message: "Current oxygen is adequate, but the trend could take it below 4 mg/L within three hours." };
  return { level: "ok", now, minForecast, saturation, message: "Oxygen is above the 4 mg/L limit and the trend stays above it." };
}

/* ---------------------------------------------------------- anomalies */
export type Anomaly = { key: Param; t: number; value: number; z: number };
/** Rolling z-score: each reading against the mean and spread of the 20 valid readings before it. */
export function anomalies(rows: Reading[], window = 20, threshold = 3.5): Anomaly[] {
  const out: Anomaly[] = [];
  for (const p of PARAMS) {
    const s = series(rows, p.key);
    for (let i = window; i < s.length; i++) {
      const prev = s.slice(i - window, i).map((x) => x.v);
      // Floor the spread so a very steady sensor does not flag tiny wobbles.
      const spread = Math.max(sd(prev), Math.abs(mean(prev)) * 0.02, 0.05);
      const z = (s[i].v - mean(prev)) / spread;
      if (Math.abs(z) >= threshold) out.push({ key: p.key, t: s[i].t, value: s[i].v, z });
    }
  }
  return out.sort((a, b) => b.t - a.t);
}

/* ---------------------------------------------------------- pollution screening */
export type Screening = { status: "clear" | "inspect"; reasons: string[] };
export function pollutionScreening(rows: Reading[], recentAnomalies: Anomaly[]): Screening {
  const reasons: string[] = [];
  const last = (k: Param) => series(rows.slice(-30), k).at(-1)?.v;
  const ph = last("pH"), dox = last("do_mgl"), tds = last("tds_ppm"), orp = last("orp_mv");
  if (ph !== undefined && (ph < 6.5 || ph > 8.5)) reasons.push(`pH ${ph.toFixed(2)} is outside 6.5–8.5`);
  if (dox !== undefined && dox < 4) reasons.push(`DO ${dox.toFixed(2)} mg/L is below 4 mg/L`);
  if (tds !== undefined && tds > 500) reasons.push(`TDS ${Math.round(tds)} ppm is above 500 ppm`);
  if (orp !== undefined && orp < 100) reasons.push(`ORP ${Math.round(orp)} mV suggests reducing conditions`);
  const lastT = rows.length ? Date.parse(rows.at(-1)!.recorded_at) : 0;
  const fresh = new Set(recentAnomalies.filter((a) => a.t >= lastT - 3600000).map((a) => a.key));
  if (fresh.size >= 2) reasons.push(`${fresh.size} parameters changed sharply together in the last hour`);
  return { status: reasons.length ? "inspect" : "clear", reasons };
}

/* ---------------------------------------------------------- sensor health */
export type Health = { key: string; label: string; status: "ok" | "attention" | "fault"; detail: string; validPct: number };
const SENSORS: { key: string; label: string; check: (v: number) => string | null }[] = [
  { key: "pH", label: "pH probe", check: (v) => (v === 0 ? "reads 0 (probe or board disconnected)" : v < 0.5 || v > 14 ? "outside 0–14" : null) },
  { key: "do_mgl", label: "DO probe", check: (v) => (v <= 0 ? "reads 0" : v > 20 ? "above 20 mg/L" : null) },
  { key: "tds_ppm", label: "TDS probe", check: (v) => (v <= 1 ? "reads near 0 (probe dry or disconnected)" : null) },
  { key: "orp_mv", label: "ORP probe", check: (v) => (Math.abs(v) >= 1990 ? "pinned at ±2000 mV" : null) },
  { key: "temp_w1", label: "Water temperature", check: (v) => (v <= -100 ? "reads −127 °C (sensor not responding)" : v > 45 ? "above 45 °C" : null) },
  { key: "temp_air", label: "Air temperature", check: (v) => (v === 0 ? "reads 0 (BMP280 not responding)" : null) },
  { key: "pressure_hpa", label: "Air pressure", check: (v) => (v < 800 ? "reads below 800 hPa" : null) },
];
export function sensorHealth(rows: Reading[]): Health[] {
  const recent = rows.slice(-30);
  const sensors: Health[] = SENSORS.map((s) => {
    const vals = recent.map((r) => num(raw(r, s.key)));
    const problems = vals.map((v) => (v === undefined ? "missing" : s.check(v)));
    const good = vals.filter((v, i) => v !== undefined && !problems[i]) as number[];
    const validPct = recent.length ? Math.round((100 * good.length) / recent.length) : 0;
    const lastProblem = problems.filter(Boolean).at(-1);
    const flat = good.length >= 10 && sd(good) === 0;
    const status = validPct >= 90 && !flat ? "ok" : validPct >= 50 ? "attention" : "fault";
    const detail = status === "ok" ? "Readings normal" : flat ? "Value not changing (possibly stuck)" : lastProblem ?? "Intermittent readings";
    return { key: s.key, label: s.label, status, detail, validPct };
  });
  const gps = recent.filter((r) => raw(r, "gps_fix") === true || (num(raw(r, "gps_fix")) ?? 0) > 0).length;
  const gpsPct = recent.length ? Math.round((100 * gps) / recent.length) : 0;
  sensors.push({ key: "gps", label: "GPS fix", status: gpsPct >= 90 ? "ok" : gpsPct >= 50 ? "attention" : "fault", detail: gpsPct ? `${gpsPct}% of recent packets have a fix` : "No fix in recent packets", validPct: gpsPct });
  return sensors;
}

/* ---------------------------------------------------------- hotspots */
export type Hotspot = { lat: number; lon: number; score: number; label: QualityClass; samples: number };
/** Groups GPS-tagged readings into ~30 m cells and ranks cells by their quality score. */
export function hotspots(rows: Reading[]): Hotspot[] {
  const cells = new Map<string, Reading[]>();
  for (const r of rows) {
    const lat = num(raw(r, "lat")), lon = num(raw(r, "lon"));
    if (lat === undefined || lon === undefined || (lat === 0 && lon === 0)) continue;
    const k = `${Math.round(lat / 0.0003)}:${Math.round(lon / 0.00035)}`;
    cells.set(k, [...(cells.get(k) ?? []), r]);
  }
  return [...cells.values()]
    .flatMap((group) => {
      const q = qualityScore(group);
      if (!q) return [];
      const lat = mean(group.map((r) => num(raw(r, "lat"))!)), lon = mean(group.map((r) => num(raw(r, "lon"))!));
      return [{ lat, lon, score: q.score, label: q.label, samples: group.length }];
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, 5);
}
