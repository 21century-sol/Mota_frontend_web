import { delay, http, HttpResponse } from "msw";

import type { VehicleStatusCountDto } from "@/types/dashboard/summary";
import { SUMMARY_ENDPOINT_PATH } from "@/lib/dashboard/summary/api";
import {
  summaryEmptyFixture,
  summaryNormalFixture,
} from "@/lib/dashboard/msw/fixtures/summary";

/** success: all 4 statuses non-zero (AC1). */
export const summaryNormalHandler = http.get(SUMMARY_ENDPOINT_PATH, () =>
  HttpResponse.json<VehicleStatusCountDto[]>(summaryNormalFixture),
);

/** success: all 4 statuses are 0 (AC3). */
export const summaryEmptyHandler = http.get(SUMMARY_ENDPOINT_PATH, () =>
  HttpResponse.json<VehicleStatusCountDto[]>(summaryEmptyFixture),
);

/** server error: 500 (AC4 — error card + retry). */
export const summaryErrorHandler = http.get(SUMMARY_ENDPOINT_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

/**
 * Optional slow scenario. Loading is expressed via `delay()` rather than a
 * distinct handler "state" so tests can assert on the skeleton (AC2) before
 * the response resolves.
 */
export const summarySlowHandler = http.get(SUMMARY_ENDPOINT_PATH, async () => {
  await delay(2000);
  return HttpResponse.json<VehicleStatusCountDto[]>(summaryNormalFixture);
});
