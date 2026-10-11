import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const packetId = process.argv[2]
if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(packetId || ''))
  throw new Error('Provide the UUID printed by backend_upload_test')
const target = new URL(process.env.DATABASE_URL || '')
if (process.env.SUPABASE_PROJECT_REF !== 'scvcufiagvbeixhnwjze' ||
    target.username !== 'postgres.scvcufiagvbeixhnwjze' ||
    target.hostname !== 'aws-0-ap-south-1.pooler.supabase.com' ||
    new URL(process.env.SUPABASE_URL).hostname !== 'scvcufiagvbeixhnwjze.supabase.co')
  throw new Error('WQM-only target verification failed')
target.searchParams.delete('sslmode')
const pg = createRequire(import.meta.url)('../.wqm-tools/node_modules/pg')
const client = new pg.Client({ connectionString: target.toString(),
  ssl: { ca: readFileSync(new URL('../.wqm-tools/supabase-ca.crt', import.meta.url), 'utf8'), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000, statement_timeout: 15000,
  application_name: 'wqm-modem-packet-read-only-verification' })
const expected = { id: 'WQM-001', ts: 12000, pH: 7.12, turb_ntu: 42.5,
  tds_ppm: 310, do_mgl: 6.85, ec_uscm: 680.2, orp_mv: 215,
  temp_w1: 23.5, temp_w2: 23.48, depth_cm: 35.2,
  temp_air: 28.6, humidity: 65.3, pressure_hpa: 1013.25 }
try {
  await client.connect()
  await client.query('BEGIN READ ONLY')
  const row = await client.query('select device_id, packet_id, payload, node_uptime_ms, recorded_at from public.telemetry_packets where packet_id = $1', [packetId])
  assert.equal(row.rowCount, 1, 'Expected exactly one row for this modem test UUID')
  assert.equal(row.rows[0].device_id, expected.id)
  assert.equal(Number(row.rows[0].node_uptime_ms), expected.ts)
  assert.deepEqual(row.rows[0].payload, expected)
  console.log('PASS: exactly one WQM-001 row; all 14 synthetic fields match the modem test')
  console.log('Packet ID:', row.rows[0].packet_id)
  console.log('Stored at UTC:', row.rows[0].recorded_at.toISOString())
  await client.query('COMMIT')
} catch (error) {
  console.error('Packet verification failed:', error.message)
  process.exitCode = 1
} finally { await client.end().catch(() => {}) }
