"use client";

import { useRef, useState, type ReactNode } from "react";
import { ActionButton, MobileShell } from "./ui";
import {
  CameraIcon,
  CheckIcon,
  CircleCheckIcon,
  WarningIcon,
} from "./inspection-icons";

/** 상단 진행바 (bg #ccced5, 채움 #5a46fa, h10 rounded, w328) */
export function ProgressBar({ percent }: { percent: number }) {
  return (
    <div className="mt-[16px] px-4">
      <div className="h-[10px] w-full overflow-hidden rounded-full bg-[#ccced5]">
        <div
          className="h-[10px] rounded-full bg-brand"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/** 뒤로가기 헤더 (GNB h64, CaretLeft 24 @ left16 top20) */
export function BackHeader({ onBack }: { onBack?: () => void }) {
  return (
    <div className="relative h-16 w-full shrink-0">
      <button
        type="button"
        onClick={onBack}
        aria-label="뒤로"
        className="absolute left-4 top-5"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/back-arrow.svg" alt="" className="size-6" aria-hidden />
      </button>
    </div>
  );
}

/** 점검 화면 제목 (SemiBold 24 lh1.4) + 부제 (Medium 16 lh1.5) */
export function InspectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mt-[32px] flex flex-col gap-3 px-4">
      <h1 className="text-[24px] font-semibold leading-[1.4] text-black">
        {title}
      </h1>
      <p className="text-[16px] font-medium leading-[1.5] text-black">
        {subtitle}
      </p>
    </div>
  );
}

/** 하단 고정 푸터: 안내문구 + 다음 버튼 */
export function InspectionFooter({
  hint = "모든 항목을 체크해 주세요",
  active,
  onNext,
  label = "다음",
}: {
  hint?: string;
  active: boolean;
  onNext?: () => void;
  label?: string;
}) {
  return (
    <div className="mt-auto flex flex-col items-center gap-3 px-4 pb-[36px] pt-4">
      <p className="w-full text-center text-[12px] font-medium leading-[1.5] text-[rgba(68,70,78,0.42)]">
        {hint}
      </p>
      <ActionButton active={active} disabled={!active} onClick={onNext}>
        {label}
      </ActionButton>
    </div>
  );
}

/** "확인해 주세요!" 섹션 배지 (원형체크 + 안내 + 설명) — 외관 점검용 */
export function SectionBadge({ desc }: { desc: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <CircleCheckIcon className="shrink-0" />
        <p className="text-[12px] font-medium leading-[1.5] text-[#7b7c7e]">
          확인해 주세요!
        </p>
      </div>
      <p className="text-[14px] font-medium leading-[1.5] text-[#7b7c7e]">
        {desc}
      </p>
    </div>
  );
}

/** 필수 배지 (빨강 pill) */
export function RequiredBadge() {
  return (
    <span className="flex items-center justify-center rounded-full bg-[rgba(254,61,22,0.2)] px-2 py-[2px] text-[11px] font-semibold leading-[1.5] text-[#fe3d16]">
      필수
    </span>
  );
}

/** 점검 항목 라벨 (SemiBold 14) + 선택적 필수 배지 — 라이트/계기판용 */
export function ItemLabel({
  label,
  required,
}: {
  label: string;
  required?: boolean;
}) {
  return (
    <div className="flex w-full items-center pr-6">
      <div className="flex items-center gap-2">
        <p className="whitespace-nowrap text-[14px] font-semibold leading-[1.5] text-black">
          {label}
        </p>
        {required && <RequiredBadge />}
      </div>
    </div>
  );
}

