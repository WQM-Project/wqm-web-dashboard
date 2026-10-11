import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { pathToFileURL } from 'node:url'
import assert from 'node:assert/strict'
import ts from 'typescript'

const require = createRequire(import.meta.url)
const source = readFileSync(new URL('../supabase/functions/ingest/index.ts', import.meta.url), 'utf8')
  .replace('npm:zod@3.25.76', pathToFileURL(require.resolve('zod')).href)
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext,
  target: ts.ScriptTarget.ES2022 }, reportDiagnostics: true })
assert.equal(compiled.diagnostics?.length ?? 0, 0)
const env = { SUPABASE_URL: 'https://scvcufiagvbeixhnwjze.supabase.co',
  SUPABASE_SERVICE_ROLE_KEY: 'test-server-key', GATEWAY_INGEST_KEY: 'test-gateway-key',
  GATEWAY_ALLOWED_NODE_IDS: 'WQM-001' }
let handler
globalThis.Deno = { env: { get: name => env[name] }, serve: callback => { handler = callback } }
await import(`data:text/javascript;base64,${Buffer.from(compiled.outputText).toString('base64')}`)
const originalFetch = globalThis.fetch
const packetId = 'c7b70bf6-854b-43b0-bdf0-e7f80e250eaf'
const packet = { id: 'WQM-001', ts: 12000, pH: 7.12, turb_ntu: 42.5,
  tds_ppm: 310, do_mgl: 6.85, ec_uscm: 680.2, orp_mv: 215,
  temp_w1: 23.5, temp_w2: 23.48, depth_cm: 35.2,
  temp_air: 28.6, humidity: 65.3, pressure_hpa: 1013.25 }
let saved, writes = 0
globalThis.fetch = async (url, options) => {
  assert.equal(String(url), env.SUPABASE_URL + '/rest/v1/rpc/ingest_telemetry')
  assert.equal(new Headers(options.headers).get('apikey'), env.SUPABASE_SERVICE_ROLE_KEY)
  writes++
  const data = JSON.parse(options.body)
  if (saved && JSON.stringify(data) !== JSON.stringify(saved)) return new Response('', { status: 409 })
  const duplicate = Boolean(saved)
  saved = data
  return Response.json(duplicate)
}
function request(body = packet, key = env.GATEWAY_INGEST_KEY) {
  return new Request(env.SUPABASE_URL + '/functions/v1/ingest', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + key, 'X-Packet-Id': packetId },
    body: JSON.stringify(body) })
}
try {
  assert.equal((await handler(new Request(env.SUPABASE_URL))).status, 405)
  assert.equal((await handler(request(packet, 'wrong-key'))).status, 401)
  assert.equal((await handler(request({ ...packet, pH: 'bad' }))).status, 422)
  assert.equal(writes, 0)
  const first = await handler(request())
  assert.equal(first.status, 201); assert.equal((await first.json()).duplicate, false)
  const retry = await handler(request())
  assert.equal(retry.status, 200); assert.equal((await retry.json()).duplicate, true)
  assert.equal((await handler(request({ ...packet, pH: 8 }))).status, 409)
  assert.deepEqual(saved.p_packet, packet)
  env.GATEWAY_ALLOWED_NODE_IDS = ''
  assert.equal((await handler(request())).status, 503)
  env.SUPABASE_URL = 'https://wrong-project.supabase.co'
  assert.equal((await handler(request())).status, 503)
  console.log('PASS: generated Edge entrypoint — methods, auth, validation, save, retry, conflict, config and project isolation')
} finally {
  globalThis.fetch = originalFetch
  delete globalThis.Deno
}
