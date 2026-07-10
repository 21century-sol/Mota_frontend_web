import type { ReactNode } from "react";

/** 360px 모바일 프레임 셸 (모든 스텝 공통) */
export function MobileShell({ children }: { children: ReactNode }) {
  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[360px] flex-col bg-white">
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
    </div>
  );
}
