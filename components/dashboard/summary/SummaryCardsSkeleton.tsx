import type { SummaryCardVariant } from "@/components/dashboard/summary/SummaryCard";

/**
 * Per-variant skeleton shell — matches the real {@link SummaryCard} container
 * padding/shadow and count-bar height so the loading placeholder occupies the
 * same box as the resolved card for each variant.
 */
const SKELETON_STYLES: Record<
  SummaryCardVariant,
  { container: string; countBar: string }
> = {
  dashboard: {
    container:
      "flex flex-col items-start gap-3 rounded-dashboard-card bg-white px-6 py-5 shadow-dashboard-card",
    countBar: "h-10 w-24",
  },
  vehicles: {
    container:
      "flex flex-col items-start gap-3 rounded-dashboard-card bg-white px-6 pb-4 pt-5 shadow-dashboard-tire-card",
    countBar: "h-8 w-24",
  },
};

/**
 * Loading placeholder for the 4 summary cards (AC2). Renders neutral bars instead
 * of "0" or an empty string so a still-loading state can never be mistaken for a
 * real 0-count response (AC3 distinguishes the two).
 */
export function SummaryCardsSkeleton({
  variant = "dashboard",
}: {
  variant?: SummaryCardVariant;
} = {}) {
  const styles = SKELETON_STYLES[variant];

  return (
    <>
      {/* The parent container already carries `aria-busy`; this text gives screen
          reader users an explicit status instead of silence while the bars (decorative,
          aria-hidden) animate. */}
      <span className="sr-only">차량 상태 요약을 불러오는 중입니다.</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} aria-hidden="true" className={styles.container}>
          <div className="h-4 w-20 animate-pulse rounded bg-dashboard-surface motion-reduce:animate-none" />
          <div
            className={`${styles.countBar} animate-pulse rounded bg-dashboard-surface motion-reduce:animate-none`}
          />
        </div>
      ))}
    </>
  );
}
