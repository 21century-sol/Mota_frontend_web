import type { ReactNode } from "react";

/**
 * 모바일 화면 셸 (모든 스텝 공통)
 * - 폭: 화면을 꽉 채워 콘텐츠는 좌우 가장자리에서 16px(px-4) — Figma와 동일.
 * - 상단: Figma 상태바 영역(36px)만큼 여백 확보 → 모든 요소가 Figma Y좌표와 일치.
 *   실기기 노치는 safe-area로 더 밀어냄.
 */
export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative flex min-h-[100dvh] w-full flex-col bg-white"
      style={{ paddingTop: "max(36px, env(safe-area-inset-top))" }}
    >
      {children}
    </main>
  );
}

/** 스텝 제목 (Asta Sans Bold 24). paddingTop은 화면마다 다르므로 className으로 전달 */
export function StepTitle({
  className = "",
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <h1
      className={`px-4 text-[24px] font-bold leading-[1.5] text-black ${className}`}
    >
      {children}
    </h1>
  );
}

/** 액션 버튼 본체 (h58 · rounded18 · SemiBold16). active=브랜드색 / 아니면 회색 */
export function ActionButton({
  active,
  disabled,
  onClick,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex h-[58px] w-full items-center justify-center rounded-btn text-[16px] font-semibold leading-[1.5] ${
        active ? "bg-brand text-white" : "bg-btn-basic text-text-disabled"
      }`}
    >
      {children}
    </button>
  );
}

/** 하단 고정 액션 버튼 (약관 '확인' / 접근권한 '허용' / 전화번호 '다음' 공통) */
export function BottomButton({
  active,
  disabled,
  onClick,
  children,
}: {
  /** 활성(브랜드색) 여부 — 시각 스타일 */
  active: boolean;
  /** 클릭 비활성화 여부 — 스타일과 별개 (예: 요청 중) */
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="mt-auto px-4 pb-[36px] pt-4">
      <ActionButton active={active} disabled={disabled} onClick={onClick}>
        {children}
      </ActionButton>
    </div>
  );
}
