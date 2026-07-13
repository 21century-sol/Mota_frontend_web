"use client";

import { ActionButton, MobileShell } from "./ui";

export interface VehicleInfo {
  model: string;
  plateNumber: string;
  modelYear: string;
}

const DEFAULT_VEHICLE: VehicleInfo = {
  model: "현대 그랜저 IG",
  plateNumber: "12가 3456",
  modelYear: "2022년"
};

interface Props {
  vehicle?: VehicleInfo;
  onStart?: () => void;
  onInquiry?: () => void;
}

export default function VehicleInfoStep({
  vehicle = DEFAULT_VEHICLE,
  onStart,
  onInquiry,
}: Props) {
  const rows: [string, string][] = [
    ["차량 모델", vehicle.model],
    ["차량번호", vehicle.plateNumber],
    ["연식", vehicle.modelYear]
  ];

  return (
    <MobileShell>
      {/* 제목 + 부제 */}
      <div className="flex flex-col gap-3 px-4 pt-[84px]">
        <h1 className="text-[24px] font-bold leading-[1.5] text-black">
          차량 인수 점검
        </h1>
        <p className="text-[16px] font-medium leading-[1.5] text-black">
          출발 전 차량 상태를 함께 확인해 주세요
        </p>
      </div>

      {/* 차량 정보 카드 */}
      <div className="mt-[36px] px-4">
        <div className="flex flex-col rounded-[18px] bg-[#f1f3f7]">
          {rows.map(([label, val]) => (
            <div
              key={label}
              className="flex items-center justify-between px-6 py-[18px]"
            >
              <span className="w-[160px] text-[14px] font-medium leading-[1.5] text-[#7b8696]">
                {label}
              </span>
              <span className="text-right text-[14px] font-semibold leading-[1.5] text-black">
                {val}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 하단: 문의하기 + 점검 시작 */}
      <div className="mt-auto flex flex-col items-center gap-3 px-4 pb-[36px] pt-4">
        <p className="flex items-center gap-1.5 text-[12px] font-medium leading-[1.5]">
          <span className="text-[rgba(68,70,78,0.42)]">정보가 다르나요?</span>
          <button
            type="button"
            onClick={onInquiry}
            className="text-[rgba(68,70,78,0.6)] underline"
          >
            고객센터 연결하기
          </button>
        </p>
        <ActionButton active onClick={onStart}>
          점검 시작
        </ActionButton>
      </div>
    </MobileShell>
  );
}
