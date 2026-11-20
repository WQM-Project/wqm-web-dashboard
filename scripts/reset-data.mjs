// Delete seeded or test data so you can reset and test again.
// Dry run by default: it only prints what it would delete. Add --yes to delete.
// Every real delete first saves a backup JSON in backups/.
//
//   node --env-file=.env.local scripts/reset-data.mjs pond              # the seeded 20 Nov pond session (gateway)
//   node --env-file=.env.local scripts/reset-data.mjs since 2026-11-21T09:00:00+05:30   # gateway packets after a time
//   node --env-file=.env.local scripts/reset-data.mjs gateway-all       # every Boat 01 gateway packet
//   node --env-file=.env.local scripts/reset-data.mjs workspace         # all Workspace readings (demo set)
//   ...add --yes to actually delete.
//
// Restore a backup with:  node --env-file=.env.local scripts/reset-data.mjs restore backups/<file>.json --yes
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";

const project = "scvcufiagvbeixhnwjze";
const target = new URL(process.env.DATABASE_URL || "");
if (process.env.SUPABASE_PROJECT_REF !== project || target.username !== `postgres.${project}`)
  throw new Error("WQM-only target verification failed");
target.searchParams.delete("sslmode");
const pg = createRequire(import.meta.url)("../.wqm-tools/node_modules/pg");

const [mode, arg] = process.argv.slice(2).filter((a) => a !== "--yes");
const apply = process.argv.includes("--yes");
const GATEWAY = "public.telemetry_packets";
const DEMO = "public.dashboard_demo_packets";

// Packet IDs the pond seed script created (derived from each row's UTC second).
function pondIds() {
  const uuid = (t) => {
    const h = createHash("sha1").update(t).digest("hex");
    return `${h.slice(0, 8)}-${h.slice(8, 12)}-5${h.slice(13, 16)}-${((parseInt(h[16], 16) & 3) | 8).toString(16)}${h.slice(17, 20)}-${h.slice(20, 32)}`;
  };
  const [head, ...lines] = readFileSync(new URL("../../Seeding data/dirty_pool_water_2026-11-20_wqm-001.csv", import.meta.url), "utf8").trim().split(/\r?\n/);
  const col = head.split(",").indexOf("utc_s");
  return lines.map((l) => uuid(`WQM-001:${Number(l.split(",")[col])}:pool-2026-11-20`));
}

const plans = {
  pond: () => ({ table: GATEWAY, where: "device_id='WQM-001' and packet_id = any($1::uuid[])", params: [pondIds()] }),
  since: () => {
    if (!arg || Number.isNaN(Date.parse(arg))) throw new Error("Give a time, e.g. since 2026-11-21T09:00:00+05:30");
    return { table: GATEWAY, where: "device_id='WQM-001' and recorded_at >= $1", params: [new Date(arg).toISOString()] };
  },
  "gateway-all": () => ({ table: GATEWAY, where: "device_id='WQM-001'", params: [] }),
  workspace: () => ({ table: DEMO, where: "dataset_id='wqm-dashboard-demo-v1' and device_id='DEMO-001'", params: [] }),
};

const client = new pg.Client({
  connectionString: target.toString(),
  ssl: { ca: readFileSync(new URL("../.wqm-tools/supabase-ca.crt", import.meta.url), "utf8"), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000,
  statement_timeout: 30000,
  application_name: "wqm-reset-data",
});

if (mode === "restore") {
  if (!arg) throw new Error("Give the backup file path");
  const { table, rows } = JSON.parse(readFileSync(arg, "utf8"));
  if (![GATEWAY, DEMO].includes(table)) throw new Error("Unknown table in backup");
  console.log(`${rows.length} rows to restore into ${table}${apply ? "" : " (dry run; add --yes)"}`);
  if (apply && rows.length) {
    await client.connect();
    const cols = Object.keys(rows[0]);
    const types = await client.query(
      "select column_name, data_type from information_schema.columns where table_schema='public' and table_name=$1",
      [table.split(".")[1]],
    );
    const known = types.rows.filter((t) => cols.includes(t.column_name));
    const names = known.map((t) => t.column_name).join(", ");
    const def = known.map((t) => `${t.column_name} ${t.data_type === "USER-DEFINED" ? "text" : t.data_type}`).join(", ");
    const res = await client.query(
      `insert into ${table} (${names}) select ${names} from jsonb_to_recordset($1::jsonb) as r(${def}) on conflict do nothing`,
      [JSON.stringify(rows)],
    );
    console.log(`restored ${res.rowCount}`);
    await client.end();
  }
  process.exit(0);
}

if (!plans[mode]) {
  console.log("Modes: pond | since <time> | gateway-all | workspace | restore <file>   (add --yes to apply)");
  process.exit(1);
}

const { table, where, params } = plans[mode]();
await client.connect();
try {
  const rows = (await client.query(`select * from ${table} where ${where}`, params)).rows;
  const span = rows.length ? `${new Date(Math.min(...rows.map((r) => +r.recorded_at))).toISOString()} → ${new Date(Math.max(...rows.map((r) => +r.recorded_at))).toISOString()}` : "";
  console.log(`${mode}: ${rows.length} rows in ${table} ${span}`);
  if (!apply) {
    console.log("Dry run. Add --yes to delete them.");
  } else if (rows.length) {
    mkdirSync(new URL("../backups/", import.meta.url), { recursive: true });
    const file = new URL(`../backups/${mode}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`, import.meta.url);
    writeFileSync(file, JSON.stringify({ table, rows }));
    await client.query("begin");
    const res = await client.query(`delete from ${table} where ${where}`, params);
    if (res.rowCount !== rows.length) throw new Error(`Would delete ${res.rowCount}, expected ${rows.length}; rolled back`);
    await client.query("commit");
    console.log(`deleted ${res.rowCount}; backup saved to ${file.pathname.slice(1)}`);
  }
} catch (error) {
  await client.query("rollback").catch(() => {});
  throw error;
} finally {
  await client.end();
}
