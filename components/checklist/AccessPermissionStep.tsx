"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

  const infoText = "접근 권한은 휴대폰 [설정]에서 언제든지 변경할 수 있습니다.";

  return (
    <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-[360px] flex-col bg-white">
      {/* 제목 */}
      <h1 className="px-4 pt-[84px] text-[24px] font-bold leading-[1.5] text-black">
        접근 권한 설정 안내
      </h1>

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
                <div className="flex size-7 shrink-0 items-center justify-center rounded-[8px] bg-[#ff801a]">
                  {/* Figma ◉(FISHEYE) 글리프 재현: 흰 디스크 + 얇은 주황 링 */}
                  <svg width="15" height="15" viewBox="0 0 16 16" aria-hidden>
                    <circle cx="8" cy="8" r="6" fill="#fff" />
                    <circle
                      cx="8"
                      cy="8"
                      r="3.7"
                      fill="none"
                      stroke="#ff801a"
                      strokeWidth="1.3"
                    />
                  </svg>
                </div>
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
      <div className="mt-auto px-4 pb-[36px] pt-4">
        <button
          type="button"
          disabled={state === "requesting"}
          onClick={() => (granted ? onGranted?.() : requestCamera())}
          className={`flex h-[58px] w-full items-center justify-center rounded-btn text-[16px] font-semibold leading-[1.5] ${
            granted ? "bg-brand text-white" : "bg-btn-basic text-text-disabled"
          }`}
        >
          {state === "requesting" ? "요청 중…" : "허용"}
        </button>
      </div>
    </main>
  );
}
