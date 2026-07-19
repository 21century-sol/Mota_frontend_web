import { http, HttpResponse } from "msw";
import { afterEach, describe, expect, it } from "vitest";

import {
  fetchReservations,
  ReservationListContractMismatchError,
  ReservationListFetchError,
  RESERVATION_STATUS_ENDPOINT_PATH,
  toReservationListResult,
} from "@/lib/dashboard/reservations/api";
import { server } from "@/lib/dashboard/msw/server";

const baseItem = {
  rentalId: "rental-res-001",
  renterName: "홍길동",
  contact: "010-0000-0001",
  manufacturer: "현대",
  model: "아반떼 하이브리드",
  plateNumber: "12가 3456",
  startDate: "2026-06-01",
  endDate: "2026-06-03",
  status: "RETURNED",
  reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-001.pdf",
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

describe("toReservationListResult", () => {
  it("maps a normal envelope response, converting 0-based page to 1-based pageInfo.page", () => {
    const result = toReservationListResult(envelope([baseItem]));
    expect(result.items).toEqual([
      {
        id: "rental-res-001",
        renterName: "홍길동",
        renterPhone: "010-0000-0001",
        plateNumber: "12가 3456",
        vehicleModel: "현대 아반떼 하이브리드",
        rentedAt: "2026-06-01",
        returnedAt: "2026-06-03",
        status: "RETURNED",
        reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-001.pdf",
      },
    ]);
    expect(result.pageInfo).toEqual({ page: 1, pageSize: 8, totalCount: 1, totalPages: 1 });
  });

  it("maps IN_PROGRESS to RENTED", () => {
    const item = { ...baseItem, rentalId: "rental-res-002", status: "IN_PROGRESS" };
    const result = toReservationListResult(envelope([item]));
    expect(result.items[0].status).toBe("RENTED");
  });

  it("maps RETURNED to RETURNED", () => {
    const result = toReservationListResult(envelope([baseItem]));
    expect(result.items[0].status).toBe("RETURNED");
  });

  it("defensively drops a RESERVED row instead of throwing (PM Decision 1)", () => {
    const reserved = { ...baseItem, rentalId: "rental-res-003", status: "RESERVED" };
    const result = toReservationListResult(
      envelope([baseItem, reserved], { page: 0, size: 8, totalPages: 1, totalElements: 2 }),
    );
    expect(result.items).toHaveLength(1);
    expect(result.items[0].id).toBe("rental-res-001");
  });

  it("returns an empty list for 0 matching reservations, not an error", () => {
    const result = toReservationListResult(
      envelope([], { page: 0, size: 8, totalPages: 1, totalElements: 0 }),
    );
    expect(result.items).toEqual([]);
  });

  it("builds vehicleModel from manufacturer + model with a single space", () => {
    const item = { ...baseItem, manufacturer: "기아", model: "쏘렌토" };
    const result = toReservationListResult(envelope([item]));
    expect(result.items[0].vehicleModel).toBe("기아 쏘렌토");
  });

  it("keeps a dashed YYYY-MM-DD startDate/endDate as-is (canonical wire format)", () => {
    const item = { ...baseItem, startDate: "2026-12-31", endDate: "2027-01-01" };
    const result = toReservationListResult(envelope([item]));
    expect(result.items[0].rentedAt).toBe("2026-12-31");
    expect(result.items[0].returnedAt).toBe("2027-01-01");
  });

  it("tolerates the dot-separated YYYY.MM.DD variant, normalizing to YYYY-MM-DD without a timezone day-shift", () => {
    // The live backend currently emits dots. Parsing "2026.12.31" through
    // `new Date()` would yield local midnight and shift a day in UTC+ zones —
    // the adapter must do a literal separator swap instead.
    const item = { ...baseItem, startDate: "2026.12.31", endDate: "2027.01.01" };
    const result = toReservationListResult(envelope([item]));
    expect(result.items[0].rentedAt).toBe("2026-12-31");
    expect(result.items[0].returnedAt).toBe("2027-01-01");
  });

  it("allows an empty-string reportDownloadUrl", () => {
    const item = { ...baseItem, reportDownloadUrl: "" };
    expect(toReservationListResult(envelope([item])).items[0].reportDownloadUrl).toBe("");
  });

  it("allows a null reportDownloadUrl (live backend returns null when no report exists)", () => {
    const item = { ...baseItem, reportDownloadUrl: null };
    expect(toReservationListResult(envelope([item])).items[0].reportDownloadUrl).toBeNull();
  });

  it("treats an OpenAPI-style ISO date-time startDate as a contract mismatch (live wire format is YYYY.MM.DD)", () => {
    const item = { ...baseItem, startDate: "2026-06-01T09:00:00.000Z" };
    expect(() => toReservationListResult(envelope([item]))).toThrow(
      ReservationListContractMismatchError,
    );
  });

  it("treats a business-failure envelope (statusCode!==200) as a ReservationListFetchError, not a contract mismatch", () => {
    expect(() =>
      toReservationListResult({
        statusCode: 400,
        error: "BAD_REQUEST",
        content: { content: [], page: 0, size: 8, totalPages: 1, totalElements: 0 },
      }),
    ).toThrow(ReservationListFetchError);
  });

  it("treats a duplicate rentalId as a contract mismatch", () => {
    expect(() => toReservationListResult(envelope([baseItem, baseItem]))).toThrow(
      ReservationListContractMismatchError,
    );
  });

  it("treats an invalid status enum value as a contract mismatch", () => {
    const item = { ...baseItem, status: "CANCELED" };
    expect(() => toReservationListResult(envelope([item]))).toThrow(
      ReservationListContractMismatchError,
    );
  });

  it("treats an unparseable startDate as a contract mismatch", () => {
    const item = { ...baseItem, startDate: "not-a-date-time" };
    expect(() => toReservationListResult(envelope([item]))).toThrow(
      ReservationListContractMismatchError,
    );
  });

  it("treats a non-array content.content as a contract mismatch", () => {
    expect(() =>
      toReservationListResult({
        statusCode: 200,
        error: null,
        content: { items: [baseItem], pageInfo: { page: 1, pageSize: 8, totalCount: 1, totalPages: 1 } },
      }),
    ).toThrow(ReservationListContractMismatchError);
  });

  it("treats missing page-metadata fields as a contract mismatch", () => {
    expect(() =>
      toReservationListResult({
        statusCode: 200,
        error: null,
        content: { content: [baseItem], page: 0 },
      }),
    ).toThrow(ReservationListContractMismatchError);
  });
});

function emptyEnvelopeResponse(page: number, totalPages = 1, totalElements = 0) {
  return HttpResponse.json({
    statusCode: 200,
    error: null,
    content: { content: [], page, size: 8, totalPages, totalElements },
  });
}

describe("fetchReservations — URL params (status/date/page/size)", () => {
  afterEach(() => server.resetHandlers());

  it("page=1 (1-based UI input) requests page=0 (0-based query), size=8, no status/date/sort params for the 전체 tab", async () => {
    let capturedUrl = "";
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, ({ request }) => {
        capturedUrl = request.url;
        return emptyEnvelopeResponse(0);
      }),
    );

    await fetchReservations({}, 1);

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("page")).toBe("0");
    expect(url.searchParams.get("size")).toBe("8");
    expect(url.searchParams.has("status")).toBe(false);
    expect(url.searchParams.has("rentedFrom")).toBe(false);
    expect(url.searchParams.has("returnedFrom")).toBe(false);
    expect(url.searchParams.has("sort")).toBe(false);
  });

  it("page=3 (1-based UI input) requests page=2 (0-based query)", async () => {
    let capturedUrl = "";
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, ({ request }) => {
        capturedUrl = request.url;
        return emptyEnvelopeResponse(2, 3, 20);
      }),
    );

    await fetchReservations({}, 3);

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("page")).toBe("2");
  });

  it("sends status=IN_PROGRESS for the RENTED (대여 중) tab", async () => {
    let capturedUrl = "";
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, ({ request }) => {
        capturedUrl = request.url;
        return emptyEnvelopeResponse(0);
      }),
    );

    await fetchReservations({ status: "RENTED" }, 1);

    expect(new URL(capturedUrl).searchParams.get("status")).toBe("IN_PROGRESS");
  });

  it("sends status=RETURNED for the RETURNED (반납완료) tab", async () => {
    let capturedUrl = "";
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, ({ request }) => {
        capturedUrl = request.url;
        return emptyEnvelopeResponse(0);
      }),
    );

    await fetchReservations({ status: "RETURNED" }, 1);

    expect(new URL(capturedUrl).searchParams.get("status")).toBe("RETURNED");
  });

  it("sends rentedFrom=rentedTo=rentedOn when rentedOn is set", async () => {
    let capturedUrl = "";
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, ({ request }) => {
        capturedUrl = request.url;
        return emptyEnvelopeResponse(0);
      }),
    );

    await fetchReservations({ rentedOn: "2026-07-10" }, 1);

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("rentedFrom")).toBe("2026-07-10");
    expect(url.searchParams.get("rentedTo")).toBe("2026-07-10");
    expect(url.searchParams.has("returnedFrom")).toBe(false);
  });

  it("sends returnedFrom=returnedTo=returnedOn when returnedOn is set", async () => {
    let capturedUrl = "";
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, ({ request }) => {
        capturedUrl = request.url;
        return emptyEnvelopeResponse(0);
      }),
    );

    await fetchReservations({ returnedOn: "2026-07-20" }, 1);

    const url = new URL(capturedUrl);
    expect(url.searchParams.get("returnedFrom")).toBe("2026-07-20");
    expect(url.searchParams.get("returnedTo")).toBe("2026-07-20");
    expect(url.searchParams.has("rentedFrom")).toBe(false);
  });
});

