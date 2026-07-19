import { delay, http, HttpResponse } from "msw";

import type {
  TireStatus,
  TireTrendMetric,
  VehicleManagementListResponse,
  VehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import {
  isTireStatus,
  isTireTrendMetric,
  isVehicleManagementStatus,
} from "@/types/dashboard/vehicle";
import { VEHICLES_ENDPOINT_PATH } from "@/lib/dashboard/vehicles/api";
import { VEHICLE_DETAIL_ENDPOINT_PATH } from "@/lib/dashboard/vehicles/detail-api";
import { VEHICLE_USAGE_HISTORY_PAGE_SIZE } from "@/lib/dashboard/vehicles/usage-history-api";
import { VEHICLE_CURRENT_RENTAL_ENDPOINT_PATH_SUFFIX } from "@/lib/dashboard/vehicles/current-rental-api";
import {
  filterVehicleFixture,
  toCurrentRentalResponse,
  toVehicleAlertHistoryResponse,
  toVehicleDetailResponse,
  toVehicleManagementListResponse,
  toVehicleTireDetailResponse,
  toVehicleTireTrendResponse,
  toVehicleUsageHistoryResponse,
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

// ---------------------------------------------------------------------------
// Issue #15 — `/dashboard/vehicles/[vehicleId]` handlers.
// ---------------------------------------------------------------------------

const VEHICLE_DETAIL_PATH = `${VEHICLE_DETAIL_ENDPOINT_PATH}/:vehicleId`;
const VEHICLE_CURRENT_RENTAL_PATH = `${VEHICLE_DETAIL_ENDPOINT_PATH}/:vehicleId${VEHICLE_CURRENT_RENTAL_ENDPOINT_PATH_SUFFIX}`;
const VEHICLE_ALERT_HISTORY_PATH = `${VEHICLE_DETAIL_ENDPOINT_PATH}/:vehicleId/alerts`;
const VEHICLE_USAGE_HISTORY_PATH = `${VEHICLE_DETAIL_ENDPOINT_PATH}/:vehicleId/usage-history`;
const VEHICLE_TIRE_DETAIL_PATH = `${VEHICLE_DETAIL_ENDPOINT_PATH}/:vehicleId/tires`;
const VEHICLE_TIRE_TREND_PATH = `${VEHICLE_DETAIL_ENDPOINT_PATH}/:vehicleId/tires/trend`;

/**
 * success: looks up `params.vehicleId` in the fixture map (`vehicle-mgmt-001`/
 * `-003`/`-004`/`-007`, `.claude/handoffs/15-api-specs.md` fixture table).
 * Any other id — including `VEHICLE_DETAIL_NOT_FOUND_ID` — naturally falls
 * through to a 404, exercising AC6 without a separate dedicated handler.
 */
export const vehicleDetailNormalHandler = http.get(VEHICLE_DETAIL_PATH, ({ params }) => {
  const vehicleId = params.vehicleId as string;
  const response = toVehicleDetailResponse(vehicleId);
  if (!response) {
    return HttpResponse.json({ message: "Not Found" }, { status: 404 });
  }
  return HttpResponse.json(response);
});

/** server error: 500 (AC7 — error message + retry). */
export const vehicleDetailErrorHandler = http.get(VEHICLE_DETAIL_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

/** AC5 loading-state coverage, same `delay()` pattern as `vehiclesSlowHandler`. */
export const vehicleDetailSlowHandler = http.get(VEHICLE_DETAIL_PATH, async ({ params }) => {
  await delay(2000);
  const vehicleId = params.vehicleId as string;
  const response = toVehicleDetailResponse(vehicleId);
  if (!response) {
    return HttpResponse.json({ message: "Not Found" }, { status: 404 });
  }
  return HttpResponse.json(response);
});

/**
 * success: looks up `params.vehicleId` in `currentRentalFixturesById` (issue
 * #42/#43). An unrecognized id falls back to `{ rented: false }` via
 * `toCurrentRentalResponse`, not a 404 (this endpoint's confirmed contract has
 * no dedicated not-found case).
 */
export const vehicleCurrentRentalNormalHandler = http.get(
  VEHICLE_CURRENT_RENTAL_PATH,
  ({ params }) => HttpResponse.json(toCurrentRentalResponse(params.vehicleId as string)),
);

/** server error: 500 (error+retry copy for the "예약 내역" panel). */
export const vehicleCurrentRentalErrorHandler = http.get(VEHICLE_CURRENT_RENTAL_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

/** Loading-state coverage, same `delay()` pattern as `vehicleDetailSlowHandler`. */
export const vehicleCurrentRentalSlowHandler = http.get(
  VEHICLE_CURRENT_RENTAL_PATH,
  async ({ params }) => {
    await delay(2000);
    return HttpResponse.json(toCurrentRentalResponse(params.vehicleId as string));
  },
);

export const vehicleAlertHistoryNormalHandler = http.get(
  VEHICLE_ALERT_HISTORY_PATH,
  ({ params }) => HttpResponse.json(toVehicleAlertHistoryResponse(params.vehicleId as string)),
);

export const vehicleAlertHistoryErrorHandler = http.get(VEHICLE_ALERT_HISTORY_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

export const vehicleUsageHistoryNormalHandler = http.get(
  VEHICLE_USAGE_HISTORY_PATH,
  ({ request, params }) => {
    const { searchParams } = new URL(request.url);
    const page = Number.parseInt(searchParams.get("page") ?? "1", 10) || 1;
    return HttpResponse.json(
      toVehicleUsageHistoryResponse(
        params.vehicleId as string,
        page,
        VEHICLE_USAGE_HISTORY_PAGE_SIZE,
      ),
    );
  },
);

export const vehicleUsageHistoryErrorHandler = http.get(VEHICLE_USAGE_HISTORY_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

export const vehicleTireDetailNormalHandler = http.get(
  VEHICLE_TIRE_DETAIL_PATH,
  ({ params }) => HttpResponse.json(toVehicleTireDetailResponse(params.vehicleId as string)),
);

export const vehicleTireDetailErrorHandler = http.get(VEHICLE_TIRE_DETAIL_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);

export const vehicleTireTrendNormalHandler = http.get(
  VEHICLE_TIRE_TREND_PATH,
  ({ request, params }) => {
    const { searchParams } = new URL(request.url);
    const metricParam = searchParams.get("metric");
    const metric: TireTrendMetric = isTireTrendMetric(metricParam) ? metricParam : "PRESSURE";
    return HttpResponse.json(
      toVehicleTireTrendResponse(params.vehicleId as string, metric),
    );
  },
);

export const vehicleTireTrendErrorHandler = http.get(VEHICLE_TIRE_TREND_PATH, () =>
  HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
);
