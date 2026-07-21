"use client";

import { useId, useState } from "react";
import { Search, X } from "lucide-react";

/**
 * TopBar search field (Figma node 2467:28491 default / 2715:27388 typing state).
 *
 * Only the two visual states from Figma are implemented — typing updates local state
 * and toggles the clear button, but no search request is ever issued (Non-goal for
 * issue #10; search execution/results are out of scope).
 */
export function SearchInput() {
  const [value, setValue] = useState("");
  const inputId = useId();
  const hasValue = value.length > 0;

  return (
    <div className="w-[400px] max-w-full">
      <label htmlFor={inputId} className="sr-only">
        차량번호, 고객명, 예약번호 검색
      </label>
      <div
        className={[
          "flex items-center gap-[10px] rounded-full border border-dashboard-search-border bg-dashboard-surface px-3 py-2.5",
          hasValue
            ? "shadow-[0px_0px_24px_0px_rgba(90,85,242,0.4)]"
            : "shadow-[0px_0px_12px_0px_rgba(90,85,242,0.12)]",
        ].join(" ")}
      >
        <Search
          className="h-6 w-6 shrink-0 text-dashboard-placeholder"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder="차량번호, 고객명, 예약번호 검색"
          className="w-full min-w-0 bg-transparent text-sm text-dashboard-text outline-none placeholder:text-dashboard-placeholder"
        />
        {hasValue && (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label="검색어 지우기"
            className="shrink-0 rounded-full p-0.5 text-dashboard-placeholder outline-none hover:text-dashboard-text focus-visible:ring-2 focus-visible:ring-dashboard-search-border"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  );
}