describe("fetchReservations — HTTP/network/malformed-response error stages", () => {
  afterEach(() => server.resetHandlers());

  it("surfaces an HTTP 500 as a server-error ReservationListFetchError", async () => {
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, () =>
        HttpResponse.json({ message: "Internal Server Error" }, { status: 500 }),
      ),
    );

    await expect(fetchReservations({}, 1)).rejects.toMatchObject({
      name: "ReservationListFetchError",
      kind: "server-error",
    });
  });

  it("surfaces a non-JSON body as a malformed-response ReservationListFetchError", async () => {
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, () => new HttpResponse("not json", { status: 200 })),
    );

    await expect(fetchReservations({}, 1)).rejects.toMatchObject({
      name: "ReservationListFetchError",
      kind: "malformed-response",
    });
  });

  it("surfaces a well-formed business-failure envelope as a client-error ReservationListFetchError", async () => {
    server.use(
      http.get(RESERVATION_STATUS_ENDPOINT_PATH, () =>
        HttpResponse.json({
          statusCode: 404,
          error: "NOT_FOUND",
          content: { content: [], page: 0, size: 8, totalPages: 1, totalElements: 0 },
        }),
      ),
    );

    await expect(fetchReservations({}, 1)).rejects.toMatchObject({
      name: "ReservationListFetchError",
      kind: "client-error",
    });
  });
});
