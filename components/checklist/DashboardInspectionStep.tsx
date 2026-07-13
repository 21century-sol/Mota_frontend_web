"use client";

import { useState } from "react";
import {
  InspectionScaffold,
  type ItemAnswer,
  ItemLabel,
  ItemStack,
  MemoInput,
  PhotoAttach,
  StatusToggle,
  type ToggleValue,
} from "./inspection";
import WarningModal from "./WarningModal";

interface Props {
  onBack?: () => void;
  /** 답변 2개(연료량, 경고등) 순서대로 전달 후 제출 */
  onSubmit?: (answers: ItemAnswer[]) => void;
}

export default function DashboardInspectionStep({ onBack, onSubmit }: Props) {
  const [fuelPhoto, setFuelPhoto] = useState<File | null>(null);
  const [fuelMemo, setFuelMemo] = useState("");
  const [warnToggle, setWarnToggle] = useState<ToggleValue>(null);
  const [warnMemo, setWarnMemo] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <InspectionScaffold
        percent={75}
        title="계기판 점검"
        subtitle="시동을 켜고 계기판 상태를 확인하세요."
        onBack={onBack}
        canProceed={fuelPhoto !== null && warnToggle !== null}
        onNext={() =>
          onSubmit?.([
            { abnormal: false, text: fuelMemo, photo: fuelPhoto },
            { abnormal: warnToggle === "bad", text: warnMemo, photo: null },
          ])
        }
        footerLabel="최종 제출"
      >
        <ItemStack>
          {/* 연료량 사진 업로드 */}
          <div className="flex flex-col gap-[18px]">
            <ItemLabel label="연료량 사진 업로드" />
            <div className="flex flex-col gap-3">
              <PhotoAttach
                file={fuelPhoto}
                onPick={setFuelPhoto}
                onClear={() => setFuelPhoto(null)}
              />
              <MemoInput value={fuelMemo} onChange={setFuelMemo} />
            </div>
          </div>

          {/* 경고등 이상 확인 */}
          <div className="flex flex-col gap-[18px]">
            <ItemLabel label="경고등 이상 확인" />
            <div className="flex flex-col gap-3">
              <StatusToggle
                value={warnToggle}
                onChange={(v) => {
                  setWarnToggle(v);
                  if (v === "bad") setModalOpen(true);
                }}
              />
              <MemoInput value={warnMemo} onChange={setWarnMemo} />
            </div>
          </div>
        </ItemStack>
      </InspectionScaffold>
      {modalOpen && (
        <WarningModal itemLabel="경고등" onClose={() => setModalOpen(false)} />
      )}
    </>
  );
}
