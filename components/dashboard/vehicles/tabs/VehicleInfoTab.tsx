/**
 * "차량 정보" tab shell (issue #15, PM AC21 / Safe Assumption A2). Same
 * rationale as `InspectionHistoryTab` — no Figma content panel Node found for
 * this tab; explicit placeholder, not a silently empty screen.
 * TODO(#15): replace with the real panel once a Figma Node/API contract for
 * this tab is confirmed.
 */
export function VehicleInfoTab() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-dashboard-card bg-white py-16 text-center shadow-dashboard-card">
      <h3 className="m-0 text-base font-semibold text-dashboard-vehicles-title">차량 정보</h3>
      <p role="status" className="m-0 text-sm text-dashboard-vehicles-label">
        준비 중입니다. 곧 제공될 예정입니다.
      </p>
    </div>
  );
}
