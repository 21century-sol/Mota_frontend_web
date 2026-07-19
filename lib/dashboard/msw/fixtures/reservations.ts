import type {
  ApiResponseRentalStatusPageResponse,
  RentalStatusResponse,
} from "@/types/dashboard/reservation";

/**
 * `GET /api/dashboard/rentals` fixtures (issue #51, matching the *live* backend
 * contract, replacing the #16 local-fixture-only `RESERVATION_FIXTURES` set
 * entirely). Renter names/phones/plates are synthetic Korean rental-car data
 * (CLAUDE.md §6). `startDate`/`endDate` are date-only `YYYY-MM-DD` literals (the
 * canonical wire format; the adapter also tolerates the dot-separated variant
 * the live backend currently emits) — always static, never `new Date()`.
 * `reportDownloadUrl` is `null` for rows without a report (all `IN_PROGRESS`
 * here), mirroring the live backend.
 *
 * 7 `IN_PROGRESS` / 7 `RETURNED` rows (14 total) so both the unfiltered list
 * (14 → 2 pages of 8) and the single-status tabs (7 rows → 1 page each) exercise
 * pagination. `rental-res-006`/`rental-res-010` share the same `startDate` day
 * (2026-06-10) so the `rentedOn` exact-day filter has more than one match to
 * verify against.
 */
export const reservationsNormalFixture: RentalStatusResponse[] = [
  {
    rentalId: "rental-res-001",
    renterName: "김모타",
    contact: "010-1243-1231",
    manufacturer: "현대",
    model: "그랜저 GN7",
    plateNumber: "12가 4412",
    startDate: "2026-07-19",
    endDate: "2026-07-21",
    status: "RETURNED",
    reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-001.pdf",
  },
  {
    rentalId: "rental-res-002",
    renterName: "홍길동",
    contact: "010-2233-4455",
    manufacturer: "기아",
    model: "쏘렌토",
    plateNumber: "34나 5566",
    startDate: "2026-07-15",
    endDate: "2026-07-25",
    status: "IN_PROGRESS",
    reportDownloadUrl: null,
  },
  {
    rentalId: "rental-res-003",
    renterName: "이서준",
    contact: "010-3344-5566",
    manufacturer: "현대",
    model: "아반떼 하이브리드",
    plateNumber: "56다 7788",
    startDate: "2026-07-10",
    endDate: "2026-07-13",
    status: "RETURNED",
    reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-003.pdf",
  },
  {
    rentalId: "rental-res-004",
    renterName: "박지훈",
    contact: "010-4455-6677",
    manufacturer: "기아",
    model: "K5",
    plateNumber: "78라 9900",
    startDate: "2026-07-11",
    endDate: "2026-07-14",
    status: "RETURNED",
    reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-004.pdf",
  },
  {
    rentalId: "rental-res-005",
    renterName: "최수아",
    contact: "010-5566-7788",
    manufacturer: "현대",
    model: "팰리세이드",
    plateNumber: "90마 1122",
    startDate: "2026-07-16",
    endDate: "2026-07-24",
    status: "IN_PROGRESS",
    reportDownloadUrl: null,
  },
  {
    rentalId: "rental-res-006",
    renterName: "정민준",
    contact: "010-6677-8899",
    manufacturer: "기아",
    model: "카니발",
    plateNumber: "11바 3344",
    startDate: "2026-06-10",
    endDate: "2026-07-12",
    status: "RETURNED",
    reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-006.pdf",
  },
  {
    rentalId: "rental-res-007",
    renterName: "강하은",
    contact: "010-7788-9900",
    manufacturer: "현대",
    model: "투싼",
    plateNumber: "23사 5566",
    startDate: "2026-07-17",
    endDate: "2026-07-26",
    status: "IN_PROGRESS",
    reportDownloadUrl: null,
  },
  {
    rentalId: "rental-res-008",
    renterName: "윤도윤",
    contact: "010-8899-0011",
    manufacturer: "기아",
    model: "스포티지",
    plateNumber: "45아 7788",
    startDate: "2026-07-05",
    endDate: "2026-07-09",
    status: "RETURNED",
    reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-008.pdf",
  },
  {
    rentalId: "rental-res-009",
    renterName: "임서연",
    contact: "010-9900-1122",
    manufacturer: "현대",
    model: "싼타페",
    plateNumber: "67자 9900",
    startDate: "2026-07-14",
    endDate: "2026-07-22",
    status: "IN_PROGRESS",
    reportDownloadUrl: null,
  },
  {
    rentalId: "rental-res-010",
    renterName: "한지호",
    contact: "010-0011-2233",
    manufacturer: "기아",
    model: "셀토스",
    plateNumber: "89차 1122",
    startDate: "2026-06-10",
    endDate: "2026-07-10",
    status: "RETURNED",
    reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-010.pdf",
  },
  {
    rentalId: "rental-res-011",
    renterName: "오예린",
    contact: "010-1122-3344",
    manufacturer: "현대",
    model: "아이오닉6",
    plateNumber: "10카 3344",
    startDate: "2026-07-18",
    endDate: "2026-07-27",
    status: "IN_PROGRESS",
    reportDownloadUrl: null,
  },
  {
    rentalId: "rental-res-012",
    renterName: "신동현",
    contact: "010-2233-4456",
    manufacturer: "기아",
    model: "EV6",
    plateNumber: "21타 5566",
    startDate: "2026-07-02",
    endDate: "2026-07-06",
    status: "RETURNED",
    reportDownloadUrl: "https://mota-app.duckdns.org/reports/rental-res-012.pdf",
  },
  {
    rentalId: "rental-res-013",
    renterName: "배수빈",
    contact: "010-3344-5567",
    manufacturer: "현대",
    model: "넥쏘",
    plateNumber: "32파 7788",
    startDate: "2026-07-13",
    endDate: "2026-07-23",
    status: "IN_PROGRESS",
    reportDownloadUrl: null,
  },
  {
    rentalId: "rental-res-014",
    renterName: "조은우",
    contact: "010-4455-6678",
    manufacturer: "기아",
    model: "레이",
    plateNumber: "43하 9900",
    startDate: "2026-07-12",
    endDate: "2026-07-20",
    status: "IN_PROGRESS",
    reportDownloadUrl: null,
  },
] satisfies RentalStatusResponse[];

