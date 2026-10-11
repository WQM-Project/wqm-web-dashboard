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
export const METRICS = [
  { key: "pH", label: "pH", unit: "", decimals: 2 },
  { key: "turb_ntu", label: "Turbidity", unit: "NTU", decimals: 1 },
  { key: "do_mgl", label: "Dissolved oxygen", unit: "mg/L", decimals: 2 },
  { key: "temp_w1", label: "Water temperature", unit: "°C", decimals: 1 },
  { key: "tds_ppm", label: "Dissolved solids", unit: "ppm", decimals: 1 },
  { key: "ec_uscm", label: "Conductivity", unit: "µS/cm", decimals: 1 },
  { key: "orp_mv", label: "Redox potential", unit: "mV", decimals: 1 },
  {
    key: "temp_w2",
    label: "Backup water temperature",
    unit: "°C",
    decimals: 1,
  },
  { key: "depth_cm", label: "Depth", unit: "cm", decimals: 1 },
  { key: "temp_air", label: "Air temperature", unit: "°C", decimals: 1 },
  { key: "humidity", label: "Humidity", unit: "%", decimals: 1 },
  { key: "pressure_hpa", label: "Pressure", unit: "hPa", decimals: 1 },
] as const;
export type MetricKey = (typeof METRICS)[number]["key"];
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
