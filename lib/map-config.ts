// Approximate campus reference from OpenStreetMap way 761379545 via Mapcarta:
// https://mapcarta.com/W761379545 — not a GPS fix or surveyed boat location.
export const CAMPUS_REFERENCE = { latitude: 31.78129, longitude: 76.9975 };
export const DEMO_BOAT_LOCATION = { latitude: 31.78102, longitude: 76.99731 };
export type BoatPosition = {
  latitude: number;
  longitude: number;
  recordedAt: string;
};
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
