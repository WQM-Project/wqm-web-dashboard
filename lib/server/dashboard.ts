import "server-only";
import { z } from "zod";
import { packetSchema } from "./ingest";
import type { DashboardData } from "@/lib/dashboard";

const rowSchema = z.object({
  packet_id: z.string().uuid(),
  device_id: z.string(),
  recorded_at: z.string().datetime({ offset: true }),
  payload: packetSchema,
});
export async function getDashboardData(
  source: "demo" | "gateway",
): Promise<DashboardData> {
  const base = process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (base !== "https://scvcufiagvbeixhnwjze.supabase.co" || !key)
    throw new Error("WQM data source is not configured");
  const url = new URL(
    `/rest/v1/${source === "demo" ? "dashboard_demo_packets" : "telemetry_packets"}`,
    base,
  );
  url.searchParams.set("select", "packet_id,device_id,recorded_at,payload");
  url.searchParams.set("order", "recorded_at.desc");
  url.searchParams.set("limit", "500");
  if (source === "demo") {
    url.searchParams.set("dataset_id", "eq.wqm-dashboard-demo-v1");
    url.searchParams.set("device_id", "eq.DEMO-001");
  } else {
    const nodes = (process.env.GATEWAY_ALLOWED_NODE_IDS || "")
      .split(",")
      .map((v) => v.trim())
      .filter((v) => /^[A-Za-z0-9_-]{1,64}$/.test(v));
    if (!nodes.includes("WQM-001"))
      return {
        source,
        readings: [],
        checkedAt: new Date().toISOString(),
        truncated: false,
      };
    url.searchParams.set("device_id", "eq.WQM-001");
  }
  const headers: Record<string, string> = { apikey: key };
  if (!key.startsWith("sb_secret_")) headers.Authorization = `Bearer ${key}`;
  const response = await fetch(url, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("WQM readings are unavailable");
  const readings = z.array(rowSchema).parse(await response.json());
  return {
    source,
    readings: readings.reverse(),
    checkedAt: new Date().toISOString(),
    truncated: readings.length === 500,
  };
}
