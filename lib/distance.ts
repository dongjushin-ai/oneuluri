import type { TransportationMode } from "../types/course";

const EARTH_RADIUS_KM = 6371;

function degreesToRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

export function calculateDistanceKm(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number,
): number {
  const latitudeDifference = degreesToRadians(toLat - fromLat);
  const longitudeDifference = degreesToRadians(toLng - fromLng);

  const fromLatitude = degreesToRadians(fromLat);
  const toLatitude = degreesToRadians(toLat);

  const haversineValue =
    Math.sin(latitudeDifference / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDifference / 2) ** 2;

  const centralAngle =
    2 * Math.atan2(Math.sqrt(haversineValue), Math.sqrt(1 - haversineValue));

  return roundToOneDecimal(EARTH_RADIUS_KM * centralAngle);
}

export function estimateTravelMinutes(
  startLat: number,
  startLng: number,
  endLat: number,
  endLng: number,
  transportationMode: TransportationMode,
): number {
  const distanceKm = calculateDistanceKm(startLat, startLng, endLat, endLng);

  // Deterministic MVP assumptions for route estimation.
  // Walking uses a conservative urban pace, transit adds a fixed overhead,
  // and driving uses a simplified average speed.
  switch (transportationMode) {
    case "WALK":
      return Math.max(8, Math.round((distanceKm / 4.5) * 60));
    case "PUBLIC":
      return Math.max(12, Math.round((distanceKm / 14) * 60 + 8));
    case "CAR":
      return Math.max(6, Math.round((distanceKm / 24) * 60));
    case "BICYCLE":
      return Math.max(6, Math.round((distanceKm / 12) * 60));
    default:
      return Math.max(6, Math.round((distanceKm / 24) * 60));
  }
}
