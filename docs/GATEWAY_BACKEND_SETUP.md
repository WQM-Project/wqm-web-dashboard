# Gateway ingestion backend

The implemented routes are `GET /api/health` and `POST /api/ingest`.
Health proves the web service responds; it does not prove database readiness.
The backend uses Supabase Postgres. Firmware and physical 4G/LoRa tests are separate work.

## Setup

### WQM connection verified on 9 October 2026

Project `scvcufiagvbeixhnwjze` now contains `public.telemetry_packets` and
`public.ingest_telemetry(uuid, jsonb)`. The migration was applied through a
certificate-verified PostgreSQL session-pooler connection after confirming
the public schema was empty. No Gurukul project was queried or changed.

Live checks passed through the local Next.js routes:

- Health route returned 200.
- Incorrect gateway credentials returned 401; invalid telemetry returned 422.
- A complete packet returned 201 and its exact payload, uptime and server
  timestamp were independently verified in the database.
- An identical retry returned 200 without adding another row.
- Reusing the ID with changed data returned 409 and preserved the original.
- The single generated verification row was removed after the test.
- RLS is enabled; ordinary public/user table access and public RPC execution
  are denied. The valid publishable key was also tested over HTTP and could
  neither read the table nor call ingestion (permission denied).
- All five automated backend test groups passed.

The server key and new publishable key are saved only in ignored `.env.local`.
The rejected legacy anon key was cleared. Browser clients should use
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Dashboard read APIs and login are not
yet implemented. This verification is local; the backend has not been deployed.

### Local database tooling

`scripts/wqm-database.mjs` provides `inspect`, `migrate` and `verify` modes.
It explicitly checks the WQM project and session-pooler target before connecting.
`migrate` refuses to overwrite existing ingestion objects; do not rerun it on
the already-migrated project. PostgreSQL certificate verification stays enabled.

These scripts use an isolated, ignored `.wqm-tools` folder containing `pg` and
the public Supabase database CA certificate. They do not alter the dashboard
dependency tree. To prepare another workstation, create `.wqm-tools` with a
private package.json, install `pg` there, and download the database root CA
from Supabase's Database Settings into `.wqm-tools/supabase-ca.crt`.

```text
npm install --prefix .wqm-tools pg --ignore-scripts --no-audit --no-fund
node --env-file=.env.local scripts/wqm-database.mjs inspect
node --env-file=.env.local scripts/wqm-database.mjs verify
```

For a repeatable end-to-end check, start `npm run dev` in one terminal, then:

```text
node --env-file=.env.local scripts/verify-live-backend.mjs
```

The live verifier generates one UUID, checks rejected requests, inserts and
reads one known sample, exercises duplicate/conflict handling, and deletes only
that UUID's row in a finally block. It uses the configured `WQM_BACKEND_URL`
(default port 3000). Both scripts read secrets from the environment without
printing them. Keep the pooler password and API keys current after rotation.

### Initial setup for a fresh development project

1. Use a development Supabase project. Review and run
   `supabase/migrations/202610090001_gateway_ingestion.sql` in its SQL editor.
2. Copy `.env.example` to `.env.local`. Set `SUPABASE_URL`,
   `SUPABASE_SECRET_KEY` (server only), `GATEWAY_ALLOWED_NODE_IDS`, and
   `GATEWAY_INGEST_KEY`. Generate a random gateway key with
   `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
   Never send the Supabase secret to a gateway or commit `.env.local`.
   Existing legacy `SUPABASE_SERVICE_ROLE_KEY` is supported as a fallback.
3. Run `npm run dev`. In another terminal run `npm run test:upload`.
4. Expect 201 with `saved: true, duplicate: false`, then 200 with
   `saved: true, duplicate: true`. The sender uses one UUID for both requests.
5. Verify exactly one matching row in `public.telemetry_packets` using
   the returned packet ID. `recorded_at` is database arrival time, not sampling time.
6. Configure the same server variables on the deployment when ready.
   Set `WQM_BACKEND_URL` to its HTTPS address to repeat the upload test.

## Gateway request contract / edge requirements

- HTTPS `POST /api/ingest`, `Content-Type: application/json`.
- `Authorization: Bearer <GATEWAY_INGEST_KEY>`.
- `X-Packet-Id: <UUID>`: generate once when accepting a NEW edge packet;
  retain the UUID and unchanged payload through all upload retries.
  Do not use node uptime alone as a unique ID: it resets on reboot.
- Body: STM32/gateway JSON containing the required active fields (`id`, `ts`, `pH`, `tds_ppm`, `do_mgl`, `orp_mv`, `temp_w1`, `temp_air`, `pressure_hpa`), plus optional reserved sensors (`turb_ntu`, `ec_uscm`, `temp_w2`, `depth_cm`, `humidity`) and optional GNSS/IMU telemetry (`lat`, `lon`, `alt_m`, `sog_knots`, `cog_deg`, `gps_fix`, `sats`, `gps_age_s`, `heading`, `pitch`, `roll`, `utc_s`). All numbers must be finite JSON numbers.
- Preserve conductivity in microSiemens/cm (`ec_uscm`), not milliSiemens/cm.
- Radio framing, frequency, maximum payload/fragmentation, wiring and sender
  retries must be agreed with the edge team after identifying the actual radios.
  This backend contract does not establish a working LoRa connection.

```json
{"id":"WQM-001","ts":166519,"pH":7.12,"tds_ppm":310,"do_mgl":8.84,"orp_mv":91.6,"temp_w1":23.62,"temp_air":28.6,"pressure_hpa":1013.25,"lat":0.0,"lon":0.0,"alt_m":0.0,"sog_knots":0.0,"cog_deg":0.0,"gps_fix":0,"sats":0,"heading":0.0,"pitch":0.0,"roll":0.0}
```

## Response handling

| Status | Meaning | Gateway action |
| --- | --- | --- |
| 201 | Saved new packet | Remove from pending queue |
| 200 | Identical packet already saved | Remove from pending queue |
| 400 / 415 / 422 | Invalid request/format/data | Keep diagnostic; fix sender |
| 401 / 403 | Wrong key or unauthorised node | Fix configuration |
| 409 | Same node and packet ID, different data | Fix ID reuse; do not overwrite |
| 413 | More than 4096 bytes | Fix packet size |
| 503 or network timeout | Storage/configuration unavailable or uncertain delivery | Retry unchanged packet and ID with backoff |

The database operation inserts atomically and compares duplicates without
overwriting the original. Unauthenticated database access is denied; dashboard
read access requires a later authorised policy/API. Do not disable RLS to show data.

`npm test` tests authentication, validation, acknowledgement, retry/conflict
semantics and the database HTTP adapter using mocks. It does not prove a live
database connection or SQL execution. The upload sender plus database inspection
is the live integration check. Laptop requests do not verify SIM7600 connectivity.

Before public production use, configure deployment-level request rate limiting
and decide whether each gateway needs its own key. This initial implementation
uses one shared key and an explicit node allowlist.
