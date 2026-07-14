"use client";

import { ProgressBar } from "./inspection";
import { MobileShell } from "./ui";

export default function AlreadySubmittedStep() {
  return (
    <MobileShell>
      <div className="h-16 shrink-0" />
      <ProgressBar percent={0} />
      <div className="mt-[75px] flex flex-col items-center px-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/already-submitted.png"
          alt=""
          className="h-[234px] w-[263px] object-contain mix-blend-luminosity"
        />
        <div className="mt-[10px] flex flex-col items-center gap-3 text-center">
          <p className="text-[24px] font-bold leading-[1.4] text-black">
            이미 제출이 완료되었습니다
          </p>
          <p className="text-[16px] font-medium leading-[1.5] text-black">
            중복 제출은 불가능합니다
          </p>
        </div>
      </div>
    </MobileShell>
  );
}
