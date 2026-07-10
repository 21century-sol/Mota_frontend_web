"use client";

import { useState } from "react";
import AgreementStep, {
  AgreementValues,
} from "@/components/checklist/AgreementStep";
import AccessPermissionStep from "@/components/checklist/AccessPermissionStep";
import PhoneNumberStep from "@/components/checklist/PhoneNumberStep";

type Step = "agreement" | "permission" | "phone";

export default function RentalChecklistPage() {
  const [step, setStep] = useState<Step>("agreement");
  const [, setAgreement] = useState<AgreementValues | null>(null);
  const [, setPhone] = useState("");

  // TODO: 토큰 검증 → 점검 → 완료 단계 연결 예정
  if (step === "phone") {
    return (
      <PhoneNumberStep
        onNext={(p) => {
          setPhone(p);
          console.log("phone entered:", p);
        }}
      />
    );
  }

  if (step === "permission") {
    return <AccessPermissionStep onGranted={() => setStep("phone")} />;
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
