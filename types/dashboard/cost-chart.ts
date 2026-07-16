/**
 * 대시보드 차량유지보수비 라인 차트(issue #13)의 월별 데이터 포인트.
 *
 * `lastYearCost`는 전년도 동월 비용(회색 "last" 라인, 12개월 전체 존재)이고
 * `currentYearCost`는 선택 연도의 동월 실측 비용(퍼플 "current" 라인)이다.
 * `currentYearCost`가 없는 달은 아직 실측 데이터가 없는 달을 의미하며, 해당
 * 달부터는 "current" 라인이 그려지지 않는다 — Figma에서 current 라인이 7월
 * (현재월)까지만 존재하는 것과 동일한 표현이다
 * (`.claude/handoffs/13-figma-specs.md` "last/current 라인 해석" 참고).
 *
 * 단위: 만원. Figma 디자인에는 단위 표기가 없어 사용자 승인
 * (Decision Resolved 2026-07-16, `.claude/handoffs/13-figma-specs.md` #1)에 따라
 * "만원"으로 확정했다 — Assumption, PR `Assumptions and Decisions`에도 기록.
 */
export interface MonthlyCostPoint {
  /** 1~12 */
  month: number;
  lastYearCost: number;
  currentYearCost?: number;
}

/** 연도 selector 한 항목(예: "2026")이 소유하는 유지관리비 차트 데이터셋. */
export interface YearlyCostDataset {
  /** Year Selector에 표시되는 연도 값 (예: 2026) */
  year: number;
  /** 12개월 전체, index 0 = 1월 ~ index 11 = 12월 */
  points: MonthlyCostPoint[];
  /**
   * 강조 포인트(Ellipse + 툴팁)가 표시되는 월의 0-based index.
   * `points[highlightedMonthIndex].currentYearCost`가 존재해야 한다.
   */
  highlightedMonthIndex: number;
  /** 전년대비 증감률(%), 절대값(부호 없음) — 방향은 `comparisonDirection`으로 별도 표현 */
  comparisonPercentage: number;
  /**
   * 증감 방향. Figma·사용자 승인(Decision Resolved 2026-07-16 #2)에 따라 증가/감소를
   * 색상으로 구분하지 않고 항상 `dashboard-chart-accent` 단일 색상 + 캐럿 아이콘 회전으로만
   * 표시한다.
   */
  comparisonDirection: "increase" | "decrease";
}
