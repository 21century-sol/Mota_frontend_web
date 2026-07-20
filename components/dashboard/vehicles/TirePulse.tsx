import type { ReactNode } from "react";

import type { TireStatus } from "@/types/dashboard/vehicle";

/**
 * 타이어 상세 화면 펄스(맥동) 애니메이션 — Figma node 1:4808 "타이어 이미지_FL"
 * (반프_이사 파일, file key nt8U8I48Rcfz8LGNqYvRZv, 확인 2026-07-20).
 *
 * 타이어가 주의(CAUTION)·위험(WARNING)일 때 중심에서 바깥으로 번지는 맥동을 무한 반복하고,
 * 정상(NORMAL)일 때는 애니메이션을 렌더하지 않는다. 중심에 겹쳐진 동심 레이어 4개로
 * 구성되며(세로로 긴 라운드 캡슐), 안쪽일수록 모서리 반경이 작다.
 *
 * - 코어(1:4812): 34×96, radius 12px, 불투명 단색(앰버/레드 100%). 확대 없이 페이드인만.
 * - 안쪽(1:4811): 54×116, radius 21.6px, 반투명 fill(16%).
 * - 중간(1:4810): 82×144, radius 34.2px, 반투명 fill(16%).
 * - 바깥(1:4809): 114×176, radius 48.6px, 반투명 fill(16%).
 *
 * 애니메이션 사이클(1650ms, tailwind.config `tire-pulse-*` keyframes): 코어→안쪽→중간→바깥
 * 순서로 순차 등장(각 350ms, 반투명은 0.92→1로 살짝 확대) → 네 레이어 동시에 페이드아웃(250ms)
 * → 반복. 최대 불투명도는 바깥일수록 진하다(바깥 0.95 · 중간 0.75 · 안쪽 0.55, 코어 1).
 *
 * 색상은 `status`로만 결정한다(측정값이 아니라 서버가 판정한 상태 — issue #15). `motion-safe:`로
 * `prefers-reduced-motion` 사용자에게는 애니메이션 없이 정적 표시하되(색으로 상태 전달) 레이어는
 * 그대로 보인다. 크기는 Figma 원본(108px 컨테이너)에 맞춘 고정값이며, 다른 크기가 필요하면
 * 부모에서 `transform: scale(...)`로 감싼다.
 */

/** 상태별 색상 클래스 — 런타임 조합 없이 정적 문자열로 작성한다(CLAUDE.md §4). */
const PULSE_TRANSLUCENT_BG: Record<"CAUTION" | "WARNING", string> = {
  CAUTION: "bg-dashboard-tire-caution-bg",
  WARNING: "bg-dashboard-tire-warning-bg",
};

const PULSE_CORE_BG: Record<"CAUTION" | "WARNING", string> = {
  CAUTION: "bg-dashboard-tire-caution",
  WARNING: "bg-dashboard-tire-warning",
};

/** 동심 레이어 4개의 Figma 기하값 + peak 불투명도 + 등장 애니메이션(안→밖 순서). */
const PULSE_LAYERS = [
  // 바깥 → 안 순서로 DOM에 쌓고, 코어(불투명)를 마지막에 올려 위로 오게 한다.
  { key: "outer", size: "h-[176px] w-[114px]", radius: "rounded-[48.6px]", peak: "opacity-[0.95]", animation: "motion-safe:animate-tire-pulse-outer" },
  { key: "mid", size: "h-[144px] w-[82px]", radius: "rounded-[34.2px]", peak: "opacity-[0.75]", animation: "motion-safe:animate-tire-pulse-mid" },
  { key: "inner", size: "h-[116px] w-[54px]", radius: "rounded-[21.6px]", peak: "opacity-[0.55]", animation: "motion-safe:animate-tire-pulse-inner" },
] as const;

export function TirePulse({
  status,
  children,
  className,
}: {
  status: TireStatus;
  /** 펄스 위에 겹쳐 표시할 타이어 그래픽(이미지/아이콘 등). */
  children?: ReactNode;
  className?: string;
}) {
  const isActive = status === "CAUTION" || status === "WARNING";

  return (
    <div
      className={`relative h-[108px] w-[108px] ${className ?? ""}`}
      aria-hidden="true"
    >
      {isActive ? (
        <>
          {PULSE_LAYERS.map((layer) => (
            <span
              key={layer.key}
              className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 ${layer.size} ${layer.radius} ${layer.peak} ${PULSE_TRANSLUCENT_BG[status]} ${layer.animation}`}
            />
          ))}
          {/* 코어: 불투명 단색, 확대 없이 페이드인만. */}
          <span
            className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[96px] w-[34px] rounded-[12px] ${PULSE_CORE_BG[status]} motion-safe:animate-tire-pulse-core`}
          />
        </>
      ) : null}
      {children ? (
        <div className="absolute inset-0 flex items-center justify-center">{children}</div>
      ) : null}
    </div>
  );
}
