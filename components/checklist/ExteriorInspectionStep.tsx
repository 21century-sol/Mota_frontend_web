"use client";

import { useState } from "react";
import {
  InspectionScaffold,
  MemoInput,
  PhotoAttach,
  SectionBadge,
  StatusToggle,
  type ToggleValue,
} from "./inspection";

interface Props {
  onBack?: () => void;
  onNext?: () => void;
}

export default function ExteriorInspectionStep({ onBack, onNext }: Props) {
  const [toggle, setToggle] = useState<ToggleValue>(null);
  const [memo, setMemo] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);

  return (
    <InspectionScaffold
      percent={25}
      title="외관 상태 점검"
      subtitle="차량 외부를 사진 찍어 업로드해주세요."
      onBack={onBack}
      canProceed={photo !== null && toggle !== null}
      onNext={onNext}
    >
      <div className="flex flex-col gap-[18px]">
        <SectionBadge desc="긁힘·찍힘·균열" />
        <div className="flex flex-col gap-3">
          <PhotoAttach
            file={photo}
            onPick={setPhoto}
            onClear={() => setPhoto(null)}
          />
          <StatusToggle value={toggle} onChange={setToggle} />
          <MemoInput value={memo} onChange={setMemo} />
        </div>
      </div>
    </InspectionScaffold>
  );
}
