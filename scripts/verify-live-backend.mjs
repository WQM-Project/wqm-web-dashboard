import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
const pg = require('../.wqm-tools/node_modules/pg')
const target = new URL(process.env.DATABASE_URL || '')
if (process.env.SUPABASE_PROJECT_REF !== 'scvcufiagvbeixhnwjze' ||
    target.username !== 'postgres.scvcufiagvbeixhnwjze' ||
    new URL(process.env.SUPABASE_URL).hostname !== 'scvcufiagvbeixhnwjze.supabase.co')
  throw new Error('WQM-only target verification failed')
target.searchParams.delete('sslmode')
const client = new pg.Client({ connectionString: target.toString(),
  ssl: { ca: readFileSync(new URL('../.wqm-tools/supabase-ca.crt', import.meta.url), 'utf8'), rejectUnauthorized: true },
  connectionTimeoutMillis: 15000, statement_timeout: 15000,
  application_name: 'wqm-end-to-end-verification',
})
const base = process.env.WQM_BACKEND_URL || 'http://localhost:3000'
const edge = process.argv.includes('--edge')
const endpoint = edge
  ? new URL('/functions/v1/ingest', process.env.SUPABASE_URL)
  : new URL('/api/ingest', base)
const packetId = randomUUID()
const packet = { id: 'WQM-001', ts: 12000, pH: 7.12, turb_ntu: 42.5,
  tds_ppm: 310, do_mgl: 6.85, ec_uscm: 680.2, orp_mv: 215,
  temp_w1: 23.5, temp_w2: 23.48, depth_cm: 35.2,
  temp_air: 28.6, humidity: 65.3, pressure_hpa: 1013.25 }
async function upload(body = packet, authorization = `Bearer ${process.env.GATEWAY_INGEST_KEY}`) {
  const response = await fetch(endpoint, { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: authorization, 'X-Packet-Id': packetId },
    body: JSON.stringify(body), signal: AbortSignal.timeout(20000) })
  return { status: response.status, body: await response.json() }
}
let connected = false
try {
  await client.connect(); connected = true
  if (edge) {
    const response = await fetch(endpoint, { signal: AbortSignal.timeout(20000) })
    assert.equal(response.status, 405)
    console.log('PASS: public Edge Function reachable; GET rejected as expected')
  } else {
    const health = await fetch(new URL('/api/health', base), { signal: AbortSignal.timeout(15000) })
    assert.equal(health.status, 200)
    assert.equal((await health.json()).ok, true)
    console.log('PASS: local health route')
  }
  assert.equal((await upload(packet, 'Bearer deliberately-wrong')).status, 401)
  assert.equal((await upload({ ...packet, pH: 'invalid' })).status, 422)
  console.log('PASS: rejected bad credentials and malformed telemetry')
  const first = await upload()
  assert.equal(first.status, 201); assert.equal(first.body.saved, true)
  assert.equal(first.body.duplicate, false)
  const row = await client.query('select payload, node_uptime_ms, recorded_at from public.telemetry_packets where device_id = $1 and packet_id = $2', [packet.id, packetId])
  assert.equal(row.rowCount, 1); assert.deepEqual(row.rows[0].payload, packet)
  assert.equal(Number(row.rows[0].node_uptime_ms), packet.ts)
  assert.ok(row.rows[0].recorded_at)
  console.log('PASS: POST accepted and exact reading verified in WQM database')
  const retry = await upload()
  assert.equal(retry.status, 200); assert.equal(retry.body.duplicate, true)
  assert.equal((await upload({ ...packet, pH: 8 })).status, 409)
  const after = await client.query('select payload from public.telemetry_packets where device_id = $1 and packet_id = $2', [packet.id, packetId])
  assert.equal(after.rowCount, 1); assert.deepEqual(after.rows[0].payload, packet)
  console.log('PASS: duplicate retry and changed-payload conflict preserve original')
} catch (error) {
  console.error('Live verification failed:', error.code || error.message)
  process.exitCode = 1
} finally {
  if (connected) {
    try {
      const removed = await client.query('delete from public.telemetry_packets where device_id = $1 and packet_id = $2', [packet.id, packetId])
      console.log('Verification sample rows cleaned up:', removed.rowCount)
    } catch { console.error('Sample cleanup failed; packet ID:', packetId); process.exitCode = 1 }
  }
  await client.end().catch(() => {})
}
