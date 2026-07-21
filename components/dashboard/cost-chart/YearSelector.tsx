/**
 * 연도 pill 버튼 그룹 (Figma "Year Selector", node 2361:23794). 화살표가 아니라
 * 연도 텍스트 자체("2025"/"2026")가 클릭 가능한 pill이다
 * (Decision Resolved 2026-07-16 #5, `.claude/handoffs/13-figma-specs.md`).
 *
 * 지원 연도가 정확히 2개뿐이므로 "prev/next 이동 + 경계 disabled" 대신, 두 pill 모두
 * 항상 클릭 가능한 토글 그룹으로 구현했다 — 탭(tab)류 UI의 일반적인 관례와 같이 현재
 * 선택된 pill을 다시 클릭해도 동일한 연도로 idempotent하게 유지되며 비활성화하지
 * 않는다(경계에서 버튼을 막는 "다음/이전" 스텝퍼 개념이 이제 존재하지 않기 때문).
 */
export function YearSelector({
  years,
  selectedYear,
  onSelectYear,
}: {
  years: readonly number[];
  selectedYear: number;
  onSelectYear: (year: number) => void;
}) {
  return (
    <div role="group" aria-label="연도 선택" className="flex items-center gap-1">
      {years.map((year) => {
        const isSelected = year === selectedYear;

        return (
          <button
            key={year}
            type="button"
            aria-pressed={isSelected}
            aria-label={`${year}년 데이터 보기`}
            onClick={() => onSelectYear(year)}
            className={[
              "rounded-[7px] px-2.5 py-0.5 text-sm font-semibold tracking-[-0.35px] outline-none transition-colors",
              "focus-visible:ring-2 focus-visible:ring-dashboard-chart-accent focus-visible:ring-offset-2",
              isSelected
                ? "bg-dashboard-chart-accent-soft text-dashboard-chart-accent"
                : "text-[#d3d3d3] hover:text-dashboard-chart-axis",
            ].join(" ")}
          >
            {year}
          </button>
        );
      })}
    </div>
  );
}
