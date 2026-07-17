"use client";

import { useRef } from "react";
import type { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import {
  buildVehicleDetailHref,
  VEHICLE_DETAIL_TABS,
  type VehicleDetailTab,
} from "@/lib/dashboard/vehicles/tab-url";
import { TireStatusTab } from "@/components/dashboard/vehicles/tabs/TireStatusTab";
import { UsageHistoryTab } from "@/components/dashboard/vehicles/tabs/UsageHistoryTab";
import { InspectionHistoryTab } from "@/components/dashboard/vehicles/tabs/InspectionHistoryTab";
import { VehicleInfoTab } from "@/components/dashboard/vehicles/tabs/VehicleInfoTab";

const TAB_LABELS: Record<VehicleDetailTab, string> = {
  tires: "타이어",
  usage: "이용 이력",
  inspection: "점검 이력",
  info: "차량 정보",
};

/**
 * 4-tab navigation (issue #15, Figma "Tab Navigation", PM AC12-AC14). The
 * active tab/page come from the Server Component page's `searchParams`
 * (`app/dashboard/vehicles/[vehicleId]/page.tsx`) as props — this component
 * only *writes* the next URL via `router.replace`, matching the
 * `VehicleFilterBar` precedent (issue #14).
 *
 * Only the active tab's panel is mounted (not hidden via CSS) — an inactive
 * tab's query (e.g. usage history) is not fetched until the user actually
 * selects it.
 */
export function VehicleDetailTabs({
  vehicleId,
  activeTab,
  page,
  vehiclePhotoUrl,
  vehicleModel,
}: {
  vehicleId: string;
  activeTab: VehicleDetailTab;
  page: number;
  vehiclePhotoUrl: string | undefined;
  vehicleModel: string;
}) {
  const router = useRouter();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function navigateToTab(tab: VehicleDetailTab) {
    router.replace(buildVehicleDetailHref(vehicleId, tab));
  }

  /** Left/Right/Home/End roving focus + activation (WAI-ARIA APG "automatic activation" tab pattern). */
  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const currentIndex = VEHICLE_DETAIL_TABS.indexOf(activeTab);
    let nextIndex: number | null = null;

    if (event.key === "ArrowRight") {
      nextIndex = (currentIndex + 1) % VEHICLE_DETAIL_TABS.length;
    } else if (event.key === "ArrowLeft") {
      nextIndex = (currentIndex - 1 + VEHICLE_DETAIL_TABS.length) % VEHICLE_DETAIL_TABS.length;
    } else if (event.key === "Home") {
      nextIndex = 0;
    } else if (event.key === "End") {
      nextIndex = VEHICLE_DETAIL_TABS.length - 1;
    }

    if (nextIndex === null) return;
    event.preventDefault();
    const nextTab = VEHICLE_DETAIL_TABS[nextIndex];
    tabRefs.current[nextIndex]?.focus();
    navigateToTab(nextTab);
  }

  return (
    <div className="flex flex-col gap-5">
      <div
        role="tablist"
        aria-label="차량 상세 탭"
        onKeyDown={handleKeyDown}
        className="flex gap-1 border-b border-dashboard-vehicles-border"
      >
        {VEHICLE_DETAIL_TABS.map((tab, index) => {
          const isSelected = tab === activeTab;
          return (
            <button
              key={tab}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              id={`vehicle-detail-tab-${tab}`}
              aria-controls={`vehicle-detail-tabpanel-${tab}`}
              aria-selected={isSelected}
              tabIndex={isSelected ? 0 : -1}
              onClick={() => navigateToTab(tab)}
              className={[
                "px-4 py-2.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-dashboard-sidebar",
                isSelected
                  ? "border-b-2 border-dashboard-chart-accent text-dashboard-chart-accent"
                  : "text-dashboard-vehicles-label hover:text-dashboard-vehicles-title",
              ].join(" ")}
            >
              {TAB_LABELS[tab]}
            </button>
          );
        })}
      </div>

      <div
        role="tabpanel"
        id={`vehicle-detail-tabpanel-${activeTab}`}
        aria-labelledby={`vehicle-detail-tab-${activeTab}`}
        tabIndex={0}
      >
        {activeTab === "tires" ? (
          <TireStatusTab
            vehicleId={vehicleId}
            vehiclePhotoUrl={vehiclePhotoUrl}
            vehicleModel={vehicleModel}
          />
        ) : activeTab === "usage" ? (
          <UsageHistoryTab vehicleId={vehicleId} page={page} />
        ) : activeTab === "inspection" ? (
          <InspectionHistoryTab />
        ) : (
          <VehicleInfoTab />
        )}
      </div>
    </div>
  );
}
