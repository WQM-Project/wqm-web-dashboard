import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const pg = require('../.wqm-tools/node_modules/pg')

const project = 'scvcufiagvbeixhnwjze'
const connection = new URL(process.env.DATABASE_URL || '')
if (process.env.SUPABASE_PROJECT_REF !== project ||
    connection.username !== `postgres.${project}` ||
    connection.hostname !== 'aws-0-ap-south-1.pooler.supabase.com' ||
    connection.searchParams.get('sslmode') !== 'require') {
  throw new Error('WQM-only database target verification failed')
}
connection.searchParams.delete('sslmode')
const client = new pg.Client({ connectionString: connection.toString(),
  ssl: { ca: readFileSync(new URL('../.wqm-tools/supabase-ca.crt', import.meta.url), 'utf8'), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000,
  statement_timeout: 15000, application_name: 'wqm-schema-setup' })
try {
  await client.connect()
  const mode = process.argv[2] || 'inspect'
  if (mode === 'inspect') {
    const tables = await client.query("select tablename, rowsecurity from pg_tables where schemaname = 'public' order by tablename")
    const functions = await client.query("select proname from pg_proc join pg_namespace n on n.oid = pronamespace where n.nspname = 'public' and proname = 'ingest_telemetry'")
    console.log(JSON.stringify({ project, tables: tables.rows, ingestionFunctions: functions.rows }))
  } else if (mode === 'migrate') {
    await client.query('begin')
    await client.query("select pg_advisory_xact_lock(hashtext('wqm_gateway_ingestion'))")
    const existing = await client.query("select to_regclass('public.telemetry_packets') as table_name, to_regprocedure('public.ingest_telemetry(uuid,jsonb)') as function_name")
    if (existing.rows[0].table_name || existing.rows[0].function_name)
      throw new Error('Existing ingestion objects found; inspect rather than overwrite')
    await client.query(readFileSync(new URL('../supabase/migrations/202610090001_gateway_ingestion.sql', import.meta.url), 'utf8'))
    await client.query('commit')
    console.log('WQM telemetry migration applied successfully.')
  } else if (mode === 'verify') {
    const result = await client.query(`select
      (select relrowsecurity from pg_class where oid = 'public.telemetry_packets'::regclass) as rls_enabled,
      has_table_privilege('anon','public.telemetry_packets','select') as anon_read,
      has_table_privilege('authenticated','public.telemetry_packets','insert') as user_write,
      has_function_privilege('anon','public.ingest_telemetry(uuid,jsonb)','execute') as anon_ingest,
      has_function_privilege('service_role','public.ingest_telemetry(uuid,jsonb)','execute') as server_ingest`)
    const row = result.rows[0]
    if (!row.rls_enabled || row.anon_read || row.user_write || row.anon_ingest || !row.server_ingest)
      throw new Error('Database privilege verification failed')
    console.log(JSON.stringify({ project, ...row }))
  } else throw new Error('Use inspect, migrate or verify')
} catch (error) {
  await client.query('rollback').catch(() => {})
  console.error('WQM database operation failed.', error.code || error.message)
  process.exitCode = 1
} finally { await client.end().catch(() => {}) }
