import type { ReservationItem } from "@/types/dashboard/reservation";

/**
 * Local, static fixture for `/dashboard/reservations` (issue #16). No server
 * fetch, MSW handler or React Query is used anywhere in this feature — PM
 * confirmed the screen is Figma-only static UI
 * (`.claude/handoffs/16-pm-breakdown.md` Source of Truth).
 *
 * `res-001` keeps the literal sample row captured from Figma
 * (`.claude/handoffs/16-figma-specs.md` Confirmed Design Facts: 김모타,
 * 010-1243-1231, "12가 4412" / "현대 그랜저 GN7", 26.07.19 → 26.07.21). The
 * remaining rows are synthetic Korean rental-car data (CLAUDE.md §6) added to
 * cover pagination beyond a single page (PM Safe Assumption A1: 8/page,
 * 12~20 rows total; A5 caps this at <=3 pages of 8). Dates are fixed ISO
 * strings — never derived from `new Date()` (CLAUDE.md §6).
 *
 * 9 `RENTED` / 7 `RETURNED` rows so both the unfiltered list (16 → 2 pages)
 * and the "대여 중" tab alone (9 → 2 pages) can exercise pagination + the
 * AC4 "filter reset returns to page 1" flow.
 */
export const RESERVATION_FIXTURES = [
  {
    id: "res-001",
    renterName: "김모타",
    renterPhone: "010-1243-1231",
    plateNumber: "12가 4412",
    vehicleModel: "현대 그랜저 GN7",
    rentedAt: "2026-07-19",
    returnedAt: "2026-07-21",
    status: "RETURNED",
  },
  {
    id: "res-002",
    renterName: "홍길동",
    renterPhone: "010-2233-4455",
    plateNumber: "34나 5566",
    vehicleModel: "기아 쏘렌토",
    rentedAt: "2026-07-15",
    returnedAt: "2026-07-25",
    status: "RENTED",
  },
  {
    id: "res-003",
    renterName: "이서준",
    renterPhone: "010-3344-5566",
    plateNumber: "56다 7788",
    vehicleModel: "현대 아반떼 하이브리드",
    rentedAt: "2026-07-10",
    returnedAt: "2026-07-13",
    status: "RETURNED",
  },
  {
    id: "res-004",
    renterName: "박지훈",
    renterPhone: "010-4455-6677",
    plateNumber: "78라 9900",
    vehicleModel: "기아 K5",
    rentedAt: "2026-07-11",
    returnedAt: "2026-07-14",
    status: "RETURNED",
  },
  {
    id: "res-005",
    renterName: "최수아",
    renterPhone: "010-5566-7788",
    plateNumber: "90마 1122",
    vehicleModel: "현대 팰리세이드",
    rentedAt: "2026-07-16",
    returnedAt: "2026-07-24",
    status: "RENTED",
  },
  {
    id: "res-006",
    renterName: "정민준",
    renterPhone: "010-6677-8899",
    plateNumber: "11바 3344",
    vehicleModel: "기아 카니발",
    rentedAt: "2026-07-08",
    returnedAt: "2026-07-12",
    status: "RETURNED",
  },
  {
    id: "res-007",
    renterName: "강하은",
    renterPhone: "010-7788-9900",
    plateNumber: "23사 5566",
    vehicleModel: "현대 투싼",
    rentedAt: "2026-07-17",
    returnedAt: "2026-07-26",
    status: "RENTED",
  },
  {
    id: "res-008",
    renterName: "윤도윤",
    renterPhone: "010-8899-0011",
    plateNumber: "45아 7788",
    vehicleModel: "기아 스포티지",
    rentedAt: "2026-07-05",
    returnedAt: "2026-07-09",
    status: "RETURNED",
  },
  {
    id: "res-009",
    renterName: "임서연",
    renterPhone: "010-9900-1122",
    plateNumber: "67자 9900",
    vehicleModel: "현대 싼타페",
    rentedAt: "2026-07-14",
    returnedAt: "2026-07-22",
    status: "RENTED",
  },
  {
    id: "res-010",
    renterName: "한지호",
    renterPhone: "010-0011-2233",
    plateNumber: "89차 1122",
    vehicleModel: "기아 셀토스",
    rentedAt: "2026-07-06",
    returnedAt: "2026-07-10",
    status: "RETURNED",
  },
  {
    id: "res-011",
    renterName: "오예린",
    renterPhone: "010-1122-3344",
    plateNumber: "10카 3344",
    vehicleModel: "현대 아이오닉6",
    rentedAt: "2026-07-18",
    returnedAt: "2026-07-27",
    status: "RENTED",
  },
  {
    id: "res-012",
    renterName: "신동현",
    renterPhone: "010-2233-4456",
    plateNumber: "21타 5566",
    vehicleModel: "기아 EV6",
    rentedAt: "2026-07-02",
    returnedAt: "2026-07-06",
    status: "RETURNED",
  },
  {
    id: "res-013",
    renterName: "배수빈",
    renterPhone: "010-3344-5567",
    plateNumber: "32파 7788",
    vehicleModel: "현대 넥쏘",
    rentedAt: "2026-07-13",
    returnedAt: "2026-07-23",
    status: "RENTED",
  },
  {
    id: "res-014",
    renterName: "조은우",
    renterPhone: "010-4455-6678",
    plateNumber: "43하 9900",
    vehicleModel: "기아 레이",
    rentedAt: "2026-07-12",
    returnedAt: "2026-07-20",
    status: "RENTED",
  },
  {
    id: "res-015",
    renterName: "권나윤",
    renterPhone: "010-5566-7789",
    plateNumber: "54거 1122",
    vehicleModel: "현대 캐스퍼",
    rentedAt: "2026-07-09",
    returnedAt: "2026-07-19",
    status: "RENTED",
  },
  {
    id: "res-016",
    renterName: "문시우",
    renterPhone: "010-6677-8890",
    plateNumber: "65너 3344",
    vehicleModel: "기아 모닝",
    rentedAt: "2026-07-03",
    returnedAt: "2026-07-11",
    status: "RENTED",
  },
] satisfies ReservationItem[];

/**
 * Update-time text shown next to the reset button (Figma Confirmed Design
 * Facts: "새로고침/리셋 아이콘 존재: 업데이트 시간 텍스트 옆 원형 버튼"). The exact
 * copy was not captured in the figma handoff, so this is a fixed, static
 * fixture string — never generated from `new Date()` (CLAUDE.md §6) — kept
 * next to the other fixture data it describes.
 */
export const RESERVATIONS_UPDATED_AT_LABEL = "업데이트 2026.07.19 09:00";
