/**
 * Loading placeholder for the 4 summary cards (AC2). Renders neutral bars instead
 * of "0" or an empty string so a still-loading state can never be mistaken for a
 * real 0-count response (AC3 distinguishes the two).
 */
export function SummaryCardsSkeleton() {
  return (
    <>
      {/* The parent container already carries `aria-busy`; this text gives screen
          reader users an explicit status instead of silence while the bars (decorative,
          aria-hidden) animate. */}
      <span className="sr-only">차량 상태 요약을 불러오는 중입니다.</span>
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex flex-col items-start gap-3 rounded-dashboard-card bg-white px-6 py-5 shadow-dashboard-card"
        >
          <div className="h-4 w-20 animate-pulse rounded bg-dashboard-surface motion-reduce:animate-none" />
          <div className="h-10 w-24 animate-pulse rounded bg-dashboard-surface motion-reduce:animate-none" />
        </div>
      ))}
    </>
  );
}
