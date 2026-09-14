/**
 * Telemetry contract.
 *
 * This mirrors, field for field, the JSON packet emitted by the STM32 edge
 * sensing node and relayed to the cloud by the LoRa gateway. It is the single
 * source of truth for the landing page and, later, for the Supabase schema and
 * the generated database types.
 *
 * See: https://github.com/WQM-Project/edge-sensing-node
 */

export interface Parameter {
  /** Key exactly as it appears in the on-the-wire JSON packet. */
  key: string
  /** Human-readable name. */
  label: string
  /** Unit of measurement. */
  unit: string
  /** Physical sensor that produces the reading. */
  sensor: string
  /** Operating range as specified by the sensor datasheet. */
  range: string
  /** Representative value, used for the sample packet on the landing page. */
  sample: number
  /** Decimal places the node reports this field to. */
  decimals: number
  /** Postgres column this maps to in the `readings` table. */
  column: string
}

/** Envelope fields — identity and timing, not measurements. */
export const PACKET_META = {
  /** Device identifier. Supports multi-node deployment. */
  id: "WQM-001",
  /** `HAL_GetTick()` — milliseconds since node boot, not epoch. */
  ts: 123456789,
}

/** The twelve measured parameters carried in every packet. */
export const PARAMETERS: Parameter[] = [
  {
    key: "pH",
    label: "pH",
    unit: "",
    sensor: "DFRobot SEN0161",
    range: "0 – 14",
    sample: 7.12,
    decimals: 2,
    column: "ph",
  },
  {
    key: "turb_ntu",
    label: "Turbidity",
    unit: "NTU",
    sensor: "DFRobot SEN0189",
    range: "0 – 3000 NTU",
    sample: 42.5,
    decimals: 1,
    column: "turbidity_ntu",
  },
  {
    key: "tds_ppm",
    label: "Total Dissolved Solids",
    unit: "ppm",
    sensor: "Gravity SEN0244",
    range: "0 – 1000 ppm",
    sample: 310.0,
    decimals: 1,
    column: "tds_ppm",
  },
  {
    key: "do_mgl",
    label: "Dissolved Oxygen",
    unit: "mg/L",
    sensor: "DFRobot SEN0237-A",
    range: "0 – 20 mg/L",
    sample: 6.85,
    decimals: 2,
    column: "do_mgl",
  },
  {
    key: "ec_uscm",
    label: "Conductivity",
    unit: "µS/cm",
    sensor: "DFRobot DFR0300",
    range: "0 – 20 mS/cm",
    sample: 680.2,
    decimals: 1,
    column: "ec_uscm",
  },
  {
    key: "orp_mv",
    label: "Redox Potential",
    unit: "mV",
    sensor: "DFRobot SEN0165",
    range: "−2000 – 2000 mV",
    sample: 215.0,
    decimals: 1,
    column: "orp_mv",
  },
  {
    key: "temp_w1",
    label: "Water Temperature",
    unit: "°C",
    sensor: "DS18B20",
    range: "−55 – 125 °C",
    sample: 23.5,
    decimals: 2,
    column: "temp_water_c",
  },
  {
    key: "temp_w2",
    label: "Water Temp (backup)",
    unit: "°C",
    sensor: "DS18B20",
    range: "−55 – 125 °C",
    sample: 23.48,
    decimals: 2,
    column: "temp_water_backup_c",
  },
  {
    key: "depth_cm",
    label: "Water Depth",
    unit: "cm",
    sensor: "JSN-SR04T",
    range: "20 – 600 cm",
    sample: 35.2,
    decimals: 1,
    column: "depth_cm",
  },
  {
    key: "temp_air",
    label: "Air Temperature",
    unit: "°C",
    sensor: "BME280",
    range: "−40 – 85 °C",
    sample: 28.6,
    decimals: 2,
    column: "temp_air_c",
  },
  {
    key: "humidity",
    label: "Relative Humidity",
    unit: "%",
    sensor: "BME280",
    range: "0 – 100 %",
    sample: 65.3,
    decimals: 1,
    column: "humidity_pct",
  },
  {
    key: "pressure_hpa",
    label: "Barometric Pressure",
    unit: "hPa",
    sensor: "BME280",
    range: "300 – 1100 hPa",
    sample: 1013.25,
    decimals: 2,
    column: "pressure_hpa",
  },
]

/** Number of measured parameters per packet. */
export const PARAMETER_COUNT = PARAMETERS.length

/** Total keys on the wire: the two envelope fields plus every parameter. */
export const PACKET_FIELD_COUNT = PARAMETER_COUNT + Object.keys(PACKET_META).length

/**
 * Runtime shape of a decoded packet: the envelope plus one entry per parameter.
 * Kept loose deliberately — authoritative typing lands with the generated
 * Supabase types once the schema is migrated.
 */
export type TelemetryPacket = Record<string, number | string>

/** The reference packet rendered on the landing page. */
export const SAMPLE_PACKET: TelemetryPacket = PARAMETERS.reduce<TelemetryPacket>(
  (packet, p) => ({ ...packet, [p.key]: p.sample }),
  { ...PACKET_META },
)

/**
 * Monitoring sites. Stage 1 deploys an RC boat; Stage 2 adds waypoint
 * autonomy. Coordinates are approximate reach centroids, not fixed moorings.
 */
export const SITES = [
  { river: "Beas", reach: "Kullu – Bhuntar", district: "Kullu", lat: 31.88, lng: 77.11 },
  { river: "Uhl", reach: "Barot – Jogindernagar", district: "Mandi", lat: 32.03, lng: 76.79 },
  { river: "Suketi", reach: "Sundernagar", district: "Mandi", lat: 31.53, lng: 76.88 },
]
