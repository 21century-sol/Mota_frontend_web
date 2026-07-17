import { delay, http, HttpResponse } from "msw";

import type { DashboardSummaryContentDto } from "@/types/dashboard/summary";
import { SUMMARY_ENDPOINT_PATH } from "@/lib/dashboard/summary/api";
import {
  summaryEmptyFixture,
  summaryNormalFixture,
} from "@/lib/dashboard/msw/fixtures/summary";

/** Confirmed backend envelope shape (issue #31). Test-only — MSW never runs in browser dev. */
interface DashboardSummaryEnvelope {
  content: DashboardSummaryContentDto;
  error: string | null;
  statusCode: number;
}

/** success: all 4 fields non-zero (AC1). */
export const summaryNormalHandler = http.get(SUMMARY_ENDPOINT_PATH, () =>
  HttpResponse.json<DashboardSummaryEnvelope>({
    content: summaryNormalFixture,
    error: null,
    statusCode: 200,
  }),
);

/** success: all 4 fields are 0 (AC3). */
export const summaryEmptyHandler = http.get(SUMMARY_ENDPOINT_PATH, () =>
  HttpResponse.json<DashboardSummaryEnvelope>({
    content: summaryEmptyFixture,
    error: null,
    statusCode: 200,
  }),
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
  return HttpResponse.json<DashboardSummaryEnvelope>({
    content: summaryNormalFixture,
    error: null,
    statusCode: 200,
  });
});
