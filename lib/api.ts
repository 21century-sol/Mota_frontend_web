import {
  ApiResponse,
  Question,
  SubmissionPayload,
  SubmissionResult,
  TokenContext,
} from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function unwrap<T>(res: Response): Promise<T> {
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    // 응답 본문이 JSON이 아닌 경우 (게이트웨이 오류 등)
  }

  if (!res.ok || (body && body.error)) {
    const message = body?.error ?? `요청에 실패했습니다. (${res.status})`;
    throw new ApiError(res.status, message);
  }

  return (body as ApiResponse<T>).content;
}

export function getTokenContext(token: string): Promise<TokenContext> {
  return fetch(`${API_BASE}/api/checklists/tokens/${token}`, {
    cache: "no-store",
  }).then((res) => unwrap<TokenContext>(res));
}

export function getQuestions(): Promise<Question[]> {
  return fetch(`${API_BASE}/api/checklists/questions`, {
    cache: "no-store",
  }).then((res) => unwrap<Question[]>(res));
}

export function submitChecklist(
  payload: SubmissionPayload,
  photos: File[],
): Promise<SubmissionResult> {
  const form = new FormData();
  form.append(
    "request",
    new Blob([JSON.stringify(payload)], { type: "application/json" }),
  );
  for (const photo of photos) {
    form.append("photos", photo);
  }

  return fetch(`${API_BASE}/api/checklists/submissions`, {
    method: "POST",
    body: form,
  }).then((res) => unwrap<SubmissionResult>(res));
}
