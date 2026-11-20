// Seeds the 20 Nov 2026 dirty-pool recording into the gateway history
// (public.telemetry_packets) at its real GNSS times. Safe to re-run: packet IDs
// are derived from each row's UTC second, and existing rows are left alone.
//   node --env-file=.env.local scripts/seed-pool-session.mjs <csv>
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

// Same WQM-only target check and TLS setup as seed-dashboard-demo.mjs.
const project = "scvcufiagvbeixhnwjze";
const target = new URL(process.env.DATABASE_URL || "");
if (process.env.SUPABASE_PROJECT_REF !== project || target.username !== `postgres.${project}`)
  throw new Error("WQM-only target verification failed");
target.searchParams.delete("sslmode");
const pg = createRequire(import.meta.url)("../.wqm-tools/node_modules/pg");

const file = process.argv[2];
if (!file) throw new Error("Pass the CSV path");
const [head, ...lines] = readFileSync(file, "utf8").trim().split(/\r?\n/);
const cols = head.split(",");
const DEVICE = "WQM-001";

const uuidFrom = (text) => {
  const h = createHash("sha1").update(text).digest("hex");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
};

const rows = lines.map((line) => {
  const v = line.split(",");
  const payload = {};
  cols.forEach((c, i) => {
    const raw = v[i]?.trim();
    if (raw === undefined || raw === "") return;
    if (c === "id") payload.id = DEVICE;
    else if (c === "gps_fix") payload.gps_fix = raw.toLowerCase() === "true" || raw === "1";
    else {
      const n = Number(raw);
      if (!Number.isFinite(n)) throw new Error(`Bad ${c} value "${raw}"`);
      payload[c] = n;
    }
  });
  if (!payload.utc_s) throw new Error("Row without utc_s");
  return {
    device_id: DEVICE,
    packet_id: uuidFrom(`${DEVICE}:${payload.utc_s}:pool-2026-11-20`),
    node_uptime_ms: payload.ts,
    recorded_at: new Date(payload.utc_s * 1000).toISOString(),
    payload,
  };
});

const client = new pg.Client({
  connectionString: target.toString(),
  ssl: { ca: readFileSync(new URL("../.wqm-tools/supabase-ca.crt", import.meta.url), "utf8"), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000,
  statement_timeout: 15000,
  application_name: "wqm-pool-session-seed",
});
await client.connect();
try {
  const res = await client.query(
    `insert into public.telemetry_packets (device_id, packet_id, node_uptime_ms, recorded_at, payload)
     select device_id, packet_id, node_uptime_ms, recorded_at, payload
     from jsonb_to_recordset($1::jsonb) as r(device_id text, packet_id uuid, node_uptime_ms bigint, recorded_at timestamptz, payload jsonb)
     on conflict (device_id, packet_id) do nothing`,
    [JSON.stringify(rows)],
  );
  console.log(`rows in file ${rows.length}, inserted ${res.rowCount}, ${rows[0].recorded_at} -> ${rows.at(-1).recorded_at}`);
} finally {
  await client.end();
}
