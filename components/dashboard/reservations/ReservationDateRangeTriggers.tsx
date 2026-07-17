import { Calendar } from "lucide-react";

/**
 * 대여일/반납일 calendar pill triggers (issue #16, Figma Confirmed Design
 * Facts: `rounded-[100px] bg-white border border-[#e1e2e4]` pill + Calendar
 * icon, `.claude/handoffs/16-figma-specs.md`).
 *
 * PM Non-goal: no real date filtering. The Figma calendar popover (320×368)
 * is intentionally not built — PM Safe Assumption A4 allows but does not
 * require it, and the "In scope" line only asks for the trigger's UI render.
 * These are plain, no-op `<button>`s (same pattern as the "리포트" button in
 * `UsageHistoryTab`, issue #15) rather than `disabled` elements, so they stay
 * a real focusable/keyboard-reachable affordance instead of disappearing from
 * the tab order.
 */
export function ReservationDateRangeTriggers() {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="대여일 선택"
        className="flex items-center gap-2 rounded-full border border-dashboard-vehicles-border bg-white px-4 py-2 text-sm text-dashboard-vehicles-label outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-2"
      >
        <Calendar aria-hidden="true" className="h-4 w-4" />
        대여일
      </button>
      <button
        type="button"
        aria-label="반납일 선택"
        className="flex items-center gap-2 rounded-full border border-dashboard-vehicles-border bg-white px-4 py-2 text-sm text-dashboard-vehicles-label outline-none focus-visible:ring-2 focus-visible:ring-dashboard-accent-solid focus-visible:ring-offset-2"
      >
        <Calendar aria-hidden="true" className="h-4 w-4" />
        반납일
      </button>
    </div>
  );
}
