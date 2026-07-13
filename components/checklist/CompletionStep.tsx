"use client";

import { ProgressBar } from "./inspection";
import { MobileShell } from "./ui";

export default function CompletionStep() {
  return (
    <MobileShell>
      <div className="h-16 shrink-0" />
      <ProgressBar percent={100} />
      <div className="mt-[75px] flex flex-col items-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/completion-check.png"
          alt=""
          className="h-[234px] w-[263px] object-contain"
        />
        <div className="mt-[10px] flex flex-col items-center gap-3 text-center">
          <p className="text-[24px] font-bold leading-[1.4] text-black">
            점검이 완료되었습니다
          </p>
          <p className="text-[16px] font-medium leading-[1.5] text-black">
            안전한 여행 되세요!
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
