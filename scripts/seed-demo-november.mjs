// Replaces the workspace (demo) readings with 48 h of realistic late-November
// pond conditions at IIT Mandi, Kamand (~1000 m): cold nights, mild afternoons,
// cold-water oxygen levels with a daytime photosynthesis peak. Backs up the old
// rows first and swaps them in one transaction. Gateway history is not touched.
//   node --env-file=.env.local scripts/seed-demo-november.mjs [backup.json]
import { randomUUID } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const project = "scvcufiagvbeixhnwjze";
const target = new URL(process.env.DATABASE_URL || "");
if (process.env.SUPABASE_PROJECT_REF !== project || target.username !== `postgres.${project}`)
  throw new Error("WQM-only target verification failed");
target.searchParams.delete("sslmode");
const pg = createRequire(import.meta.url)("../.wqm-tools/node_modules/pg");

const DATASET = "wqm-dashboard-demo-v1";
const ID = "DEMO-001";
const STEP_MIN = 6; // one packet every 6 minutes
const HOURS = 48; // 480 packets, inside the dashboard's 500-packet window
const LAT = 31.78048, LON = 76.993782; // the boat's last real GNSS fix at the pond

// Seeded random numbers, so a re-run produces the same curves.
let seed = 20261121;
const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
const noise = (s) => (rand() + rand() + rand() - 1.5) * s * 1.15; // roughly normal
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const wave = (hour, peak) => Math.sin(((hour - peak + 6) / 24) * 2 * Math.PI); // +1 at `peak` h IST

// DO at 100 % saturation, fresh water (Benson–Krause), scaled for pressure.
const doSat = (t, p) => (14.652 - 0.41022 * t + 0.007991 * t ** 2 - 0.000077774 * t ** 3) * (p / 1013.25);

const end = Math.floor(Date.now() / (STEP_MIN * 60000)) * STEP_MIN * 60000;
const start = end - HOURS * 3600000;
const rows = [];
let uptime = 0, lastDay = -1, drift = 0;
// Sampling is uneven (3–10 min apart). Now and then the 4G link drops for
// 15–45 min: the boat keeps sampling, queues packets in flash, and uploads the
// backlog in a quick burst when the signal returns (as the real gateway does).
let outageUntil = 0, backlog = [];
const upload = (sampleT, at) => ({ sampleT, at });
const times = [];
for (let t = start; t <= end; t += (3 + rand() * 7) * 60000) {
  if (!outageUntil && rand() < 0.035) outageUntil = t + (15 + rand() * 30) * 60000;
  if (outageUntil && t < outageUntil) { backlog.push(t); continue; }
  if (outageUntil) {
    backlog.forEach((s, i) => times.push(upload(s, t + (i + 1) * (2000 + rand() * 3000))));
    backlog = [];
    outageUntil = 0;
  }
  times.push(upload(t, t + 2000 + rand() * 8000));
}
for (const { sampleT: t, at } of times) {
  const ist = new Date(t + 330 * 60000);
  const hour = ist.getUTCHours() + ist.getUTCMinutes() / 60;
  const day = ist.getUTCDate();
  if (day !== lastDay) { lastDay = day; uptime = 40000 + Math.floor(rand() * 20000); drift = noise(0.6); } // node restarted each morning
  uptime = Math.max(uptime + 60000, uptime + (t - (rows.at(-1)?.payload.utc_s ?? t / 1000) * 1000));
  const dayIndex = (t - start) / 86400000;

  // Air: coldest just before sunrise (06:30), warmest at 14:30, slow cooling overnight.
  const sinceMin = (hour - 6.5 + 24) % 24;
  const diurnal = sinceMin <= 8 ? -Math.cos((sinceMin / 8) * Math.PI) : Math.cos(((sinceMin - 8) / 16) * Math.PI);
  const air = 12.2 + 7 * diurnal - 0.7 * dayIndex + drift + noise(0.35);
  const water = 14.4 + 2.0 * wave(hour, 16.5) - 0.25 * dayIndex + noise(0.04);
  const pressure = 897.2 + 0.9 * Math.sin(((hour - 10) / 12) * 2 * Math.PI) + 0.5 * dayIndex + noise(0.08);
  const satPct = 0.88 + 0.17 * wave(hour, 15) + noise(0.012);
  const dox = doSat(water, pressure) * satPct;
  const pH = 7.52 + 0.3 * wave(hour, 15.5) + noise(0.025);
  const orp = 236 + 14 * wave(hour, 13) - 4 * dayIndex + noise(3);
  const tds = 164 + 5 * wave(hour, 17) + 2.5 * dayIndex + noise(1.8);

  rows.push({
    packet_id: randomUUID(),
    dataset_id: DATASET,
    device_id: ID,
    recorded_at: new Date(at).toISOString(), // when the server received it
    payload: {
      id: ID,
      ts: Math.round(uptime), // whole milliseconds, like the node sends
      pH: round(pH),
      tds_ppm: round(tds, 1),
      do_mgl: round(dox),
      orp_mv: round(orp, 1),
      temp_w1: round(water),
      temp_air: round(air),
      pressure_hpa: round(pressure),
      lat: round(LAT + noise(0.000018), 6),
      lon: round(LON + noise(0.000022), 6),
      alt_m: round(1004 + noise(1.5), 1),
      sog_knots: round(Math.abs(noise(0.05)), 1),
      cog_deg: round((150 + noise(40) + 360) % 360, 1),
      gps_fix: true,
      sats: 8 + Math.floor(rand() * 6),
      gps_age_s: 1 + Math.floor(rand() * 4),
      heading: round((155 + 12 * Math.sin(t / 5.4e6) + noise(3) + 360) % 360, 1),
      pitch: round(noise(0.6), 1),
      roll: round(noise(0.8), 1),
      utc_s: Math.floor(t / 1000),
    },
  });
}

