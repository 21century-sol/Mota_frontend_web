/**
 * Loading placeholder for the whole vehicle detail screen (issue #15, PM
 * AC5; layout updated for issue #53). `aria-busy="true"` is applied by the
 * parent `VehicleDetailSection` wrapper, matching the
 * `VehicleListSkeleton`/`AlertsListSkeleton` precedent.
 *
 * Mirrors the loaded layout to avoid a load-time layout jump: full-width
 * summary banner (photo left + info bars right) → `802fr / 298fr` 2-column
 * grid of tab area (left) and the two sidebar cards (right).
 */
export function VehicleDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" data-testid="vehicle-detail-skeleton">
      <div className="h-9 w-40 rounded-full bg-dashboard-vehicles-surface" />

      <div className="rounded-dashboard-card bg-dashboard-vehicles-surface p-6">
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
          <div className="flex shrink-0 flex-col gap-2">
            <div className="h-[235px] w-full rounded-lg bg-white/60 lg:w-[353px]" />
            <div className="flex gap-2">
              <div className="h-[75px] w-[112px] rounded-lg bg-white/60" />
              <div className="h-[75px] w-[112px] rounded-lg bg-white/60" />
              <div className="h-[75px] w-[112px] rounded-lg bg-white/60" />
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-6">
            <div className="flex flex-col gap-3">
              <div className="h-7 w-32 rounded bg-white/60" />
              <div className="h-5 w-40 rounded bg-white/60" />
              <div className="h-4 w-28 rounded bg-white/60" />
              <div className="flex flex-wrap gap-1.5">
                <div className="h-6 w-16 rounded bg-white/60" />
                <div className="h-6 w-16 rounded bg-white/60" />
                <div className="h-6 w-16 rounded bg-white/60" />
              </div>
            </div>
            <div className="mt-auto grid grid-cols-3 gap-4 border-t border-dashboard-vehicles-border pt-5">
              <div className="h-10 rounded bg-white/60" />
              <div className="h-10 rounded bg-white/60" />
              <div className="h-10 rounded bg-white/60" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,802fr)_minmax(0,298fr)] lg:items-start">
        <div className="flex flex-col gap-5">
          <div className="h-9 w-64 rounded bg-dashboard-vehicles-surface" />
          <div className="h-64 w-full rounded-dashboard-card bg-dashboard-vehicles-surface" />
        </div>
        <div className="flex flex-col gap-4">
          <div className="h-40 w-full rounded-dashboard-card bg-dashboard-vehicles-surface" />
          <div className="h-40 w-full rounded-dashboard-card bg-dashboard-vehicles-surface" />
        </div>
      </div>
    </div>
  );
}
