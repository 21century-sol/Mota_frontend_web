/**
 * 실시간 알림 목록(`GET /api/dashboard/alerts`) MSW 픽스처.
 *
 * 행 형태는 백엔드 `AlertResponse`(SSE 이벤트 본문과 동일)이다. 무한 스크롤을
 * 검증할 수 있도록 페이지 크기(20)를 넘는 25건을 최신순으로 둔다.
 */
export interface AlertResponseFixture {
  alertId: string;
  vehicleId: string;
  plateNumber: string;
  tireId: string;
  alertLevel: "WARNING" | "DANGER";
  alertTitle: string;
  alertTime: string;
}

export const alertsFixtureRows: AlertResponseFixture[] = Array.from(
  { length: 25 },
  (_, i) => {
    const n = i + 1;
    const minute = String(59 - i).padStart(2, "0"); // 최신(10:59)에서 과거로
    const even = n % 2 === 0;
    return {
      alertId: `alert-${String(n).padStart(2, "0")}`,
      vehicleId: even ? "v-2" : "v-1",
      plateNumber: even ? "88허 1004" : "12가 3456",
      tireId: `tire-${n}`,
      alertLevel: n % 3 === 0 ? "DANGER" : "WARNING",
      alertTitle: `알림 제목 ${n}`,
      alertTime: `2026.07.16 10:${minute}:00`,
    };
  },
);
