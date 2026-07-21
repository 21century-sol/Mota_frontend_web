import type { LiveLocationDto } from "@/types/dashboard/live-locations";

/**
 * live-locations MSW fixtures.
 * `alerts` 픽스처의 `v-1`/`v-2`와 알림에 없는 대여 차량
 * (`v-rented-only`)을 함께 제공해 지도에 API 전체가 표시되는지 검증한다(#69).
 */
export const liveLocationsFixtureRows: LiveLocationDto[] = [
  {
    vehicleId: "v-1",
    plateNumber: "12가 3456",
    model: "아반떼 하이브리드",
    latitude: 33.5067,
    longitude: 126.4932,
    measuredAt: "2026-07-16T10:00:00",
  },
  {
    vehicleId: "v-2",
    plateNumber: "88허 1004",
    model: "쏘나타",
    latitude: 33.489,
    longitude: 126.4983,
    measuredAt: "2026-07-16T10:00:00",
  },
  {
    vehicleId: "v-rented-only",
    plateNumber: "27마 5821",
    model: "쏘나타 뉴 라이즈",
    latitude: 33.4767,
    longitude: 126.88366,
    measuredAt: "2026-07-16T10:00:00",
  },
];
