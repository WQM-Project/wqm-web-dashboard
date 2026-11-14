import { createHash, timingSafeEqual } from 'node:crypto'
import { z } from 'zod'

const measurement = z.number().finite()
const optionalMeasurement = measurement.optional()
export const packetSchema = z.object({
  id: z.string().regex(/^[A-Za-z0-9_-]{1,64}$/),
  ts: z.number().int().min(0).max(4294967295),
  // Sensors fitted to the active STM32 board; the gateway refuses packets without them.
  pH: measurement, tds_ppm: measurement, do_mgl: measurement, orp_mv: measurement,
  temp_w1: measurement, temp_air: measurement, pressure_hpa: measurement,
  // Reserved sensors not fitted to the current board; forwarded when present.
  turb_ntu: optionalMeasurement, ec_uscm: optionalMeasurement,
  temp_w2: optionalMeasurement, depth_cm: optionalMeasurement, humidity: optionalMeasurement,
  // STM32 navigation (NEO-M8N GNSS + IMU), forwarded as reported.
  alt_m: optionalMeasurement, sog_knots: optionalMeasurement, cog_deg: optionalMeasurement,
  heading: optionalMeasurement, pitch: optionalMeasurement, roll: optionalMeasurement,
  sats: z.number().int().min(0).max(255).optional(),
  // Added by the gateway from the SIM7600 GNSS. Absent until the first fix.
  lat: z.number().finite().min(-90).max(90).optional(),
  lon: z.number().finite().min(-180).max(180).optional(),
  gps_fix: z.boolean().optional(),
  gps_age_s: z.number().int().min(0).max(4294967295).optional(),
  // Gateway arrival time, Unix seconds UTC; absent until its clock is set.
  utc_s: z.number().int().min(1767225600).max(4294967295).optional(),
}).strict().superRefine((packet, context) => {
  if ((packet.lat === undefined) !== (packet.lon === undefined))
    context.addIssue({ code: 'custom', path: ['lon'], message: 'lat and lon must be sent together' })
  if (packet.gps_fix && packet.lat === undefined)
    context.addIssue({ code: 'custom', path: ['lat'], message: 'gps_fix requires lat and lon' })
})
export type Packet = z.infer<typeof packetSchema>
export type SavePacket = (packetId: string, packet: Packet) => Promise<boolean>
export class PacketConflict extends Error {}
const MAX_BYTES = 4096
const digest = (value: string) => createHash('sha256').update(value).digest()
const reply = (status: number, body: object) => Response.json(body, {
  status, headers: { 'Cache-Control': 'no-store' },
})

export function createIngestHandler(options: {
  key: string | undefined; allowedNodes: string[]; save: SavePacket
}) {
  return async (request: Request): Promise<Response> => {
    if (!options.key || options.allowedNodes.length === 0)
      return reply(503, { error: 'ingestion_not_configured' })
    const authorization = request.headers.get('authorization') ?? ''
    if (!timingSafeEqual(digest(authorization), digest(`Bearer ${options.key}`)))
      return reply(401, { error: 'unauthorized' })
    if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json')
      return reply(415, { error: 'expected_application_json' })
    const packetId = request.headers.get('x-packet-id') ?? ''
    if (!z.string().uuid().safeParse(packetId).success)
      return reply(400, { error: 'invalid_packet_id' })
    if (Number(request.headers.get('content-length')) > MAX_BYTES)
      return reply(413, { error: 'packet_too_large' })
    let value: unknown
    try {
      const reader = request.body?.getReader()
      if (!reader) return reply(400, { error: 'invalid_json' })
      const chunks: Uint8Array[] = []
      let size = 0
      while (true) {
        const result = await reader.read()
        if (result.done) break
        size += result.value.byteLength
        if (size > MAX_BYTES) {
          await reader.cancel()
          return reply(413, { error: 'packet_too_large' })
        }
        chunks.push(result.value)
      }
      value = JSON.parse(Buffer.concat(chunks).toString('utf8'))
    } catch {
      return reply(400, { error: 'invalid_json' })
    }
    const parsed = packetSchema.safeParse(value)
    if (!parsed.success) return reply(422, {
      error: 'invalid_telemetry',
      fields: parsed.error.issues.map(issue => ({ field: issue.path.join('.'), message: issue.message })),
    })
    if (!options.allowedNodes.includes(parsed.data.id))
      return reply(403, { error: 'unknown_node' })
    try {
      const duplicate = await options.save(packetId.toLowerCase(), parsed.data)
      return reply(duplicate ? 200 : 201, { saved: true, duplicate, packet_id: packetId.toLowerCase() })
    } catch (error) {
      if (error instanceof PacketConflict) return reply(409, { error: 'packet_id_reused' })
      return reply(503, { error: 'storage_unavailable' })
    }
  }
}
