"use client";

import { useState } from "react";
import { BottomButton, MobileShell, StepTitle } from "./ui";

interface Props {
  /** 유효한 번호로 '다음'을 누르면 호출 (하이픈 포함 문자열) */
  onNext?: (phoneNumber: string) => void;
}

/** 숫자만 추출해 010-0000-0000 형태로 포맷 */
function formatPhone(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 11);
  if (d.length < 4) return d;
  if (d.length < 8) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

function isValid(value: string): boolean {
  const d = value.replace(/\D/g, "");
  return /^01[016789]\d{7,8}$/.test(d);
}

export default function PhoneNumberStep({ onNext }: Props) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const valid = isValid(value);
  const active = focused || value.length > 0;

  return (
    <MobileShell>
      <StepTitle className="pt-[76px]">
        리포트 받을
        <br />
        번호를 입력해 주세요
      </StepTitle>

      {/* 입력 그룹 */}
      <div className="mt-[36px] flex flex-col gap-4 px-4">
        <div className="flex flex-col gap-[6px]">
          <label
            htmlFor="phone"
            className="px-2 text-[14px] font-medium leading-[1.5] text-text-sub"
          >
            연락처(전화번호)
          </label>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            value={value}
            onChange={(e) => setValue(formatPhone(e.target.value))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="010-0000-0000"
            className="h-[58px] w-full rounded-[12px] border border-solid bg-white px-4 text-[16px] font-medium leading-[1.5] text-brand outline-none placeholder:text-[#c5c5c5]"
            style={{
              // Figma: 값이 있거나(=입력됨) 포커스 시 활성 디자인(보라 테두리 + shadow)
              borderColor: active ? "#828aff" : "#e7e7e8",
              boxShadow: active
                    ? "0px 0px 18px 0px rgba(90,70,250,0.05)"
                    : "none",
            }}
          />
        </div>

        {/* Figma 디자인의 줄바꿈 위치에 맞춤 (발송 완료 후 ↵ 번호는) */}
        <p className="text-[13px] font-normal leading-[18.2px] text-[#808080]">
          입력하신 번호로 타이어 리포트가 1회 발송됩니다. 발송 완료 후
          <br />
          번호는 지체 없이 파기됩니다.
        </p>
      </div>

      {/* 다음 버튼 */}
      <BottomButton
        active={valid}
        disabled={!valid}
        onClick={() => valid && onNext?.(value)}
      >
        다음
      </BottomButton>
    </MobileShell>
  );
}
