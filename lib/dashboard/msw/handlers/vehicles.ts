import { delay, http, HttpResponse } from "msw";

import type {
  TireStatus,
  VehicleManagementListResponse,
  VehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import {
  isTireStatus,
  isVehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import { VEHICLES_ENDPOINT_PATH } from "@/lib/dashboard/vehicles/api";
import {
  filterVehicleFixture,
  toVehicleManagementListResponse,
  vehiclesEmptyFixture,
  vehiclesNormalFixture,
} from "@/lib/dashboard/msw/fixtures/vehicles";

function readFiltersFromUrl(url: string): {
  status?: VehicleManagementStatus;
  tireStatus?: TireStatus;
} {
  const { searchParams } = new URL(url);
  const status = searchParams.get("status");
  const tireStatus = searchParams.get("tireStatus");
  return {
    status: status && isVehicleManagementStatus(status) ? status : undefined,
    tireStatus:
      tireStatus && isTireStatus(tireStatus) ? tireStatus : undefined,
  };
}

/**
 * success: 12 vehicles, `status`/`tireStatus` query params actually applied
 * (AND) against the fixture (AC1, AC6). A `?status=REPAIR&tireStatus=NORMAL`
 * request also comes through this handler and naturally returns 0 results
 * (no `REPAIR`+`NORMAL` entry in the fixture, see
 * `.claude/handoffs/14-api-specs.md`) — a separate "filtered empty" handler
 * would be identical code, so AC4's filtered-empty scenario is exercised via
 * this handler with that specific query instead of a redundant duplicate.
 */
export const vehiclesNormalHandler = http.get(
  VEHICLES_ENDPOINT_PATH,
  ({ request }) => {
    const filters = readFiltersFromUrl(request.url);
    const filtered = filterVehicleFixture(vehiclesNormalFixture, filters);
    return HttpResponse.json<VehicleManagementListResponse>(
      toVehicleManagementListResponse(filtered),
    );
  },
);

/** success: 0 registered vehicles, regardless of query (AC3). */
export const vehiclesEmptyHandler = http.get(VEHICLES_ENDPOINT_PATH, () =>
  HttpResponse.json<VehicleManagementListResponse>(
    toVehicleManagementListResponse(vehiclesEmptyFixture),
  ),
);

/** server error: 500 (AC5 — error message + retry). */
export const vehiclesErrorHandler = http.get(VEHICLES_ENDPOINT_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

/**
 * Optional slow scenario. Loading is expressed via `delay()` rather than a
 * distinct handler "state" so tests can assert on the skeleton (AC2) before
 * the response resolves.
 */
export const vehiclesSlowHandler = http.get(VEHICLES_ENDPOINT_PATH, async () => {
  await delay(2000);
  return HttpResponse.json<VehicleManagementListResponse>(
    toVehicleManagementListResponse(vehiclesNormalFixture),
  );
});
