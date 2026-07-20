/**
 * `GET /api/dashboard/live-locations` (`getLiveLocations`) DTO / UI models.
 * OpenAPI: `LiveLocationResponse` — 대여 중 차량 최신 GPS (지도 핀용).
 */

/** Wire shape from `ApiResponse.content[]`. */
export interface LiveLocationDto {
  vehicleId: string;
  plateNumber: string;
  model: string;
  latitude: number;
  longitude: number;
  /** ISO-8601 date-time from the server. */
  measuredAt: string;
}

/** Map marker model after client validation. */
export interface LiveLocation {
  vehicleId: string;
  plateNumber: string;
  model: string;
  lat: number;
  lng: number;
  measuredAt: string;
}
