import type { Packet } from "@/lib/server/ingest";

export type Reading = {
  packet_id: string;
  device_id: string;
  recorded_at: string;
  payload: Packet;
};
export type DashboardData = {
  source: "demo" | "gateway";
  readings: Reading[];
  checkedAt: string;
  truncated: boolean;
};
// The first four are the headline cards, so they are sensors the boat always sends.
export const METRICS = [
  { key: "pH", label: "pH", unit: "", decimals: 2 },
  { key: "do_mgl", label: "Dissolved oxygen", unit: "mg/L", decimals: 2 },
  { key: "tds_ppm", label: "Dissolved solids", unit: "ppm", decimals: 1 },
  { key: "temp_w1", label: "Water temperature", unit: "°C", decimals: 1 },
  { key: "orp_mv", label: "Redox potential", unit: "mV", decimals: 1 },
  { key: "temp_air", label: "Air temperature", unit: "°C", decimals: 1 },
  { key: "pressure_hpa", label: "Pressure", unit: "hPa", decimals: 1 },
] as const;
export type MetricKey = (typeof METRICS)[number]["key"];
/** Readings further apart than this are drawn as separate runs (boat switched off). */
export const GAP_MS = 30 * 60000;

// Fields the boat sends today, in display order. Older stored packets (and the
// demo set) may also hold retired sensors such as turbidity or humidity; the
// packet viewer leaves those out.
const PACKET_FIELDS = [
  "id", "ts", ...METRICS.map((m) => m.key),
  "lat", "lon", "alt_m", "sog_knots", "cog_deg", "gps_fix", "sats", "gps_age_s",
  "heading", "pitch", "roll", "utc_s",
] as const;

export function packetForDisplay(payload: Packet | undefined) {
  if (!payload) return undefined;
  const source = payload as Record<string, unknown>;
  return Object.fromEntries(
    PACKET_FIELDS.filter((key) => source[key] !== undefined).map((key) => [key, source[key]]),
  );
}
/** A sensor missing from a packet shows a dash. */
export const formatValue = (value: number | undefined, decimals: number) =>
  value === undefined ? "—" : value.toFixed(decimals);
export const timeLabel = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
export const dateLabel = (value: string) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
  }).format(new Date(value));
