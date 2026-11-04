// Approximate campus reference from OpenStreetMap way 761379545 via Mapcarta:
// https://mapcarta.com/W761379545 — not a GPS fix or surveyed boat location.
export const CAMPUS_REFERENCE = { latitude: 31.78129, longitude: 76.9975 };
export const DEMO_BOAT_LOCATION = { latitude: 31.78102, longitude: 76.99731 };
export type BoatPosition = {
  latitude: number;
  longitude: number;
  recordedAt: string;
  // Seconds since the gateway last had this fix when the packet was stamped.
  fixAgeSeconds?: number;
};
// Positions older than this when sent are labelled as possibly outdated.
export const STALE_FIX_SECONDS = 120;

// Newest packet carrying a GNSS position; packets without a fix are skipped.
export function latestBoatPosition(
  readings: { recorded_at: string; payload: { lat?: number; lon?: number; gps_age_s?: number } }[],
): BoatPosition | undefined {
  for (let i = readings.length - 1; i >= 0; i--) {
    const { recorded_at, payload } = readings[i];
    if (payload.lat !== undefined && payload.lon !== undefined)
      return {
        latitude: payload.lat,
        longitude: payload.lon,
        recordedAt: recorded_at,
        fixAgeSeconds: payload.gps_age_s,
      };
  }
  return undefined;
}

export function fixAgeNote(position: BoatPosition): string {
  const age = position.fixAgeSeconds;
  if (age === undefined || age < STALE_FIX_SECONDS) return "";
  return ` Position was ${Math.round(age / 60)} min old when sent; the boat may have moved.`;
}
export function validPosition(
  position?: BoatPosition,
): position is BoatPosition {
  return (
    !!position &&
    Number.isFinite(position.latitude) &&
    Number.isFinite(position.longitude) &&
    Math.abs(position.latitude) <= 90 &&
    Math.abs(position.longitude) <= 180 &&
    Number.isFinite(Date.parse(position.recordedAt))
  );
}
