import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import {
  fetchVehicleRentalHistory,
  toVehicleRentalHistoryResult,
  VehicleRentalHistoryContractMismatchError,
  VehicleRentalHistoryFetchError,
} from "@/lib/dashboard/vehicles/usage-history-api";
import { VEHICLE_DETAIL_ENDPOINT_PATH } from "@/lib/dashboard/vehicles/detail-api";
import { server } from "@/lib/dashboard/msw/server";

const baseItem = {
  rentalId: "rental-hist-001-01",
  renterName: "윤지호",
  contact: "010-0000-0001",
  status: "RETURNED",
  startDate: "2026.06.01 09:00:00",
  endDate: "2026.06.03 11:00:00",
  rentalMinutes: 3000,
  distanceKm: 210.4,
  alertCount: 2,
  reportDownloadUrl: "https://mota-app.duckdns.org/reports/001-01.pdf",
};

const pageMeta = { page: 0, size: 8, totalPages: 1, totalElements: 1 };

function envelope(items: unknown[], meta: unknown = pageMeta) {
  const metaFields =
    typeof meta === "object" && meta !== null ? (meta as Record<string, unknown>) : {};
  return {
    statusCode: 200,
    error: null,
    content: { content: items, ...metaFields },
  };
}

describe("toVehicleRentalHistoryResult", () => {
  it("maps a normal nested envelope response, converting 0-based page to 1-based pageInfo.page (AC1/AC9)", () => {
    const result = toVehicleRentalHistoryResult(envelope([baseItem]));
    expect(result.items).toEqual([baseItem]);
    expect(result.pageInfo).toEqual({ page: 1, pageSize: 8, totalCount: 1, totalPages: 1 });
  });

  it("returns an empty list for 0 rental history entries, not an error", () => {
    const result = toVehicleRentalHistoryResult(
      envelope([], { page: 0, size: 8, totalPages: 1, totalElements: 0 }),
    );
    expect(result.items).toEqual([]);
  });

  it("allows a null alertCount and a null reportDownloadUrl", () => {
    const item = { ...baseItem, alertCount: null, reportDownloadUrl: null };
    expect(toVehicleRentalHistoryResult(envelope([item])).items).toEqual([item]);
  });

  it("allows an empty-string reportDownloadUrl (adapter is permissive; UI treats it as no report)", () => {
    const item = { ...baseItem, reportDownloadUrl: "" };
    expect(toVehicleRentalHistoryResult(envelope([item])).items).toEqual([item]);
  });

  it("treats a business-failure envelope (statusCode!==200) as a VehicleRentalHistoryFetchError, not a contract mismatch", () => {
    expect(() =>
      toVehicleRentalHistoryResult({
        statusCode: 400,
        error: "BAD_REQUEST",
        content: { content: [], page: 0, size: 8, totalPages: 1, totalElements: 0 },
      }),
    ).toThrow(VehicleRentalHistoryFetchError);
  });

  it("treats a duplicate rentalId as a contract mismatch", () => {
    expect(() => toVehicleRentalHistoryResult(envelope([baseItem, baseItem]))).toThrow(
      VehicleRentalHistoryContractMismatchError,
    );
  });

  it("treats an invalid status enum value as a contract mismatch", () => {
    const item = { ...baseItem, status: "CANCELED" };
    expect(() => toVehicleRentalHistoryResult(envelope([item]))).toThrow(
      VehicleRentalHistoryContractMismatchError,
    );
  });

  it("treats a non-KST-wire startDate as a contract mismatch", () => {
    const item = { ...baseItem, startDate: "2026-06-01T00:00:00.000Z" };
    expect(() => toVehicleRentalHistoryResult(envelope([item]))).toThrow(
      VehicleRentalHistoryContractMismatchError,
    );
  });

  it("treats a non-object content.content entry as a contract mismatch", () => {
    expect(() => toVehicleRentalHistoryResult(envelope(["not-an-item"]))).toThrow(
      VehicleRentalHistoryContractMismatchError,
    );
  });

  it("treats a non-array content.content as a contract mismatch (not the #15 single-level content.items shape)", () => {
    expect(() =>
      toVehicleRentalHistoryResult({
        statusCode: 200,
        error: null,
        content: { items: [baseItem], pageInfo: { page: 1, pageSize: 8, totalCount: 1, totalPages: 1 } },
      }),
    ).toThrow(VehicleRentalHistoryContractMismatchError);
  });

  it("treats missing page-metadata fields as a contract mismatch", () => {
    expect(() =>
      toVehicleRentalHistoryResult({
        statusCode: 200,
        error: null,
        content: { content: [baseItem], page: 0 },
      }),
    ).toThrow(VehicleRentalHistoryContractMismatchError);
  });
});

