import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createIngestHandler, PacketConflict, packetSchema } from '../lib/server/ingest'
import { supabaseStorage } from '../lib/server/storage'

const key = 'test-only-key'
const packetId = 'c7b70bf6-854b-43b0-bdf0-e7f80e250eaf'
const packet = { id: 'WQM-001', ts: 12000, pH: 7.12, turb_ntu: 42.5,
  tds_ppm: 310, do_mgl: 6.85, ec_uscm: 680.2, orp_mv: 215,
  temp_w1: 23.5, temp_w2: 23.48, depth_cm: 35.2,
  temp_air: 28.6, humidity: 65.3, pressure_hpa: 1013.25 }
function request(body: unknown = packet, headers: Record<string, string> = {}) {
  return new Request('http://localhost/api/ingest', { method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', 'X-Packet-Id': packetId, ...headers },
    body: JSON.stringify(body) })
}
test('saves complete telemetry, preserves uptime and acknowledges identical retry', async () => {
  const stored = new Map<string, string>()
  const handler = createIngestHandler({ key, allowedNodes: ['WQM-001'], save: async (id, value) => {
    assert.equal(value.ts, 12000)
    const previous = stored.get(id)
    if (previous && previous !== JSON.stringify(value)) throw new PacketConflict()
    stored.set(id, JSON.stringify(value))
    return previous !== undefined
  } })
  assert.equal((await handler(request())).status, 201)
  const retry = await handler(request())
  assert.equal(retry.status, 200)
  assert.equal((await retry.json()).duplicate, true)
  assert.equal(stored.size, 1)
  assert.equal((await handler(request({ ...packet, pH: 8 }))).status, 409)
})
test('rejects bad input before storage', async () => {
  let writes = 0
  const handler = createIngestHandler({ key, allowedNodes: ['WQM-001'], save: async () => { writes++; return false } })
  const cases: [Request, number][] = [
    [request(packet, { Authorization: 'Bearer wrong' }), 401],
    [request(packet, { 'Content-Type': 'text/plain' }), 415],
    [request(packet, { 'X-Packet-Id': 'bad' }), 400],
    [request({ ...packet, id: 'UNKNOWN' }), 403],
    [request({ ...packet, pH: '7.12' }), 422],
    [request({ ...packet, ts: -1 }), 422],
    [request({ ...packet, ts: 4294967296 }), 422],
    [request({ id: 'WQM-001' }), 422],
    [request({ ...packet, extra: true }), 422],
    [request('x'.repeat(5000)), 413],
  ]
  for (const [input, status] of cases) assert.equal((await handler(input)).status, status)
  const malformed = request()
  const broken = new Request(malformed.url, { method: 'POST', headers: malformed.headers, body: '{broken' })
  assert.equal((await handler(broken)).status, 400)
  assert.equal(writes, 0)
  assert.equal(packetSchema.safeParse({ ...packet, pH: Infinity }).success, false)
})
test('accepts gateway GPS fields and rejects inconsistent ones', () => {
  const located = { ...packet, lat: 31.78102, lon: 76.99731, gps_fix: true, gps_age_s: 2 }
  assert.equal(packetSchema.safeParse(located).success, true)
  assert.equal(packetSchema.safeParse({ ...packet, gps_fix: false }).success, true)
  assert.equal(packetSchema.safeParse({ ...located, lat: 91 }).success, false)
  assert.equal(packetSchema.safeParse({ ...located, lon: undefined }).success, false)
  assert.equal(packetSchema.safeParse({ ...packet, gps_fix: true }).success, false)
  assert.equal(packetSchema.safeParse({ ...located, gps_age_s: 1.5 }).success, false)
  assert.equal(packetSchema.safeParse({ ...located, utc_s: 1793833000 }).success, true)
  assert.equal(packetSchema.safeParse({ ...located, utc_s: 0 }).success, false)
})
test('accepts active 19-field STM32 packets without legacy optional sensors', () => {
  const stmPacket = {
    id: 'WQM-001', ts: 166519, pH: 7.12, tds_ppm: 310.0, do_mgl: 8.84,
    orp_mv: 91.6, temp_w1: 23.62, temp_air: 28.60, pressure_hpa: 1013.25,
    lat: 0.0, lon: 0.0, alt_m: 0.0, sog_knots: 0.0, cog_deg: 0.0,
    gps_fix: 0, sats: 0, heading: 12.5, pitch: -0.4, roll: 0.8,
  }
  assert.equal(packetSchema.safeParse(stmPacket).success, true)
  assert.equal(packetSchema.safeParse({ ...stmPacket, lat: undefined, lon: undefined, gps_fix: 1 }).success, false)
})
test('fails closed without configuration and never acknowledges failed storage', async () => {
  const handler = createIngestHandler({ key, allowedNodes: ['WQM-001'], save: async () => { throw new Error('secret database detail') } })
  const response = await handler(request())
  assert.equal(response.status, 503)
  assert.deepEqual(await response.json(), { error: 'storage_unavailable' })
  assert.equal((await createIngestHandler({ key: undefined, allowedNodes: [], save: async () => false })(request())).status, 503)
})
test('database transport sends server credentials and exact RPC payload', async () => {
  for (const databaseKey of ['sb_secret_test', 'legacy-jwt-test']) {
    const transport = (async (input: URL | RequestInfo, init?: RequestInit) => {
      assert.equal(String(input), 'https://example.supabase.co/rest/v1/rpc/ingest_telemetry')
      const headers = new Headers(init?.headers)
      assert.equal(headers.get('apikey'), databaseKey)
      assert.equal(headers.get('authorization'), databaseKey.startsWith('sb_secret_') ? null : `Bearer ${databaseKey}`)
      assert.deepEqual(JSON.parse(String(init?.body)), { p_packet_id: packetId, p_packet: packet })
      return Response.json(false)
    }) as typeof fetch
    assert.equal(await supabaseStorage({ SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: databaseKey }, transport)(packetId, packet), false)
  }
})
test('database conflict and failed responses propagate correctly', async () => {
  const env = { SUPABASE_URL: 'https://example.supabase.co', SUPABASE_SECRET_KEY: 'sb_secret_test' }
  await assert.rejects(supabaseStorage(env, (async () => new Response('', { status: 409 })) as typeof fetch)(packetId, packet), PacketConflict)
  await assert.rejects(supabaseStorage(env, (async () => new Response('', { status: 500 })) as typeof fetch)(packetId, packet))
  await assert.rejects(supabaseStorage(env, (async () => Response.json({ unexpected: true })) as typeof fetch)(packetId, packet))
})
