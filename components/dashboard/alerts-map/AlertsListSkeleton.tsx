/**
 * Loading placeholder for the alerts list (AC2). Renders neutral bars instead of
 * an empty container so a still-loading state can never be mistaken for the
 * 0-alerts empty state (AC3 distinguishes the two), matching the
 * `SummaryCardsSkeleton` precedent (issue #11).
 */
export function AlertsListSkeleton() {
  return (
    <div className="flex flex-col divide-y divide-dashboard-divider">
      {/* The parent container already carries `aria-busy`; this text gives screen
          reader users an explicit status instead of silence while the bars
          (decorative, aria-hidden) animate. */}
      <span className="sr-only">실시간 알림을 불러오는 중입니다.</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} aria-hidden="true" className="flex items-center gap-3 px-1 py-3">
          <div className="h-8 w-8 shrink-0 animate-pulse rounded-lg bg-dashboard-surface motion-reduce:animate-none" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-3.5 w-24 animate-pulse rounded bg-dashboard-surface motion-reduce:animate-none" />
            <div className="h-3 w-36 animate-pulse rounded bg-dashboard-surface motion-reduce:animate-none" />
          </div>
        </div>
      ))}
    </div>
  );
}
