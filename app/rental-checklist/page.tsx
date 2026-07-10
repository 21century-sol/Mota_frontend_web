"use client";

import AgreementStep from "@/components/checklist/AgreementStep";

export default function RentalChecklistPage() {
  // TODO: 토큰 검증 → 스텝 오케스트레이션(약관 → 접근권한 → 점검 → 완료) 연결 예정
  return <AgreementStep onConfirm={(v) => console.log("agreed", v)} />;
}