if (process.env.DRY) {
  for (const k of ["temp_air", "temp_w1", "do_mgl", "pH", "orp_mv", "tds_ppm", "pressure_hpa"]) {
    const v = rows.map((r) => r.payload[k]);
    console.log(k.padEnd(13), Math.min(...v), "–", Math.max(...v));
  }
  const at = (h) => rows.find((r) => new Date(Date.parse(r.recorded_at) + 330 * 60000).getUTCHours() === h).payload;
  for (const h of [6, 15, 23]) console.log(`${h}:00 IST`, JSON.stringify(at(h)).slice(0, 150));
  const perHour = {};
  for (const r of rows) perHour[r.recorded_at.slice(0, 13)] = (perHour[r.recorded_at.slice(0, 13)] || 0) + 1;
  console.log("per hour", Object.values(perHour).join(" "));
  console.log("rows", rows.length);
  process.exit(0);
}

const client = new pg.Client({
  connectionString: target.toString(),
  ssl: { ca: readFileSync(new URL("../.wqm-tools/supabase-ca.crt", import.meta.url), "utf8"), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
  application_name: "wqm-demo-november-seed",
});
await client.connect();
try {
  const old = await client.query(
    "select packet_id, dataset_id, device_id, recorded_at, payload from public.dashboard_demo_packets where dataset_id=$1 and device_id=$2",
    [DATASET, ID],
  );
  const backup = process.argv[2] || "demo-backup.json";
  writeFileSync(backup, JSON.stringify(old.rows));
  console.log(`backed up ${old.rows.length} old rows to ${backup}`);

  await client.query("begin");
  const del = await client.query("delete from public.dashboard_demo_packets where dataset_id=$1 and device_id=$2", [DATASET, ID]);
  const ins = await client.query(
    `insert into public.dashboard_demo_packets (packet_id, dataset_id, device_id, recorded_at, payload)
     select packet_id, dataset_id, device_id, recorded_at, payload
     from jsonb_to_recordset($1::jsonb) as r(packet_id uuid, dataset_id text, device_id text, recorded_at timestamptz, payload jsonb)`,
    [JSON.stringify(rows)],
  );
  await client.query("commit");
  console.log(`deleted ${del.rowCount}, inserted ${ins.rowCount}, ${rows[0].recorded_at} -> ${rows.at(-1).recorded_at}`);
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  await client.end();
}
