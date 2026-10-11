import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { randomUUID } from "node:crypto";

const project = "scvcufiagvbeixhnwjze";
const target = new URL(process.env.DATABASE_URL || "");
if (
  process.env.SUPABASE_PROJECT_REF !== project ||
  target.username !== `postgres.${project}` ||
  target.hostname !== "aws-0-ap-south-1.pooler.supabase.com" ||
  process.env.SUPABASE_URL !== `https://${project}.supabase.co`
)
  throw new Error("WQM-only target verification failed");
target.searchParams.delete("sslmode");
const pg = createRequire(import.meta.url)("../.wqm-tools/node_modules/pg");
const client = new pg.Client({
  connectionString: target.toString(),
  ssl: {
    ca: readFileSync(
      new URL("../.wqm-tools/supabase-ca.crt", import.meta.url),
      "utf8",
    ),
    rejectUnauthorized: true,
  },
  connectionTimeoutMillis: 15000,
  statement_timeout: 15000,
  application_name: "wqm-dashboard-demo-seed",
});
const round = (value, decimals = 2) => Number(value.toFixed(decimals));
try {
  await client.connect();
  await client.query("begin");
  await client.query(
    "select pg_advisory_xact_lock(hashtext('wqm_dashboard_demo_v1'))",
  );
  const exists = await client.query(
    "select to_regclass('public.dashboard_demo_packets') as table_name",
  );
  if (!exists.rows[0].table_name)
    await client.query(
      readFileSync(
        new URL(
          "../supabase/migrations/202610110001_dashboard_demo.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  const columns = await client.query(
    "select column_name from information_schema.columns where table_schema='public' and table_name='dashboard_demo_packets' order by column_name",
  );
  if (
    columns.rows.map((row) => row.column_name).join(",") !==
    "dataset_id,device_id,packet_id,payload,recorded_at"
  )
    throw new Error("Unexpected existing demo table; no changes made");
  const count = await client.query(
    "select count(*)::int as total from public.dashboard_demo_packets where dataset_id='wqm-dashboard-demo-v1'",
  );
  if (![0, 96, 288].includes(count.rows[0].total))
    throw new Error("Unexpected demo dataset size; inspect before seeding");
  const constraint = await client.query(
    "select pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.dashboard_demo_packets'::regclass and conname='dashboard_demo_packets_device_id_check'",
  );
  const definition = constraint.rows[0]?.definition || "";
  if (!definition.includes("DEMO-001"))
    throw new Error("Unexpected demo node constraint");
  if (definition.includes("DEMO-002") && definition.includes("DEMO-003")) {
    await client.query(
      readFileSync(
        new URL(
          "../supabase/migrations/202610120001_single_boat_demo.sql",
          import.meta.url,
        ),
        "utf8",
      ),
    );
  }
  if (count.rows[0].total === 288) {
    const remaining = await client.query(
      "select count(*)::int as total from public.dashboard_demo_packets where device_id='DEMO-001'",
    );
    if (remaining.rows[0].total !== 96)
      throw new Error("Single-boat demo conversion failed; rolling back");
  }
  if (count.rows[0].total === 0) {
    const end = Math.floor(Date.now() / 900000) * 900000;
    const rows = [];
    const node = 0;
    for (let step = 0; step < 96; step++) {
      const id = "DEMO-001";
      const phase = (step / 96) * Math.PI * 2;
      const noise = () => Math.random() - 0.5;
      const burst = Math.exp(-(((step - 65 - node * 3) / 9) ** 2));
      const water =
        22.1 + 2.4 * Math.sin(phase - 1.7) + node * 0.6 + noise() * 0.2;
      const payload = {
        id,
        ts: step * 900000,
        pH: round(7.25 + Math.sin(phase + node) * 0.24 + noise() * 0.07),
        turb_ntu: round(
          14 + node * 5 + burst * (28 + node * 5) + noise() * 3,
          1,
        ),
        tds_ppm: round(
          290 + node * 28 + 24 * Math.sin(phase) + noise() * 12,
          1,
        ),
        do_mgl: round(
          7.4 - (water - 22) * 0.15 - burst * 0.35 + noise() * 0.12,
        ),
        ec_uscm: round(
          590 + node * 50 + Math.sin(phase) * 45 + noise() * 15,
          1,
        ),
        orp_mv: round(220 + Math.sin(phase + 0.8) * 20 + noise() * 5, 1),
        temp_w1: round(water),
        temp_w2: round(water + noise() * 0.18),
        depth_cm: round(65 + node * 15 + Math.sin(phase) * 4, 1),
        temp_air: round(27 + Math.sin(phase - 1.3) * 4 + noise() * 0.4, 1),
        humidity: round(65 - Math.sin(phase - 1.3) * 10 + noise() * 2, 1),
        pressure_hpa: round(1009 + Math.sin(phase) * 2 + noise() * 0.3),
      };
      rows.push({
        packet_id: randomUUID(),
        dataset_id: "wqm-dashboard-demo-v1",
        device_id: id,
        recorded_at: new Date(end - (95 - step) * 900000).toISOString(),
        payload,
      });
    }
    await client.query(
      `insert into public.dashboard_demo_packets (packet_id,dataset_id,device_id,recorded_at,payload)
      select packet_id,dataset_id,device_id,recorded_at,payload from jsonb_to_recordset($1::jsonb)
      as x(packet_id uuid,dataset_id text,device_id text,recorded_at timestamptz,payload jsonb)`,
      [JSON.stringify(rows)],
    );
  }
  const result =
    await client.query(`select count(*)::int as total, count(distinct device_id)::int as nodes,
    min(recorded_at) as first, max(recorded_at) as last from public.dashboard_demo_packets`);
  const security = await client.query(`select relrowsecurity as rls,
    has_table_privilege('anon','public.dashboard_demo_packets','select') as anon_read,
    has_table_privilege('authenticated','public.dashboard_demo_packets','insert') as user_write
    from pg_class where oid='public.dashboard_demo_packets'::regclass`);
  if (
    !security.rows[0].rls ||
    security.rows[0].anon_read ||
    security.rows[0].user_write
  )
    throw new Error("Demo table access controls failed verification");
  await client.query("commit");
  console.log("WQM demo dataset ready:", JSON.stringify(result.rows[0]));
  console.log("RLS verified; gateway telemetry and ingestion unchanged.");
} catch (error) {
  await client.query("rollback").catch(() => {});
  console.error("Demo seed failed:", error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
