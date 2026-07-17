/**
 * Loading placeholder for the whole vehicle detail screen (issue #15, PM
 * AC5). `aria-busy="true"` is applied by the parent `VehicleDetailSection`
 * wrapper, matching the `VehicleListSkeleton`/`AlertsListSkeleton` precedent.
 */
export function VehicleDetailSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-6" data-testid="vehicle-detail-skeleton">
      <div className="h-9 w-40 rounded-full bg-dashboard-vehicles-surface" />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-4 rounded-dashboard-card bg-dashboard-vehicles-surface p-6">
          <div className="h-56 w-full rounded-2xl bg-white/60" />
          <div className="h-5 w-1/2 rounded bg-white/60" />
          <div className="h-4 w-1/3 rounded bg-white/60" />
        </div>
        <div className="flex flex-col gap-4 rounded-dashboard-card bg-dashboard-vehicles-surface p-6">
          <div className="h-24 w-full rounded-2xl bg-white/60" />
          <div className="h-24 w-full rounded-2xl bg-white/60" />
        </div>
      </div>
      <div className="h-64 w-full rounded-dashboard-card bg-dashboard-vehicles-surface" />
    </div>
  );
}
