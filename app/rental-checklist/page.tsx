"use client";

import { useState } from "react";
import AgreementStep, {
  AgreementValues,
} from "@/components/checklist/AgreementStep";
import AccessPermissionStep from "@/components/checklist/AccessPermissionStep";
import PhoneNumberStep from "@/components/checklist/PhoneNumberStep";
import VehicleInfoStep from "@/components/checklist/VehicleInfoStep";
import ExteriorInspectionStep from "@/components/checklist/ExteriorInspectionStep";
import LightInspectionStep from "@/components/checklist/LightInspectionStep";
import DashboardInspectionStep from "@/components/checklist/DashboardInspectionStep";
import CompletionStep from "@/components/checklist/CompletionStep";

type Step =
  | "agreement"
  | "permission"
  | "phone"
  | "vehicle"
  | "exterior"
  | "light"
  | "dashboard"
  | "done";

export default function RentalChecklistPage() {
  const [step, setStep] = useState<Step>("agreement");
  const [, setAgreement] = useState<AgreementValues | null>(null);
  const [, setPhone] = useState("");

  // TODO: 토큰 검증 + 제출 API 연동 예정
  switch (step) {
    case "permission":
      return <AccessPermissionStep onGranted={() => setStep("phone")} />;
    case "phone":
      return (
        <PhoneNumberStep
          onNext={(p) => {
            setPhone(p);
            setStep("vehicle");
          }}
        />
      );
    case "vehicle":
      return <VehicleInfoStep onStart={() => setStep("exterior")} />;
    case "exterior":
      return (
        <ExteriorInspectionStep
          onBack={() => setStep("vehicle")}
          onNext={() => setStep("light")}
        />
      );
    case "light":
      return (
        <LightInspectionStep
          onBack={() => setStep("exterior")}
          onNext={() => setStep("dashboard")}
        />
      );
    case "dashboard":
      return (
        <DashboardInspectionStep
          onBack={() => setStep("light")}
          onSubmit={() => setStep("done")}
        />
      );
    case "done":
      return <CompletionStep />;
    default:
      return (
        <AgreementStep
          onConfirm={(v) => {
            setAgreement(v);
            setStep("permission");
          }}
        />
      );
  }
}