/** Empty scenario (AC — 0 matching reservations, distinct from a filtered 0-result). */
export const reservationsEmptyFixture: RentalStatusResponse[] = [] satisfies RentalStatusResponse[];

/**
 * Mirrors the real endpoint's confirmed query semantics
 * (`.claude/handoffs/51-api-specs.md`): `status` is an exact match,
 * `rentedFrom`/`rentedTo` bound `startDate`'s date part (inclusive),
 * `returnedFrom`/`returnedTo` bound `endDate`'s date part (inclusive). The UI
 * only ever sends `rentedFrom === rentedTo`/`returnedFrom === returnedTo`
 * (single-day filter), but the range comparison here is written generally so
 * this fixture helper stays a faithful backend emulation rather than an
 * equality-only shortcut.
 *
 * Item dates are normalized to dashes (`YYYY-MM-DD`) before the lexicographic
 * range compare so the helper stays correct whether the fixture uses the dashed
 * or the dot-separated variant; the query params are always dashed (the
 * OpenAPI `date` format the UI sends).
 */
export function filterReservationApiFixture(
  items: RentalStatusResponse[],
  filters: {
    status?: string;
    rentedFrom?: string;
    rentedTo?: string;
    returnedFrom?: string;
    returnedTo?: string;
  },
): RentalStatusResponse[] {
  return items.filter((item) => {
    if (filters.status && item.status !== filters.status) return false;

    const rentedDate = item.startDate.replace(/\./g, "-");
    if (filters.rentedFrom && rentedDate < filters.rentedFrom) return false;
    if (filters.rentedTo && rentedDate > filters.rentedTo) return false;

    const returnedDate = item.endDate.replace(/\./g, "-");
    if (filters.returnedFrom && returnedDate < filters.returnedFrom) return false;
    if (filters.returnedTo && returnedDate > filters.returnedTo) return false;

    return true;
  });
}

/**
 * `page` is 0-based (issue #51 confirmed contract) — the handler reads it
 * straight off the request's `page` query param, no 1-based conversion here
 * (that only happens in the adapter's `toReservationListResult`).
 */
export function toReservationStatusPageResponse(
  items: RentalStatusResponse[],
  page: number,
  size: number,
): ApiResponseRentalStatusPageResponse {
  const totalElements = items.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / size));
  const start = page * size;
  const content = items.slice(start, start + size);
  return {
    statusCode: 200,
    error: null,
    content: { content, page, size, totalPages, totalElements },
  };
}
