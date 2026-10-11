import { PacketConflict, type SavePacket } from './ingest'

// This module is imported only by the Node server route. Never import into client components.
export function supabaseStorage(env: Record<string, string | undefined>, transport: typeof fetch = fetch): SavePacket {
  return async (packetId, packet) => {
    const base = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL
    const key = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY
    if (!base || !key) throw new Error('Missing server database configuration')
    const url = new URL('/rest/v1/rpc/ingest_telemetry', base)
    const headers: Record<string, string> = { 'Content-Type': 'application/json', apikey: key }
    // Legacy JWT keys also authenticate with Bearer; new secret keys use apikey.
    if (!key.startsWith('sb_secret_')) headers.Authorization = `Bearer ${key}`
    const response = await transport(url, {
      method: 'POST', headers,
      body: JSON.stringify({ p_packet_id: packetId, p_packet: packet }),
      signal: AbortSignal.timeout(10000), cache: 'no-store',
    })
    if (response.status === 409) throw new PacketConflict()
    if (!response.ok) throw new Error('Database request failed')
    const duplicate: unknown = await response.json()
    if (typeof duplicate !== 'boolean') throw new Error('Unexpected database response')
    return duplicate
  }
}
