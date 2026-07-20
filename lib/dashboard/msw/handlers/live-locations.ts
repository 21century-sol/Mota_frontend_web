import { http, HttpResponse } from "msw";

import { LIVE_LOCATIONS_PATH } from "@/lib/dashboard/live-locations/api";
import { liveLocationsFixtureRows } from "@/lib/dashboard/msw/fixtures/live-locations";

function envelope(content: unknown) {
  return { statusCode: 200, error: null, content };
}

/** success: 대여 중 차량 GPS (알림 vehicleId와 교집합 + 알림 외 1건). */
export const liveLocationsNormalHandler = http.get(LIVE_LOCATIONS_PATH, () =>
  HttpResponse.json(envelope(liveLocationsFixtureRows)),
);

/** success: 빈 목록. */
export const liveLocationsEmptyHandler = http.get(LIVE_LOCATIONS_PATH, () =>
  HttpResponse.json(envelope([])),
);

/** server error. */
export const liveLocationsErrorHandler = http.get(LIVE_LOCATIONS_PATH, () =>
  HttpResponse.json(
    { statusCode: 500, error: "Internal Server Error", content: null },
    { status: 500 },
  ),
);
