"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ApiError,
  getQuestions,
  getTokenContext,
  submitChecklist,
} from "@/lib/api";
import { Question, TokenContext } from "@/lib/types";

interface AnswerState {
  abnormal: boolean;
  text: string;
  files: File[];
}

const PHONE_PATTERN = /^01[016789]-?\d{3,4}-?\d{4}$/;

function ChecklistForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [fatalError, setFatalError] = useState<string | null>(null);
  const [context, setContext] = useState<TokenContext | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);

  const [answers, setAnswers] = useState<Record<string, AnswerState>>({});
  const [phoneNumber, setPhoneNumber] = useState("");
  const [termsOfServiceAgreed, setTermsOfServiceAgreed] = useState(false);
  const [privacyAgreed, setPrivacyAgreed] = useState(false);
  const [reportSmsAgreed, setReportSmsAgreed] = useState(false);
  const [marketingAgreed, setMarketingAgreed] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) {
      setFatalError("유효하지 않은 접근입니다. QR 코드를 다시 스캔해 주세요.");
      setLoading(false);
      return;
    }

    let active = true;
    (async () => {
      try {
        const [ctx, qs] = await Promise.all([
          getTokenContext(token),
          getQuestions(),
        ]);
        if (!active) return;
        setContext(ctx);
        setQuestions([...qs].sort((a, b) => a.displayOrder - b.displayOrder));
        setAnswers(
          Object.fromEntries(
            qs.map((q) => [
              q.questionId,
              { abnormal: false, text: "", files: [] } as AnswerState,
            ]),
          ),
        );
      } catch (e) {
        if (!active) return;
        setFatalError(
          e instanceof ApiError
            ? e.message
            : "정보를 불러오지 못했습니다. 네트워크 상태를 확인해 주세요.",
        );
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [token]);

  function updateAnswer(questionId: string, patch: Partial<AnswerState>) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId], ...patch },
    }));
  }

  function addFiles(questionId: string, fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const current = answers[questionId]?.files ?? [];
    updateAnswer(questionId, {
      files: [...current, ...Array.from(fileList)],
    });
  }

  function removeFile(questionId: string, index: number) {
    const current = answers[questionId]?.files ?? [];
    updateAnswer(questionId, {
      files: current.filter((_, i) => i !== index),
    });
  }

  const phoneValid = PHONE_PATTERN.test(phoneNumber.trim());
  const canSubmit =
    !submitting &&
    phoneValid &&
    termsOfServiceAgreed &&
    privacyAgreed &&
    reportSmsAgreed;

  async function handleSubmit() {
    if (!token || !canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);

    // 모든 사진을 하나의 배열로 모으고, 답변별로 인덱스를 매핑한다.
    const photos: File[] = [];
    const answerPayloads = questions.map((q) => {
      const a = answers[q.questionId];
      const indexes = a.files.map((file) => {
        photos.push(file);
        return photos.length - 1;
      });
      return {
        questionId: q.questionId,
        abnormal: a.abnormal,
        text: a.text.trim() ? a.text.trim() : null,
        photoFileIndexes: indexes,
      };
    });

    try {
      await submitChecklist(
        {
          token,
          phoneNumber: phoneNumber.trim(),
          termsOfServiceAgreed,
          privacyAgreed,
          reportSmsAgreed,
          marketingAgreed,
          answers: answerPayloads,
        },
        photos,
      );
      setDone(true);
    } catch (e) {
      setSubmitError(
        e instanceof ApiError
          ? e.message
          : "제출에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="page">
        <div className="state">
          <div className="spinner" />
          <p>체크리스트를 불러오는 중입니다…</p>
        </div>
      </main>
    );
  }

  if (fatalError) {
    return (
      <main className="page">
        <div className="state error">
          <h2>이용할 수 없는 링크입니다</h2>
          <p>{fatalError}</p>
        </div>
      </main>
    );
  }

  if (done) {
    return (
      <main className="page">
        <div className="state done">
          <div className="icon">✅</div>
          <h2>제출이 완료되었습니다</h2>
          <p>차량 인수 체크리스트가 정상적으로 접수되었습니다.</p>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="page">
        <div className="header">
          <h1>차량 인수 체크리스트</h1>
          <p>차량 상태를 확인하고 이상 여부를 표시해 주세요.</p>
        </div>

        {context && (
          <div className="card">
            <h2>차량 정보</h2>
            <div className="vehicle-row">
              <span>차종</span>
              <span>{context.vehicle.model ?? "-"}</span>
            </div>
            <div className="vehicle-row">
              <span>차량번호</span>
              <span>{context.vehicle.plateNumber}</span>
            </div>
            <div className="vehicle-row">
              <span>연식</span>
              <span>{context.vehicle.modelYear}년식</span>
            </div>
          </div>
        )}

        <div className="card">
          <h2>점검 항목</h2>
          {questions.map((q) => {
            const a = answers[q.questionId];
            return (
              <div className="question" key={q.questionId}>
                <div className="question-title">
                  <span>{q.questionText}</span>
                  {q.required && <span className="req-badge">*</span>}
                </div>
                <div className="toggle">
                  <button
                    type="button"
                    className={!a.abnormal ? "active-ok" : ""}
                    onClick={() => updateAnswer(q.questionId, { abnormal: false })}
                  >
                    정상
                  </button>
                  <button
                    type="button"
                    className={a.abnormal ? "active-bad" : ""}
                    onClick={() => updateAnswer(q.questionId, { abnormal: true })}
                  >
                    이상 있음
                  </button>
                </div>

                {a.abnormal && (
                  <div className="detail">
                    <textarea
                      rows={2}
                      placeholder="이상 내용을 입력해 주세요 (선택)"
                      value={a.text}
                      onChange={(e) =>
                        updateAnswer(q.questionId, { text: e.target.value })
                      }
                    />
                    <label className="file-label">
                      + 사진 첨부
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => addFiles(q.questionId, e.target.files)}
                      />
                    </label>
                    {a.files.length > 0 && (
                      <div className="thumbs">
                        {a.files.map((file, i) => (
                          <div className="thumb" key={i}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`첨부 사진 ${i + 1}`}
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(q.questionId, i)}
                              aria-label="사진 삭제"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="card">
          <h2>연락처</h2>
          <div className="field">
            <label className="field-label" htmlFor="phone">
              휴대폰 번호
            </label>
            <input
              id="phone"
              type="tel"
              inputMode="numeric"
              placeholder="010-1234-5678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
          </div>
        </div>

        <div className="card">
          <h2>약관 동의</h2>
          <label className="agree">
            <input
              type="checkbox"
              checked={termsOfServiceAgreed}
              onChange={(e) => setTermsOfServiceAgreed(e.target.checked)}
            />
            <span>
              <span className="req-badge">[필수]</span> 서비스 이용약관에
              동의합니다.
            </span>
          </label>
          <label className="agree">
            <input
              type="checkbox"
              checked={privacyAgreed}
              onChange={(e) => setPrivacyAgreed(e.target.checked)}
            />
            <span>
              <span className="req-badge">[필수]</span> 개인정보 수집·이용에
              동의합니다.
            </span>
          </label>
          <label className="agree">
            <input
              type="checkbox"
              checked={reportSmsAgreed}
              onChange={(e) => setReportSmsAgreed(e.target.checked)}
            />
            <span>
              <span className="req-badge">[필수]</span> 레포트 문자(알림) 수신에
              동의합니다.
            </span>
          </label>
          <label className="agree">
            <input
              type="checkbox"
              checked={marketingAgreed}
              onChange={(e) => setMarketingAgreed(e.target.checked)}
            />
            <span>[선택] 마케팅 정보 수신에 동의합니다.</span>
          </label>
        </div>
      </main>

      <div className="submit-bar">
        <div className="inner">
          {submitError && <div className="error-banner">{submitError}</div>}
          <button
            className="btn-primary"
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {submitting ? "제출 중…" : "체크리스트 제출"}
          </button>
        </div>
      </div>
    </>
  );
}

export default function RentalChecklistPage() {
  return (
    <Suspense
      fallback={
        <main className="page">
          <div className="state">
            <div className="spinner" />
          </div>
        </main>
      }
    >
      <ChecklistForm />
    </Suspense>
  );
}
