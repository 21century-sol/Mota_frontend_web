import { delay, http, HttpResponse } from "msw";

import { RESERVATION_STATUS_ENDPOINT_PATH, RESERVATION_STATUS_PAGE_SIZE } from "@/lib/dashboard/reservations/api";
import {
  filterReservationApiFixture,
  reservationsEmptyFixture,
  reservationsNormalFixture,
  toReservationStatusPageResponse,
} from "@/lib/dashboard/msw/fixtures/reservations";

function readFiltersFromUrl(url: string) {
  const { searchParams } = new URL(url);
  return {
    status: searchParams.get("status") ?? undefined,
    rentedFrom: searchParams.get("rentedFrom") ?? undefined,
    rentedTo: searchParams.get("rentedTo") ?? undefined,
    returnedFrom: searchParams.get("returnedFrom") ?? undefined,
    returnedTo: searchParams.get("returnedTo") ?? undefined,
  };
}

function readPagingFromUrl(url: string): { page: number; size: number } {
  const { searchParams } = new URL(url);
  const page = Number.parseInt(searchParams.get("page") ?? "0", 10);
  const size = Number.parseInt(searchParams.get("size") ?? "", 10);
  return {
    page: Number.isInteger(page) && page >= 0 ? page : 0,
    size: Number.isInteger(size) && size > 0 ? size : RESERVATION_STATUS_PAGE_SIZE,
  };
}

/**
 * success: 14 reservations, `status`/`rentedFrom`~`returnedTo` query params
 * actually applied against the fixture and genuinely paginated (issue #51,
 * `.claude/handoffs/51-api-specs.md` MSW Scenarios — no fixed/canned
 * response).
 */
export const reservationsNormalHandler = http.get(
  RESERVATION_STATUS_ENDPOINT_PATH,
  ({ request }) => {
    const filters = readFiltersFromUrl(request.url);
    const { page, size } = readPagingFromUrl(request.url);
    const filtered = filterReservationApiFixture(reservationsNormalFixture, filters);
    return HttpResponse.json(toReservationStatusPageResponse(filtered, page, size));
  },
);

/** success: 0 reservations, regardless of query. */
export const reservationsEmptyHandler = http.get(RESERVATION_STATUS_ENDPOINT_PATH, () =>
  HttpResponse.json(toReservationStatusPageResponse(reservationsEmptyFixture, 0, RESERVATION_STATUS_PAGE_SIZE)),
);

/** server error: 500 (error message + retry). */
export const reservationsErrorHandler = http.get(RESERVATION_STATUS_ENDPOINT_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

/** Optional slow scenario, same `delay()` pattern as `vehiclesSlowHandler`. */
export const reservationsSlowHandler = http.get(
  RESERVATION_STATUS_ENDPOINT_PATH,
  async ({ request }) => {
    await delay(2000);
    const filters = readFiltersFromUrl(request.url);
    const { page, size } = readPagingFromUrl(request.url);
    const filtered = filterReservationApiFixture(reservationsNormalFixture, filters);
    return HttpResponse.json(toReservationStatusPageResponse(filtered, page, size));
  },
);
