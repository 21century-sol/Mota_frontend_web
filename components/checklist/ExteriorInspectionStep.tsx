"use client";

import { useState } from "react";
import {
  InspectionScaffold,
  type ItemAnswer,
  MemoInput,
  PhotoAttachMulti,
  SectionBadge,
  StatusToggle,
  type ToggleValue,
} from "./inspection";

interface Props {
  onBack?: () => void;
  /** 답변 1개(긁힘·찍힘·균열) 전달 */
  onNext?: (answers: ItemAnswer[]) => void;
}

export default function ExteriorInspectionStep({ onBack, onNext }: Props) {
  const [toggle, setToggle] = useState<ToggleValue>(null);
  const [memo, setMemo] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);

  return (
    <InspectionScaffold
      percent={25}
      title="외관 상태 점검"
      subtitle={"차량 외부를 촬영한 후 사진을 업로드해 주세요.\n(최대 6장 업로드 가능)"}
      onBack={onBack}
      canProceed={photos.length > 0 && toggle !== null}
      onNext={() =>
        onNext?.([{ abnormal: toggle === "bad", text: memo, photos }])
      }
    >
      <div className="flex flex-col gap-[18px]">
        <SectionBadge desc="긁힘·찍힘·균열" />
        <div className="flex flex-col gap-3">
          <PhotoAttachMulti
            files={photos}
            onAdd={(f) => setPhotos((p) => [...p, ...f])}
            onRemove={(i) => setPhotos((p) => p.filter((_, idx) => idx !== i))}
          />
          <StatusToggle value={toggle} onChange={setToggle} />
          <MemoInput value={memo} onChange={setMemo} />
        </div>
      </div>
    </InspectionScaffold>
  );
}
