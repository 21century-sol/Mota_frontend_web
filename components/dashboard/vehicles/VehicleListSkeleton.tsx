/**
 * Loading placeholder for the vehicle list (AC2). Renders neutral bars instead
 * of an empty container so a still-loading state can never be mistaken for the
 * 0-vehicle empty state (AC3), matching `SummaryCardsSkeleton`/
 * `AlertsListSkeleton` (issue #11/#12).
 */
export function VehicleListSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      {/* The parent container already carries `aria-busy`; this text gives screen
          reader users an explicit status instead of silence while the bars
          (decorative, aria-hidden) animate. */}
      <span className="sr-only">차량 목록을 불러오는 중입니다.</span>
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex items-center gap-4 rounded-lg border border-dashboard-vehicles-border p-3"
        >
          <div className="h-12 w-16 shrink-0 animate-pulse rounded-md bg-dashboard-vehicles-surface motion-reduce:animate-none" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="h-3.5 w-28 animate-pulse rounded bg-dashboard-vehicles-surface motion-reduce:animate-none" />
            <div className="h-3 w-40 animate-pulse rounded bg-dashboard-vehicles-surface motion-reduce:animate-none" />
          </div>
          <div className="h-6 w-16 shrink-0 animate-pulse rounded-full bg-dashboard-vehicles-surface motion-reduce:animate-none" />
          <div className="h-3 w-10 shrink-0 animate-pulse rounded bg-dashboard-vehicles-surface motion-reduce:animate-none" />
          <div className="hidden h-3 w-16 shrink-0 animate-pulse rounded bg-dashboard-vehicles-surface motion-reduce:animate-none md:block" />
          <div className="hidden h-3 w-16 shrink-0 animate-pulse rounded bg-dashboard-vehicles-surface motion-reduce:animate-none md:block" />
        </div>
      ))}
    </div>
  );
}
