"use client";

import { Suspense, useEffect, useState, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  ApiError,
  getQuestions,
  getTokenContext,
  submitChecklist,
} from "@/lib/api";
import type {
  AnswerPayload,
  Question,
  SubmissionPayload,
  TokenContext,
} from "@/lib/types";
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
import AlreadySubmittedStep from "@/components/checklist/AlreadySubmittedStep";
import type { ItemAnswer } from "@/components/checklist/inspection";

/** 이미 제출된(중복 제출) 에러인지 판별: 409 Conflict 또는 안내 문구 매칭 */
function isAlreadySubmitted(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  if (e.status === 409) return true;
  return /이미|중복|already|submitted/i.test(e.message);
}

type Step =
  | "agreement"
  | "permission"
  | "phone"
  | "vehicle"
  | "exterior"
  | "light"
  | "dashboard"
  | "done";

/** 전체화면 중앙 메시지 (로딩/에러)   */
function CenterScreen({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center gap-4 bg-white px-8 text-center">
      {children}
    </main>
  );
}

function Spinner() {
  return (
    <div className="size-8 animate-spin rounded-full border-[3px] border-fill-card border-t-brand" />
  );
}

function ChecklistFlow() {
  const token = useSearchParams().get("token");

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [ctx, setCtx] = useState<TokenContext | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [step, setStep] = useState<Step>("agreement");
  const [agreement, setAgreement] = useState<AgreementValues | null>(null);
  const [phone, setPhone] = useState("");
  const [exteriorAns, setExteriorAns] = useState<ItemAnswer[]>([]);
  const [lightAns, setLightAns] = useState<ItemAnswer[]>([]);
  const [dashboardAns, setDashboardAns] = useState<ItemAnswer[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // 진입 시 토큰 검증 + 차량정보/질문 로드
  useEffect(() => {
    if (!token) {
      setFatalError("유효하지 않은 접근입니다. QR 코드를 다시 스캔해 주세요.");
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const [c, qs] = await Promise.all([
          getTokenContext(token),
          getQuestions(),
        ]);
        if (!active) return;
        setCtx(c);
        setQuestions([...qs].sort((a, b) => a.displayOrder - b.displayOrder));
      } catch (e) {
        if (!active) return;
        if (isAlreadySubmitted(e)) {
          setAlreadySubmitted(true);
        } else {
          setFatalError(
            e instanceof ApiError
              ? e.message
              : "정보를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [token]);

  async function submit(finalDashboardAns: ItemAnswer[]) {
    if (!token) return;
    setDashboardAns(finalDashboardAns);
    setSubmitting(true);
    setSubmitError(null);

    // 화면 순서(외관1 → 전조등2 → 방향3 → 연료4 → 경고5) = 질문 displayOrder 순서
    const all = [...exteriorAns, ...lightAns, ...finalDashboardAns];
    const photos: File[] = [];
    const answers: AnswerPayload[] = all.map((a, i) => {
      const indexes: number[] = [];
      for (const p of a.photos) {
        photos.push(p);
        indexes.push(photos.length - 1);
      }
      return {
        questionId: questions[i]?.questionId ?? "",
        abnormal: a.abnormal,
        text: a.text.trim() ? a.text.trim() : null,
        photoFileIndexes: indexes,
      };
    });

    const payload: SubmissionPayload = {
      token,
      phoneNumber: phone,
      termsOfServiceAgreed: agreement?.termsOfServiceAgreed ?? false,
      privacyAgreed: agreement?.privacyAgreed ?? false,
      reportSmsAgreed: agreement?.reportSmsAgreed ?? false,
      marketingAgreed: agreement?.marketingAgreed ?? false,
      answers,
    };

    try {
      await submitChecklist(payload, photos);
      setStep("done");
    } catch (e) {
      if (isAlreadySubmitted(e)) {
        setAlreadySubmitted(true);
      } else {
        setSubmitError(
          e instanceof ApiError
            ? e.message
            : "제출에 실패했습니다. 잠시 후 다시 시도해 주세요.",
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (alreadySubmitted) {
    return <AlreadySubmittedStep />;
  }

  if (loading) {
    return (
      <CenterScreen>
        <Spinner />
        <p className="text-[15px] text-text-body">불러오는 중입니다…</p>
      </CenterScreen>
    );
  }

  if (fatalError) {
    return (
      <CenterScreen>
        <h2 className="text-[18px] font-bold text-black">
          이용할 수 없는 링크입니다
        </h2>
        <p className="text-[14px] leading-[1.5] text-text-body">{fatalError}</p>
      </CenterScreen>
    );
  }

  if (submitting) {
    return (
      <CenterScreen>
        <Spinner />
        <p className="text-[15px] text-text-body">제출 중입니다…</p>
      </CenterScreen>
    );
  }

  if (submitError) {
    return (
      <CenterScreen>
        <h2 className="text-[18px] font-bold text-black">
          제출에 실패했습니다
        </h2>
        <p className="text-[14px] leading-[1.5] text-text-body">
          {submitError}
        </p>
        <button
          type="button"
          onClick={() => submit(dashboardAns)}
          className="mt-2 flex h-[52px] w-full max-w-[280px] items-center justify-center rounded-btn bg-brand text-[16px] font-semibold text-white"
        >
          다시 시도
        </button>
      </CenterScreen>
    );
  }

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
      return (
        <VehicleInfoStep
          vehicle={
            ctx
              ? {
                  model: ctx.vehicle.model ?? "-",
                  plateNumber: ctx.vehicle.plateNumber,
                  modelYear: `${ctx.vehicle.modelYear}년`,
                }
              : undefined
          }
          onStart={() => setStep("exterior")}
        />
      );
    case "exterior":
      return (
        <ExteriorInspectionStep
          onBack={() => setStep("vehicle")}
          onNext={(a) => {
            setExteriorAns(a);
            setStep("light");
          }}
        />
      );
    case "light":
      return (
        <LightInspectionStep
          onBack={() => setStep("exterior")}
          onNext={(a) => {
            setLightAns(a);
            setStep("dashboard");
          }}
        />
      );
    case "dashboard":
      return (
        <DashboardInspectionStep
          onBack={() => setStep("light")}
          onSubmit={submit}
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

export default function RentalChecklistPage() {
  return (
    <Suspense
      fallback={
        <CenterScreen>
          <Spinner />
        </CenterScreen>
      }
    >
      <ChecklistFlow />
    </Suspense>
  );
}
