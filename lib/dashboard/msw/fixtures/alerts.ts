import type { AlertDto } from "@/types/dashboard/alerts";

/**
 * Normal scenario (AC1): 5 synthetic alerts matching the exact copy from Figma's
 * "Confirmed Design Facts" (`.claude/handoffs/12-figma-specs.md`) — 3 `DANGER` +
 * 2 `CAUTION`, each with a distinct vehicle and a synthetic South-Korea GPS
 * coordinate spread across cities (makes the "select → map recenters" behavior
 * visually obvious in manual/dev testing, vs. clustering all points together).
 *
 * `occurredAt` uses fixed ISO timestamps (CLAUDE.md §6 — never `new Date()` at
 * module load) anchored around a nominal "2026-07-16T10:00:00Z" reference so the
 * *relative offsets* mirror the Figma labels ("2분 전"/"30분 전"/"1시간 전").
 * Because `formatRelativeTime` compares against the real wall clock by default
 * (issue #12 has no polling requirement — labels are simply "fresh as of fetch
 * time"), the exact rendered text will drift from these Figma labels once run
 * outside that anchor instant; this is expected relative-time behavior, not a
 * fixture bug. Deterministic label assertions belong in
 * `tests/dashboard/alerts-api.test.ts`, which passes an explicit
 * `referenceTime` to `toAlertItems`.
 */
export const alertsNormalFixture: AlertDto[] = [
  {
    id: "alert-001",
    vehicleId: "vehicle-001",
    vehiclePlateNumber: "12가 3456",
    vehicleModel: "아반떼 하이브리드",
    description: "타이어 온도 90℃ 이상 감지",
    severity: "DANGER",
    occurredAt: "2026-07-16T09:58:00.000Z",
    location: { lat: 37.5665, lng: 126.978 }, // 서울시청
  },
  {
    id: "alert-002",
    vehicleId: "vehicle-002",
    vehiclePlateNumber: "56나 9201",
    vehicleModel: "쏘나타",
    description: "타이어 펑크 감지(공기압 27 psi)",
    severity: "DANGER",
    occurredAt: "2026-07-16T09:30:00.000Z",
    location: { lat: 37.4979, lng: 127.0276 }, // 강남역
  },
  {
    id: "alert-003",
    vehicleId: "vehicle-002",
    vehiclePlateNumber: "56나 9201",
    vehicleModel: "쏘나타",
    description: "타이어 펑크 감지(공기압 30 psi)",
    severity: "DANGER",
    occurredAt: "2026-07-16T09:29:00.000Z",
    location: { lat: 37.5512, lng: 126.9882 }, // 명동
  },
  {
    id: "alert-004",
    vehicleId: "vehicle-003",
    vehiclePlateNumber: "88허 1004",
    vehicleModel: "카니발",
    description: "타이어 마모도 70% 감지",
    severity: "CAUTION",
    occurredAt: "2026-07-16T09:00:00.000Z",
    location: { lat: 35.1796, lng: 129.0756 }, // 부산
  },
  {
    id: "alert-005",
    vehicleId: "vehicle-003",
    vehiclePlateNumber: "88허 1004",
    vehicleModel: "카니발",
    description: "타이어 마모도 50% 감지",
    severity: "CAUTION",
    occurredAt: "2026-07-16T08:59:00.000Z",
    location: { lat: 35.1595, lng: 126.8526 }, // 광주
  },
] satisfies AlertDto[];

/** Empty scenario (AC3 — 0 alerts must render a distinct empty message, not an error). */
export const alertsEmptyFixture: AlertDto[] = [] satisfies AlertDto[];