/** 사진 첨부 (기본: 점선 박스 / 첨부됨: 썸네일 + 삭제) */
export function PhotoAttach({
  file,
  onPick,
  onClear,
}: {
  file: File | null;
  onPick: (f: File) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useRef<string | null>(null);

  if (file) {
    if (!previewUrl.current) previewUrl.current = URL.createObjectURL(file);
    return (
      <div className="flex h-[100px] w-full items-center gap-3 rounded-[12px] border border-solid border-[#e7e7e8] bg-[#fafafa] p-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={previewUrl.current}
          alt="첨부 사진"
          className="h-full w-[120px] shrink-0 rounded-[8px] object-cover"
        />
        <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#525252]">
          {file.name}
        </p>
        <button
          type="button"
          onClick={() => {
            previewUrl.current = null;
            onClear();
          }}
          aria-label="사진 삭제"
          className="mr-1 shrink-0 text-[18px] text-[#9aa0a6]"
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <label className="relative flex h-[100px] w-full cursor-pointer flex-col items-center justify-center rounded-[12px] bg-[#fafafa] p-2">
      {/* Figma 대시 패턴 재현 (CSS border-dashed는 대시/갭 제어 불가).
          viewBox 없이 px 단위 → 폭이 바뀌어도 대시 길이 일정(반응형) */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        fill="none"
        aria-hidden
      >
        <rect
          x="0.5"
          y="0.5"
          rx="11.5"
          stroke="#e7e7e8"
          strokeWidth="1"
          strokeDasharray="6 5"
          style={{ width: "calc(100% - 1px)", height: "calc(100% - 1px)" }}
        />
      </svg>
      <div className="relative flex items-center justify-center gap-1">
        <CameraIcon className="shrink-0" />
        <span className="text-[13px] font-medium leading-[1.5] text-[#525252]">
          사진 첨부
        </span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
        }}
      />
    </label>
  );
}

export type ToggleValue = "ok" | "bad" | null;

/** 점검 항목 1개의 답변 (질문 1개에 대응) */
export interface ItemAnswer {
  abnormal: boolean;
  text: string;
  photo: File | null;
}

/** 이상 없음 / 이상 있음 토글 */
export function StatusToggle({
  value,
  onChange,
}: {
  value: ToggleValue;
  onChange: (v: ToggleValue) => void;
}) {
  const ok = value === "ok";
  const bad = value === "bad";
  return (
    <div className="flex w-full items-center gap-2">
      <button
        type="button"
        onClick={() => onChange("ok")}
        className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] border border-solid p-2"
        style={{
          backgroundColor: ok ? "rgba(2,194,101,0.1)" : "#fafafa",
          borderColor: ok ? "#02c265" : "#e7e7e8",
        }}
      >
        <span className="flex items-center justify-center gap-1">
          <CheckIcon className="shrink-0" color={ok ? "#02c265" : "#525252"} />
          <span
            className="text-[13px] font-medium leading-[1.5]"
            style={{ color: ok ? "#02c265" : "#525252" }}
          >
            이상 없음
          </span>
        </span>
      </button>
      <button
        type="button"
        onClick={() => onChange("bad")}
        className="flex h-[48px] flex-1 items-center justify-center rounded-[12px] border border-solid p-2"
        style={{
          backgroundColor: bad ? "rgba(254,61,22,0.1)" : "#fafafa",
          borderColor: bad ? "#fe3d16" : "#e7e7e8",
        }}
      >
        <span className="flex items-center justify-center gap-1">
          <WarningIcon className="shrink-0" color={bad ? "#fe3d16" : "#525252"} />
          <span
            className="text-[13px] font-medium leading-[1.5]"
            style={{ color: bad ? "#fe3d16" : "#525252" }}
          >
            이상 있음
          </span>
        </span>
      </button>
    </div>
  );
}

/** 특이사항 메모 입력 (h40, 선택) */
export function MemoInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder="특이사항 메모 (선택)"
      className="h-[40px] w-full rounded-[12px] border border-solid border-[#e7e7e8] bg-white px-[18px] text-[12px] font-normal leading-[1.4] text-[rgba(19,20,23,0.9)] outline-none placeholder:text-[rgba(19,20,23,0.64)]"
    />
  );
}

/** 점검 화면 공통 셸 (뒤로 + 진행바 + 헤더 + 콘텐츠 + 푸터) */
export function InspectionScaffold({
  percent,
  title,
  subtitle,
  onBack,
  canProceed,
  onNext,
  footerLabel,
  children,
}: {
  percent: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  canProceed: boolean;
  onNext?: () => void;
  footerLabel?: string;
  children: ReactNode;
}) {
  return (
    <MobileShell>
      <BackHeader onBack={onBack} />
      <ProgressBar percent={percent} />
      <InspectionHeader title={title} subtitle={subtitle} />
      <div className="mt-[42px] px-4">{children}</div>
      <InspectionFooter active={canProceed} onNext={onNext} label={footerLabel} />
    </MobileShell>
  );
}

/** 여러 점검 항목을 세로로 쌓는 컨테이너 (gap-40) */
export function ItemStack({ children }: { children: ReactNode }) {
  return <div className="flex flex-col gap-10">{children}</div>;
}

/** 상태 관리 훅: 항목별 toggle/memo/photo */
export function useInspectionState() {
  const [toggles, setToggles] = useState<Record<string, ToggleValue>>({});
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<Record<string, File | null>>({});
  return {
    toggles,
    memos,
    photos,
    setToggle: (k: string, v: ToggleValue) =>
      setToggles((p) => ({ ...p, [k]: v })),
    setMemo: (k: string, v: string) => setMemos((p) => ({ ...p, [k]: v })),
    setPhoto: (k: string, v: File | null) =>
      setPhotos((p) => ({ ...p, [k]: v })),
  };
}
