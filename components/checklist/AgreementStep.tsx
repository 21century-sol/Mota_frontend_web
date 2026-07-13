"use client";

import { useState } from "react";
import { CheckboxIcon, CaretRightIcon } from "./icons";
import { BottomButton, MobileShell, StepTitle } from "./ui";

export interface AgreementValues {
  termsOfServiceAgreed: boolean;
  privacyAgreed: boolean;
  reportSmsAgreed: boolean;
  marketingAgreed: boolean;
}

/** 약관 상세: 섹션 제목(SemiBold) + 본문(Regular) 또는 불릿 리스트 */
interface DetailSection {
  heading: string;
  body?: string;
  bullets?: string[];
}

interface AgreementItem {
  key: keyof AgreementValues;
  label: string;
  required: boolean;
  detail?: DetailSection[];
}

const TERMS_OF_SERVICE: DetailSection[] = [
  {
    heading: "동의 목적",
    body: " 회원이 서비스를 이용함에 있어 (주)모타와 회원 간의 권리, 의무 및 책임사항, 서비스 이용 조건 및 절차 등을 규정한 이용약관에 대한 동의",
  },
  {
    heading: "주요 내용",
    bullets: [
      "서비스의 정의 및 제공 범위",
      "회원가입 절차 및 자격, 회원의 의무·금지행위",
      "서비스 이용 제한·정지·계약 해지",
      "회사의 의무 및 면책조항",
      "유료 서비스 결제·환불·청약철회 (해당 시)",
      "지식재산권 귀속, 분쟁 해결 및 관할 법원",
    ],
  },
  {
    heading: "거부 권리 및 불이익",
    body: " 동의 거부 권리가 있으나, 동의하지 않을 경우 회원가입 및 서비스 이용이 제한됩니다.",
  },
];

const PRIVATE: DetailSection[] = [
  {
    heading: "수집 목적",
    body: " 회원 식별·본인 확인, 서비스 제공 및 계약 이행, 고객 문의 응대",
  },
  { heading: "수집 항목", body: " 휴대전화번호" },
  {
    heading: "보유 및 이용 기간",
    body: " 관계 법령에 따라 보존이 필요한 경우 해당 기간 동안 보관",
  },
  {
    heading: "거부 권리 및 불이익",
    body: " 동의 거부 권리가 있으나, 본 항목은 서비스 제공에 필요한 필수 정보로 동의하지 않을 경우 회원가입 및 서비스 이용이 제한됩니다.",
  },
];

const REPORT_SMS: DetailSection[] = [
  {
    heading: "수집·이용 목적",
    body: " 레포트 결과 안내, 서비스 관련 중요 안내(처리 상태 등)",
  },
  { heading: "전송 방법", body: " 휴대전화 문자로 (SMS/LMS) 리포트 링크 전송" },
  { heading: "보유 및 이용 기간", body: " 회원 탈퇴 시 또는 서비스 이용 종료 시까지" },
  {
    heading: "거부 권리 및 불이익",
    body: " 본 항목은 레포트 결과 안내라는 핵심 서비스와 직접 관련되어 필수 동의 항목이며, 동의하지 않을 경우 레포트 안내를 받을 수 없어 서비스 이용이 제한될 수 있습니다.",
  },
];

const MARKETING: DetailSection[] = [
  {
    heading: "수집·이용 목적",
    body: " 이벤트·할인·프로모션 등 광고성 정보 안내, 신규 서비스 소개",
  },
  { heading: "수집 항목", body: " 휴대전화번호 (수신 채널에 따라 상이)" },
  { heading: "전송 방법", body: " 문자메시지(SMS/LMS)" },
  { heading: "보유 및 이용 기간", body: " 동의 철회 시 또는 회원 탈퇴 시까지" },
  {
    heading: "거부 권리 및 불이익",
    body: " 동의하지 않아도 서비스 이용에 제한이 없으며, 동의 후에도 [마이페이지 > 알림 설정] 등을 통해 언제든 수신 거부(철회)가 가능합니다.",
  },
];

const ITEMS: AgreementItem[] = [
  { key: "termsOfServiceAgreed", label: "서비스 이용약관 동의", required: true, detail: TERMS_OF_SERVICE }, // prettier-ignore
  { key: "privacyAgreed", label: "개인정보 수집·이용", required: true, detail: PRIVATE }, // prettier-ignore
  { key: "reportSmsAgreed", label: "레포트 문자(알림) 수신", required: true, detail: REPORT_SMS }, // prettier-ignore
  { key: "marketingAgreed", label: "마케팅 정보 수신", required: false, detail: MARKETING }, // prettier-ignore
];

const REQUIRED_KEYS = ITEMS.filter((i) => i.required).map((i) => i.key);

/** 약관 상세 본문 렌더 (섹션 제목 SemiBold + 본문/불릿, 256px 중앙) */
function DetailBody({ sections }: { sections: DetailSection[] }) {
  return (
    <div className="flex justify-center px-6 py-3">
      <div className="w-[256px] text-[12px] leading-[1.5] text-[#a4a8ae]">
        {sections.map((s, i) => (
          <div key={i}>
            {i > 0 && <p className="leading-[1.5]">&nbsp;</p>}
            <p className="font-semibold leading-[1.5]">{s.heading}</p>
            {s.body && <p className="font-normal leading-[1.5]">{s.body}</p>}
            {s.bullets && (
              <ul className="list-disc">
                {s.bullets.map((b, j) => (
                  <li
                    key={j}
                    className="ms-[18px] font-normal leading-[1.5]"
                  >
                    {b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

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
    <MobileShell>
      <StepTitle className="pt-[84px]">
        서비스 이용을 위해
        <br />
        약관에 동의해 주세요.
      </StepTitle>

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

              {item.detail && open && <DetailBody sections={item.detail} />}
            </div>
          );
        })}
      </div>

      {/* 확인 버튼 */}
      <BottomButton
        active={canConfirm}
        disabled={!canConfirm}
        onClick={() => canConfirm && onConfirm?.(values)}
      >
        확인
      </BottomButton>
    </MobileShell>
  );
}
