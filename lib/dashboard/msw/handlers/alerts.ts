import { delay, http, HttpResponse } from "msw";

import type { AlertDto } from "@/types/dashboard/alerts";
import { ALERTS_ENDPOINT_PATH } from "@/lib/dashboard/alerts/api";
import {
  alertsEmptyFixture,
  alertsNormalFixture,
} from "@/lib/dashboard/msw/fixtures/alerts";

/** success: 3 DANGER + 2 CAUTION alerts (AC1). */
export const alertsNormalHandler = http.get(ALERTS_ENDPOINT_PATH, () =>
  HttpResponse.json<AlertDto[]>(alertsNormalFixture),
);

/** success: 0 alerts (AC3). */
export const alertsEmptyHandler = http.get(ALERTS_ENDPOINT_PATH, () =>
  HttpResponse.json<AlertDto[]>(alertsEmptyFixture),
);

/** server error: 500 (AC4 — error message + retry). */
export const alertsErrorHandler = http.get(ALERTS_ENDPOINT_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

/**
 * Optional slow scenario. Loading is expressed via `delay()` rather than a
 * distinct handler "state" so tests can assert on the skeleton (AC2) before
 * the response resolves.
 */
export const alertsSlowHandler = http.get(ALERTS_ENDPOINT_PATH, async () => {
  await delay(2000);
  return HttpResponse.json<AlertDto[]>(alertsNormalFixture);
});
