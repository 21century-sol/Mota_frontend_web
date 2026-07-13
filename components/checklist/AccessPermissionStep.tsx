"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BottomButton, MobileShell, StepTitle } from "./ui";

type PermState = "idle" | "requesting" | "granted" | "denied" | "nodevice";

interface Props {
  /** 카메라 권한이 허용된 뒤 '허용' 버튼을 누르면 호출 (다음 단계로 진행) */
  onGranted?: () => void;
}

export default function AccessPermissionStep({ onGranted }: Props) {
  const [state, setState] = useState<PermState>("idle");
  const granted = state === "granted";

  const requestCamera = useCallback(async () => {
    setState((s) => (s === "requesting" ? s : "requesting"));
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      // 권한 확인만 목적이므로 즉시 트랙 정지 (카메라 끔)
      stream.getTracks().forEach((t) => t.stop());
      setState("granted");
    } catch (err) {
      const name = err instanceof DOMException ? err.name : "";
      setState(
        name === "NotFoundError" || name === "DevicesNotFoundError"
          ? "nodevice"
          : "denied",
      );
    }
  }, []);

  // 페이지 진입 즉시 카메라 권한 요청 (브라우저 권한 팝업이 바로 뜸)
  const autoTried = useRef(false);
  useEffect(() => {
    if (autoTried.current) return;
    autoTried.current = true;
    requestCamera();
  }, [requestCamera]);

  const infoText =
    "브라우저 주소창의 [사이트 설정]에서 [카메라 권한]을 [허용]으로 변경해 주세요.";

  return (
    <MobileShell>
      <StepTitle className="pt-[84px]">접근 권한 설정 안내</StepTitle>

      {/* 콘텐츠 */}
      <div className="mt-[64px] flex flex-col px-4">
        {/* 섹션: 필수 접근 권한 */}
        <div className="flex flex-col">
          <p className="text-[16px] font-bold leading-[1.5] text-text-strong">
            필수 접근 권한
          </p>

          {/* 카메라 권한 행 */}
          <div className="flex flex-col py-[18px]">
            <div className="flex w-full items-center gap-[10px]">
              <div className="flex items-center gap-[10px]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/camera.svg"
                  alt=""
                  className="size-7 shrink-0"
                  aria-hidden
                />
                <p className="text-[16px] font-bold leading-[1.5] text-text-strong">
                  카메라
                </p>
              </div>
              <p className="whitespace-nowrap text-[14px] font-medium leading-[1.4] text-text-sub">
                차량 외부 사진 찍을 때
              </p>
            </div>
          </div>
        </div>

        {/* 안내 박스 */}
        <div className="rounded-[12px] bg-[rgba(90,70,250,0.05)] px-6 py-5">
          <p className="text-[13px] font-normal leading-[1.4] text-text-sub">
            {infoText}
          </p>
        </div>
      </div>

      {/* 허용 버튼: 카메라 허용 전엔 비활성, 허용 후에만 활성 */}
      <BottomButton
        active={granted}
        disabled={state === "requesting"}
        onClick={() => (granted ? onGranted?.() : requestCamera())}
      >
        {state === "requesting" ? "요청 중…" : "허용"}
      </BottomButton>
    </MobileShell>
  );
}
