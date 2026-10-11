import { randomUUID } from 'node:crypto'

const base = process.env.WQM_BACKEND_URL || 'http://localhost:3000'
const key = process.env.GATEWAY_INGEST_KEY
if (!key) throw new Error('Set GATEWAY_INGEST_KEY in your environment first.')
const packet = {
  id: process.env.WQM_TEST_NODE_ID || 'WQM-001', ts: 12000, pH: 7.12,
  turb_ntu: 42.5, tds_ppm: 310, do_mgl: 6.85, ec_uscm: 680.2, orp_mv: 215,
  temp_w1: 23.5, temp_w2: 23.48, depth_cm: 35.2, temp_air: 28.6,
  humidity: 65.3, pressure_hpa: 1013.25,
}
const packetId = randomUUID()
for (let attempt = 0; attempt < 2; attempt++) {
  const response = await fetch(new URL('/api/ingest', base), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, 'X-Packet-Id': packetId },
    body: JSON.stringify(packet), signal: AbortSignal.timeout(15000),
  })
  const body = await response.json()
  console.log(response.status, body)
  if (response.status !== (attempt === 0 ? 201 : 200) || body.saved !== true || body.duplicate !== (attempt === 1)) {
    process.exitCode = 1
    break
  }
}
