import { createIngestHandler } from '@/lib/server/ingest'
import { supabaseStorage } from '@/lib/server/storage'

export const runtime = 'nodejs'
export async function POST(request: Request) {
  return createIngestHandler({
    key: process.env.GATEWAY_INGEST_KEY,
    allowedNodes: (process.env.GATEWAY_ALLOWED_NODE_IDS ?? '').split(',').map(id => id.trim()).filter(Boolean),
    save: supabaseStorage(process.env),
  })(request)
}
