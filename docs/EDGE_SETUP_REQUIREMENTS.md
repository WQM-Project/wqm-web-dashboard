# Edge-to-gateway requirements

## Data expected by the backend

Send one complete JSON object per reading with these exact fields:
`id`, `ts`, `pH`, `turb_ntu`, `tds_ppm`, `do_mgl`, `ec_uscm`, `orp_mv`,
`temp_w1`, `temp_w2`, `depth_cm`, `temp_air`, `humidity`, `pressure_hpa`.

`id` must match the backend's configured node allowlist. `ts` is milliseconds
since STM32 boot (uint32), not Unix time. Measurements must be JSON numbers,
not quoted strings, NaN or Infinity. Conductivity is in microSiemens/cm.
The current backend accepts no GPS/battery/extra fields; coordinate schema
changes before adding them. Maximum HTTP JSON body size is 4096 bytes.

## Transport to agree before radio integration

The current edge source emits JSON on USART3 at 115200 baud. Agree on explicit
message framing, keeping debug logs separate from telemetry. A newline after
each complete object is a proposed UART test framing, not an implemented radio
protocol. Confirm exact transmitter and receiver models, their interface
(SPI/UART), radio frequency and matching settings, pins, logic levels and power.
Confirm radio packet-size limits: fragment/reassemble if needed rather than
assuming a full JSON reading fits a single radio packet.

Agree on edge sequence/boot identity and radio acknowledgement behaviour if
radio retransmissions are used. The gateway must recognise repeated edge
messages if radio-level deduplication is required. Backend deduplication only
covers HTTP retries using the same gateway-created UUID and unchanged payload.

## Gateway responsibility

For each new complete reading, create a UUID, queue it with the unchanged JSON,
and POST it with `X-Packet-Id` and the gateway Bearer key. Retain that UUID for
every HTTP retry. Never give the edge or gateway the Supabase secret key.
See `GATEWAY_BACKEND_SETUP.md` for responses, example packet and backend tests.

## Edge test required

Provide a mode that repeatedly transmits the documented known example packet
without live sensors. Verify complete packet reception before connecting the
radio receiver to the upload path. Record actual interval, packet size and
radio settings. Hardware and radio behaviour have not yet been validated here.
