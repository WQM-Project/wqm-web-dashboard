# Edge-to-gateway requirements

## Data expected by the backend

Send one complete JSON object per reading containing all required active fields:
`id`, `ts`, `pH`, `tds_ppm`, `do_mgl`, `orp_mv`, `temp_w1`, `temp_air`, `pressure_hpa`.

Optional/reserved sensor fields (`turb_ntu`, `ec_uscm`, `temp_w2`, `depth_cm`, `humidity`) and STM32 GNSS/IMU fields (`lat`, `lon`, `alt_m`, `sog_knots`, `cog_deg`, `gps_fix`, `sats`, `heading`, `pitch`, `roll`) are accepted when finite and valid. Note that the current STM32 build uses BMP280 (no `humidity` sensor) and omits unfitted `turb_ntu`, `ec_uscm`, `temp_w2`, and `depth_cm`.

`id` must match the backend's configured node allowlist. `ts` is milliseconds
since STM32 boot (uint32), not Unix time. Measurements must be JSON numbers,
not quoted strings, NaN or Infinity. Conductivity (`ec_uscm`), when sent, is in
microSiemens/cm. Maximum HTTP JSON body size is 4096 bytes.

## Onboard STM32 → ESP32 UART transport

The STM32 edge node communicates directly with the **onboard ESP32 + SIM7600
4G/GNSS gateway** over 3.3 V UART RX–TX (`115200 8N1`: STM32 TX → ESP32
`GPIO25` RX, STM32 RX → ESP32 `GPIO26` TX, shared `GND`; no LoRa radio or
separate shore gateway is used).

- Keep USB debug printing separate from the UART link connected to the ESP32.
- End each JSON line with `\n` (at most 768 bytes) and wait for `ACK` or `NAK <reason>` from the ESP32 before advancing.
- Onboard GPS coordinates (`lat`, `lon`, `gps_fix`, `gps_age_s`) and `utc_s` are supplied by the ESP32's SIM7600G-H GNSS module when fixed; unfixed STM32 `(0, 0)` placeholder coordinates are stripped by `stm_link.h`.

## Gateway responsibility

For each valid packet acknowledged with `ACK`, the ESP32 creates a UUID, queues
it in flash with the enriched JSON, and POSTs it over 4G LTE with `X-Packet-Id`
and the gateway Bearer key. Retain that UUID for every HTTP retry. Never give
the edge or gateway the Supabase secret key. See `GATEWAY_BACKEND_SETUP.md` for
responses, example packet and backend tests.

## Bench verification

Test the STM32 serial line independently or with `gateway/scripts/fake_stm.py`
and confirm `[STM] Queued` + `ACK` on the ESP32 UART link before boat trials.
