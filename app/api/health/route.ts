export function GET() {
  return Response.json({ ok: true, service: 'wqm-ingestion' }, {
    headers: { 'Cache-Control': 'no-store' },
  })
}
