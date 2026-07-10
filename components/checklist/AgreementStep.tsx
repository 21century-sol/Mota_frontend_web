"use client";

import { useState } from "react";
import { CheckboxIcon, CaretRightIcon } from "./icons";

export interface AgreementValues {
  termsOfServiceAgreed: boolean;
  privacyAgreed: boolean;
  reportSmsAgreed: boolean;
  marketingAgreed: boolean;
}

interface AgreementItem {
  key: keyof AgreementValues;
  label: string;
  required: boolean;
  detail?: string;
}

const DETAIL_TEXT =
    "[필수] 타이어 리포트 서비스 이용약관에 동의합니다.\n\n 본 서비스는 렌터카 이용 중 측정된 타이어 공기압·온도 데이터를 바탕으로 요약 리포트를 제공합니다. 제공되는 정보는 참고용이며, 실제 타이어 점검·정비를 대체하지 않습니다. 센서 오류나 통신 상태에 따라 실제와 다를 수 있으며, 본 서비스는 측정값의 정확성을 보증하지 않습니다.";

const ITEMS: AgreementItem[] = [
  { key: "termsOfServiceAgreed", label: "서비스 이용약관 동의", required: true, detail: DETAIL_TEXT },
  { key: "privacyAgreed", label: "개인정보 수집·이용", required: true, detail: DETAIL_TEXT },
  { key: "reportSmsAgreed", label: "레포트 문자(알림) 수신", required: true, detail: DETAIL_TEXT },
  { key: "marketingAgreed", label: "마케팅 정보 수신", required: false, detail: DETAIL_TEXT },
];

const REQUIRED_KEYS = ITEMS.filter((i) => i.required).map((i) => i.key);

interface Props {
  onConfirm?: (values: AgreementValues) => void;
}

export default function AgreementStep({ onConfirm }: Props) {
  const [values, setValues] = useState<AgreementValues>({
    termsOfServiceAgreed: false,
    privacyAgreed: false,
    reportSmsAgreed: false,
    marketingAgreed: false,
  });
  const [openKey, setOpenKey] = useState<keyof AgreementValues | null>(null);

  const allChecked = ITEMS.every((i) => values[i.key]);
  const canConfirm = REQUIRED_KEYS.every((k) => values[k]);

  function toggleAll() {
    const next = !allChecked;
    setValues({
      termsOfServiceAgreed: next,
      privacyAgreed: next,
      reportSmsAgreed: next,
      marketingAgreed: next,
    });
  }

  function toggle(key: keyof AgreementValues) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[360px] flex-col bg-white">
      {/* 제목 */}
      <h1 className="px-4 pt-[84px] text-[24px] font-bold leading-[1.5] text-black">
        서비스 이용을 위해
        <br />
        약관에 동의해 주세요.
      </h1>

      {/* 약관 전체 동의 */}
      <div className="px-4 pt-[35px]">
        <button
          type="button"
          onClick={toggleAll}
          className={`flex w-full items-center gap-[10px] rounded-card px-6 py-[18px] text-left ${
            allChecked ? "bg-brand-soft" : "bg-fill-card"
          }`}
        >
          <CheckboxIcon checked={allChecked} size={26} className="shrink-0" />
          <span className="text-[16px] font-bold leading-[1.5] text-text-strong">
            약관 전체 동의
          </span>
        </button>
      </div>

      {/* 개별 항목 */}
      <div className="px-4">
        {ITEMS.map((item) => {
          const checked = values[item.key];
          const open = openKey === item.key;
          return (
            <div key={item.key}>
              <div className="flex items-center justify-between px-6 py-3">
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => toggle(item.key)}
                    aria-label={item.label}
                  >
                    <CheckboxIcon checked={checked} size={24} className="shrink-0" />
                  </button>
                  <div className="flex items-center gap-1 leading-[26px] tracking-[-0.3px]">
                    <span className="text-[14px] font-medium text-text-body">
                      {item.label}
                    </span>
                    <span className="text-[12px] font-normal text-text-sub">
                      ({item.required ? "필수" : "선택"})
                    </span>
                  </div>
                </div>
                {item.detail && (
                  <button
                    type="button"
                    onClick={() => setOpenKey(open ? null : item.key)}
                    aria-label="약관 상세 보기"
                    className="flex size-3 items-center justify-center"
                  >
                    <CaretRightIcon open={open} />
                  </button>
                )}
              </div>

              {item.detail && open && (
                <div className="flex justify-center px-6 py-3">
                  <p className="w-[256px] whitespace-pre-wrap text-[12px] font-normal leading-[1.5] text-text-disabled">
                    {item.detail}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 확인 버튼 */}
      <div className="mt-auto px-4 pb-[36px] pt-4">
        <button
          type="button"
          disabled={!canConfirm}
          onClick={() => canConfirm && onConfirm?.(values)}
          className={`flex h-[58px] w-full items-center justify-center rounded-btn text-[16px] font-semibold leading-[1.5] ${
            canConfirm
              ? "bg-brand text-white"
              : "bg-btn-basic text-text-disabled"
          }`}
        >
          확인
        </button>
      </div>
    </main>
  );
}
