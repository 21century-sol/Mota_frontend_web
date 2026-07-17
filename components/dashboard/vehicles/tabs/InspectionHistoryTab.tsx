/**
 * "점검 이력" tab shell (issue #15, PM AC21 / Safe Assumption A2).
 * figma-agent confirmed no content panel Node exists for this tab within the
 * two explored roots (`.claude/handoffs/15-figma-specs.md` F1 결론) — this is
 * a deliberate, explicitly-labeled placeholder, not a silently empty screen.
 * TODO(#15): replace with the real panel once a Figma Node/API contract for
 * this tab is confirmed.
 */
export function InspectionHistoryTab() {
  return (
    <div className="flex flex-col items-center gap-2 rounded-dashboard-card bg-white py-16 text-center shadow-dashboard-card">
      <h3 className="m-0 text-base font-semibold text-dashboard-vehicles-title">점검 이력</h3>
      <p role="status" className="m-0 text-sm text-dashboard-vehicles-label">
        준비 중입니다. 곧 제공될 예정입니다.
      </p>
    </div>
  );
}
