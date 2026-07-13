"use client";

import { useState } from "react";
import {
  InspectionScaffold,
  ItemLabel,
  ItemStack,
  MemoInput,
  StatusToggle,
  type ToggleValue,
} from "./inspection";
import WarningModal from "./WarningModal";

const ITEMS = [
  {
    key: "headlight",
    label: "전조등 정상 작동 확인",
    required: false,
    modalName: "전조등",
  },
  {
    key: "turnSignal",
    label: "방향 지시등(깜빡이) 정상 작동",
    required: true,
    modalName: "방향 지시등(깜빡이)",
  },
];

interface Props {
  onBack?: () => void;
  onNext?: () => void;
}

export default function LightInspectionStep({ onBack, onNext }: Props) {
  const [toggles, setToggles] = useState<Record<string, ToggleValue>>({});
  const [memos, setMemos] = useState<Record<string, string>>({});
  const [modalItem, setModalItem] = useState<string | null>(null);

  const allAnswered = ITEMS.every((i) => toggles[i.key]);

  function onToggle(key: string, v: ToggleValue) {
    setToggles((p) => ({ ...p, [key]: v }));
    const item = ITEMS.find((i) => i.key === key);
    if (item?.required && v === "bad") setModalItem(item.modalName);
  }

  return (
    <>
      <InspectionScaffold
        percent={50}
        title="라이트 점검"
        subtitle="차량 외부를 사진 찍어 업로드해주세요."
        onBack={onBack}
        canProceed={allAnswered}
        onNext={onNext}
      >
        <ItemStack>
          {ITEMS.map((item) => (
            <div key={item.key} className="flex flex-col gap-[18px]">
              <ItemLabel label={item.label} required={item.required} />
              <div className="flex flex-col gap-3">
                <StatusToggle
                  value={toggles[item.key] ?? null}
                  onChange={(v) => onToggle(item.key, v)}
                />
                <MemoInput
                  value={memos[item.key] ?? ""}
                  onChange={(v) => setMemos((p) => ({ ...p, [item.key]: v }))}
                />
              </div>
            </div>
          ))}
        </ItemStack>
      </InspectionScaffold>
      {modalItem && (
        <WarningModal itemLabel={modalItem} onClose={() => setModalItem(null)} />
      )}
    </>
  );
}
