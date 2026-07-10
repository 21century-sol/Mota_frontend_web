"use client";

import { useState } from "react";
import AgreementStep, {
  AgreementValues,
} from "@/components/checklist/AgreementStep";
import AccessPermissionStep from "@/components/checklist/AccessPermissionStep";

type Step = "agreement" | "permission";

export default function RentalChecklistPage() {
  const [step, setStep] = useState<Step>("agreement");
  const [, setAgreement] = useState<AgreementValues | null>(null);

  // TODO: 토큰 검증 → 점검 → 완료 단계 연결 예정
  if (step === "permission") {
    return (
      <AccessPermissionStep
        onGranted={() => console.log("camera permission granted → next")}
      />
    );
  }

  return (
    <AgreementStep
      onConfirm={(v) => {
        setAgreement(v);
        setStep("permission");
      }}
    />
  );
}