const RENTAL_HISTORY_PATH = `${VEHICLE_DETAIL_ENDPOINT_PATH}/:vehicleId/rentals`;

function emptyEnvelopeResponse(page: number, totalPages = 1, totalElements = 0) {
  return HttpResponse.json({
    statusCode: 200,
    error: null,
    content: { content: [], page, size: 8, totalPages, totalElements },
  });
}

describe("fetchVehicleRentalHistory — 0-based/1-based page conversion boundary", () => {
  afterEach(() => server.resetHandlers());

  it("page=1 (1-based UI input) requests page=0 (0-based query), size=8 (PM A1)", async () => {
    let capturedUrl = "";
    server.use(
      http.get(RENTAL_HISTORY_PATH, ({ request }) => {
        capturedUrl = request.url;
        return emptyEnvelopeResponse(0);
      }),
    );

    await fetchVehicleRentalHistory("vehicle-mgmt-003", 1);

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("page")).toBe("0");
    expect(url.searchParams.get("size")).toBe("8");
  });

  it("page=3 (1-based UI input) requests page=2 (0-based query)", async () => {
    let capturedUrl = "";
    server.use(
      http.get(RENTAL_HISTORY_PATH, ({ request }) => {
        capturedUrl = request.url;
        return emptyEnvelopeResponse(2, 3, 20);
      }),
    );

    await fetchVehicleRentalHistory("vehicle-mgmt-003", 3);

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("page")).toBe("2");
  });
});

describe("fetchVehicleRentalHistory — HTTP/network/malformed-response error stages", () => {
  afterEach(() => server.resetHandlers());

  it("surfaces an HTTP 500 as a server-error VehicleRentalHistoryFetchError", async () => {
    server.use(
      http.get(RENTAL_HISTORY_PATH, () =>
        HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
      ),
    );

    await expect(fetchVehicleRentalHistory("vehicle-mgmt-003", 1)).rejects.toMatchObject({
      name: "VehicleRentalHistoryFetchError",
      kind: "server-error",
    });
  });

  it("surfaces a non-JSON body as a malformed-response VehicleRentalHistoryFetchError", async () => {
    server.use(
      http.get(RENTAL_HISTORY_PATH, () => new HttpResponse("not json", { status: 200 })),
    );

    await expect(fetchVehicleRentalHistory("vehicle-mgmt-003", 1)).rejects.toMatchObject({
      name: "VehicleRentalHistoryFetchError",
      kind: "malformed-response",
    });
  });

  it("surfaces a well-formed business-failure envelope as a client-error VehicleRentalHistoryFetchError", async () => {
    server.use(
      http.get(RENTAL_HISTORY_PATH, () =>
        HttpResponse.json({
          statusCode: 404,
          error: "NOT_FOUND",
          content: { content: [], page: 0, size: 8, totalPages: 1, totalElements: 0 },
        }),
      ),
    );

    await expect(fetchVehicleRentalHistory("vehicle-mgmt-999", 1)).rejects.toMatchObject({
      name: "VehicleRentalHistoryFetchError",
      kind: "client-error",
    });
  });
});
