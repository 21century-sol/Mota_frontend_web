# Mota Frontend Harness

이 문서는 Claude Code와 서브에이전트가 이 저장소에서 따라야 하는 최상위 개발 규칙이다.
충돌하는 지시가 있으면 사용자 요청, 이 문서, 작업 이슈의 인수 조건 순으로 따른다.

## 0. Agent Collaboration Protocol

메인 에이전트는 관리자 dashboard 작업의 **오케스트레이터**다. 코드 구현·최종 통합·GitHub 작업(commit, push, PR)은 메인 에이전트가 담당하며, 서브에이전트는 역할별 handoff만 반환한다.

### 0.1 적용 조건

다음 요청이 들어오면 **본 프로토콜을 기본 흐름**으로 따른다.

- `/dashboard` 관련 화면·컴포넌트·API·테스트 구현 또는 수정
- 이슈의 인수 조건(AC) 확정, 범위 분해, handoff 작성
- Figma·OpenAPI·MSW 계약 정리 후 UI 구현
- dashboard 변경에 대한 검증·리뷰

다음은 본 파이프라인을 **생략하거나 축소**할 수 있다.

- Harness 문서·에이전트 정의만 수정하는 작업
- 사용자가 명시적으로 단일 에이전트만 호출을 요청한 작업
- 체크리스트(`/rental-checklist`) 영역 — 본 프로토콜 대상 아님. 수정 금지 규칙(§3)을 따른다.

### 0.2 표준 파이프라인

```text
[1] pm-agent
      ↓
[2] figma-agent ─┐  (병렬, PM handoff 이후)
[2] api-agent   ─┘  (병렬, PM handoff 이후)
      ↓  (두 handoff 병합·충돌 검사)
[3] ui-agent
      ↓
[4] test-agent
      ↓
[5] review-agent
      ↓
[6] 메인 에이전트 — 통합, 사용자 보고, (요청 시) commit/PR
```

| 단계 | 에이전트 | 입력 | 산출물 |
|------|----------|------|--------|
| 1 | `pm-agent` | 이슈, 사용자 요청, 기존 코드 | Scope, AC, 수정 가능/금지 경로, 의존성, handoff 지시 |
| 2a | `figma-agent` | PM handoff, Figma URL/Node ID | Node 매핑, token, asset, `Decision Required` |
| 2b | `api-agent` | PM handoff, OpenAPI/응답 예시 | DTO, query key, MSW 시나리오, `Decision Required` |
| 3 | `ui-agent` | PM + Figma + API handoff(필요 분만) | 코드, 관련 테스트 초안 |
| 4 | `test-agent` | 구현 diff, AC | PASS / FAIL / BLOCKED + 실행 로그 |
| 5 | `review-agent` | diff, handoff, 테스트 결과 | APPROVE / COMMENT / REQUEST_CHANGES / BLOCKED |
| 6 | 메인 에이전트 | 위 전체 | 완료 보고, blocker 에스컬레이션, GitHub 작업 |

### 0.3 병렬 단계 규칙 (Figma + API)

- **시작 조건:** `pm-agent` handoff가 반환된 뒤에만 `figma-agent`와 `api-agent`를 호출한다.
- **병렬 허용:** 두 에이전트는 서로 다른 산출물(Figma 분석 vs API 계약)을 다루므로 **동시에** 실행할 수 있다.
- **병렬 금지:** `ui-agent` 호출 전에 두 handoff를 메인 에이전트가 **병합·충돌 검사**한다. UI 구현은 병합 결과가 확정된 뒤 **한 번만** 시작한다.
- **선택적 생략:**
  - 정적 UI·placeholder만이면 `api-agent` 생략 가능(PM handoff에 근거 기록).
  - Figma 미제공·디자인 불필요 작업이면 `figma-agent` 생략 가능(PM handoff에 근거 기록).
  - 생략해도 `ui-agent` 시작 조건(§0.5)은 반드시 충족한다.

### 0.4 메인 에이전트 호출 규칙

서브에이전트 호출 시 작업 지시에 **반드시** 포함한다.

1. GitHub 이슈 번호와 목표 한 줄
2. 인수 조건(AC) 또는 PM handoff 요약
3. **수정 가능 경로**와 **수정 금지 경로**(§3)
4. 이전 단계 handoff 파일 경로 또는 구조화된 요약
5. 기대 반환 형식(표, checklist, blocker 목록 등)

서브에이전트에게 전달하지 **않는다.**

- 전체 대화 기록, 내부 추론, 원본 MCP/Figma 전체 응답
- 이슈·AC와 무관한 명령 로그

handoff 파일은 `.claude/handoffs/{issue-number}-{stage}.md` 형식을 사용한다(§8). handoff는 커밋하지 않는다.

### 0.5 단계별 게이트 (다음 단계 진행 조건)

| 게이트 | 진행 가능 조건 |
|--------|----------------|
| PM → 2단계 | Scope·AC가 검증 가능하게 정의됨. `Decision Required`가 전체 작업을 막지 않거나, 확정 가능한 부분이 분리됨 |
| 2단계 → UI | PM handoff 확정. 필요한 Figma/API handoff 확정. **교차 충돌 없음** 또는 충돌 항목이 non-goals로 분리됨 |
| UI → Test | 요청 범위 내 구현 완료. 체크리스트 보호 경로 미변경 |
| Test → Review | test-agent가 PASS 또는 알려진 제한이 AC와 일치함 |
| Review → 완료 | `REQUEST_CHANGES`·`BLOCKED` 없음. 또는 수정 반영 후 재검증 완료 |

#### 게이트 self-check

매 단계 종료 시 메인 에이전트는 위 게이트를 **스스로 검토(self-check)** 한다.

- 통과 시에만 다음 에이전트를 호출한다.
- handoff 또는 대화에 `Gate PASS ({from}→{to}): {한 줄 사유}`를 남긴다. 긴 에세이는 작성하지 않는다.
- 미충족이면 다음 에이전트를 호출하지 않고, 부족한 작업을 마저 수행하거나 §0.6 Blocker로 승격한다.

`ui-agent`는 다음이 남아 있으면 **구현을 시작하지 않는다.**

- 구현 대상에 미해결 `Decision Required`
- Figma 상태명·필드와 API enum·DTO 불일치(임의 매핑 없이)
- 보호 경로 변경 필요(사용자 승인 없이)

### 0.6 Blocker 규칙

**Blocker**란 현재 단계 또는 다음 단계를 **근거 없이 진행할 수 없는** 미결 사항이다.

#### Blocker 발생 시 공통 동작

1. 해당 단계 에이전트는 **즉시 다음 단계로 넘기지 않는다.**
2. 메인 에이전트에게 구조화된 Blocker 보고를 반환한다.
3. 메인 에이전트는 **파이프라인을 중단**하고 사용자에게 `Decision Required`를 에스컬레이션한다.
4. 사용자 결정·자료 확보 전까지 **하위 단계 에이전트를 호출하지 않는다.**

#### 사용자 보고 형식 (요약 우선)

사용자에게 Blocker를 알릴 때 메인 에이전트는 다음 순서를 따른다.

1. **대화창에 요약을 먼저** 출력한다: `Summary`, `Decision Required`(질문 1~2개), `Recommendation`, `Options`(있을 때).
2. 전체 Blocker Report는 `.claude/handoffs/{issue-number}-blocker.md` 또는 접을 수 있는 코드 블록으로 제공한다.
3. 구조화 전문만 먼저 보여 의사결정을 지연시키지 않는다.

#### Decision Required 해소 후 재개

사용자 결정을 받은 뒤 메인 에이전트는 다음 순서로 재개한다.

1. 결정 내용·근거·선택지를 GitHub 이슈 또는 해당 handoff에 기록한다.
2. 결정이 Scope·AC·non-goals·수정 가능 경로에 영향을 주면 **`pm-agent`로 PM handoff를 갱신**한다.
3. Figma·API 계약만 바뀌면 영향 받은 `figma-agent` / `api-agent`만 재실행한다.
4. 이후 **영향 받은 단계만** 재실행한다. 전체 파이프라인을 처음부터 돌리지 않는다.

#### Blocker 보고 형식

```text
## Blocker Report
- Stage: {pm-agent | figma-agent | api-agent | ui-agent | test-agent | review-agent}
- Issue: #{number}
- Type: {conflict | technical-impasse | missing-input | policy}
- Severity: {blocks-all | blocks-scope | blocks-merge}
- Summary: {한 줄 요약}
- Details: {무엇이, 왜 막히는지}
- Options: {A: ... / B: ...}  (가능할 때)
- Recommendation: {메인 에이전트 추천}
- Unblocked scope: {결정 없이 진행 가능한 범위 — 없으면 "none"}
- Decision Required: {사용자에게 물을 질문 1~2개}
```

#### Type 정의

| Type | 의미 |
|------|------|
| `conflict` | 두 handoff 이상이 같은 개념에 양립 불가능한 값을 줌 |
| `technical-impasse` | 계약·디자인은 있으나 스택·Harness·보호 경로 때문에 구현 불가 |
| `missing-input` | Figma Node, OpenAPI, 이슈 AC 등 필수 입력이 없음 |
| `policy` | 보호 경로·보안·개인정보·인증 등 Harness 정책상 임의 진행 금지 |

#### Severity 정의

| Severity | 의미 | 메인 에이전트 동작 |
|----------|------|-------------------|
| `blocks-all` | 전체 이슈 진행 불가 | 즉시 중단, 사용자 결정 필수 |
| `blocks-scope` | 일부 AC만 진행 불가 | `Unblocked scope`만 분리해 PM handoff 갱신 후 해당 단계 재실행 |
| `blocks-merge` | Figma↔API 등 handoff 병합 불가 | UI 호출 금지. 충돌 항목만 사용자·이슈에 기록 |

#### 대표 Blocker 사례

- `missing-input`: API endpoint·필드·enum 미정의, Figma Node ID·file key 없음
- `conflict`: PM scope와 이슈 AC 불일치, Figma 상태명과 API enum 불일치
- `technical-impasse`: 체크리스트 보호 경로 변경이 필수, quality script 미구성으로 test-agent 검증 불가
- `policy`: 인증·권한·개인정보 처리 방식 미정

#### Blocker가 아닌 경우 (진행 가능)

- API 미완성이나 MSW·fixture로 **동일 DTO 계약**이 확정된 경우 → `api-agent`가 mock 시나리오를 정의하면 UI 진행 가능
- Figma 에셋 추출 실패이나 Lucide·placeholder로 **위치와 원본 요구가 문서화**된 경우 → `Remaining Tasks`에 기록 후 제한적 진행
- test-agent FAIL → blocker가 아니라 **ui-agent 또는 메인 에이전트 수정 루프**. 수정 후 test-agent 재실행
- review-agent `REQUEST_CHANGES` → 수정 후 test-agent → review-agent 재실행

### 0.7 충돌(Conflict) 처리

**충돌**은 두 handoff 이상이 같은 개념에 대해 **양립 불가능한 값**을 줄 때를 말한다. Blocker Type은 `conflict`로 보고한다.

예: Figma 차량 상태 4종 vs API enum 5종, 화면 필수 필드 vs DTO optional, PM non-goals vs Figma 필수 컴포넌트.

충돌 처리 순서:

1. 메인 에이전트가 충돌 항목을 표로 정리한다(항목, Figma 값, API 값, PM 값).
2. 임의 매핑·가정 구현 **금지**.
3. `blocks-merge` Blocker와 `Decision Required`로 사용자에게 결정을 요청한다.
4. 결정을 받으면 §0.6의 **Decision Required 해소 후 재개** 절차를 따른다.

### 0.8 수정 루프

| 결과 | 다음 동작 |
|------|-----------|
| test-agent `FAIL` | ui-agent 또는 메인 에이전트가 수정 → test-agent 재실행 |
| test-agent `BLOCKED` | §0.6 Blocker 처리(인프라·AC 문제) |
| review-agent `REQUEST_CHANGES` | 지적 사항 수정 → test-agent → review-agent |
| review-agent `BLOCKED` | §0.6 Blocker 처리 |

품질 명령(`lint`, `typecheck`, `test`, `build`)은 test-agent·review-agent 전후로 메인 에이전트가 **실제 실행 결과**를 handoff에 포함한다.

### 0.9 완료·병합 조건

다음을 모두 만족할 때 해당 수직 기능을 **구현 완료**로 보고한다.

- PM handoff의 AC 충족
- test-agent `PASS`(또는 AC와 일치하는 알려진 제한 문서화)
- review-agent `APPROVE` 또는 `COMMENT`만(미해결 `REQUEST_CHANGES`·`BLOCKED` 없음)
- 체크리스트 회귀 영향 없음(또는 승인된 공유 파일 변경과 검증 기록)
- 임시 구현·placeholder·`TODO`는 이슈 번호와 제거 조건이 PR/`Remaining Tasks`에 기록됨

#### GitHub 권한 경계

- commit, push, PR 생성은 **사용자가 명시적으로 요청한 경우에만** 메인 에이전트가 수행한다.
- `develop`으로의 **merge는 사람이 수행**한다. 메인 에이전트와 서브에이전트는 merge하지 않는다.
- merge 전제: review-agent가 **`APPROVE`**. `COMMENT`만으로는 merge하지 않는다.
- `REQUEST_CHANGES` 또는 `BLOCKED`이면 PR을 ready로 전환하지 않고 §0.8 수정 루프를 따른다.

## 1. 프로젝트 범위

- Next.js 14 App Router와 TypeScript로 렌터카 및 타이어 관리 웹을 개발한다.
- 기존 고객용 `/rental-checklist` 흐름을 보존하고 회귀를 방지한다.
- 관리자 화면은 파일 시스템의 `app/dashboard/**`에 구성하며 URL prefix는 `/dashboard`로 통일한다.
- 고객 문의와 설정은 내비게이션 및 빈 화면만 제공하며 별도 기능을 추측해 구현하지 않는다.
- 백엔드 계약이나 Figma에 없는 요구사항을 임의로 만들지 않는다. 불명확하면 구현 전에 질문하거나 이슈에 가정을 기록한다.

## 2. 기술 스택과 선택 기준

- Framework: Next.js 14 App Router, React 18, TypeScript
- Styling: Tailwind CSS
- Server state: TanStack React Query
- Local state: 컴포넌트 `useState`를 우선 사용한다.
- Shared UI state: Context는 변경 빈도가 낮은 전역 UI 상태에만 사용한다.
- Zustand: 여러 비관련 화면이 공유하며 갱신이 잦은 클라이언트 상태가 실제로 생길 때만 도입한다. 사전 승인 없이 추가하지 않는다.
- Charts: Recharts
- Icons: Lucide React를 우선 사용하고, 제품 고유 아이콘과 이미지는 Figma 원본을 사용한다.
- Static assets: `/public/assets/`에 의미 있는 kebab-case 파일명으로 저장한다. Android 경로인 `res/drawable`은 사용하지 않는다.
- Import alias: `@/*`

새 라이브러리는 기존 도구로 해결할 수 없는 이유를 확인한 뒤 패키지 매니저로 설치한다.

- 명시적인 승인 없이 `npm audit fix`, `npm audit fix --force`, 광범위한 `npm update` 또는 package manager 변경을 실행하지 않는다.
- 보안 취약점은 영향받는 package, 심각도와 실제 사용 여부를 먼저 확인한다. 수정이 필요하면 대상 package만 승인된 이슈 범위에서 갱신한다.
- package를 추가하거나 버전을 변경한 후 `package.json`과 lockfile diff를 검토한다. 무관한 package의 대량 변경이나 예상하지 못한 major upgrade를 포함하지 않는다.
- 의존성 문제를 해결한다는 이유로 lockfile을 삭제하거나 전체 dependency tree를 임의로 재생성하지 않는다.

## 3. 체크리스트 코드 격리 규칙

관리자 웹은 기존 체크리스트와 같은 저장소를 사용하지만 코드와 자산을 다음 경로로 격리한다.

- Route: `app/dashboard/**`
- Components: `components/dashboard/**`
- Hooks: `hooks/dashboard/**`
- API와 도메인 로직: `lib/dashboard/**`
- Types: `types/dashboard/**`
- Assets: `public/assets/dashboard/**`
- Tests: `tests/dashboard/**` 또는 대상 모듈과 같은 dashboard 경로

다음 체크리스트 영역은 명시적인 사용자 승인 없이 수정하지 않는다.

- `app/rental-checklist/**`
- `components/checklist/**`
- `lib/api.ts`
- `lib/types.ts`
- 기존 체크리스트 전용 에셋
- 체크리스트 진입에 사용되는 기존 루트 화면

다음 공유 파일은 관리자 기능에 반드시 필요한 최소한의 추가 변경만 허용한다.

- `app/layout.tsx`
- `app/globals.css`
- `tailwind.config.ts`
- `package.json`과 lockfile
- `tsconfig.json`

공유 파일을 변경할 때는 기존 설정을 교체하지 않고 additive 방식으로 작성한다. 체크리스트의 import, 스타일, API 동작을 변경하지 않으며 `/rental-checklist` 회귀 테스트와 production build를 실행한다. PR에는 공유 파일을 변경한 이유와 체크리스트 영향 여부를 기록한다.

서브에이전트에게는 수정 가능한 dashboard 경로와 수정 금지 체크리스트 경로를 명시한다. 범위 밖의 체크리스트 문제를 발견하더라도 임의로 수정하지 않고 별도 이슈로 보고한다.

## 4. 아키텍처와 코드 규칙

### 데이터와 UI 분리

- 서버 요청, 응답 변환, query key는 `lib/`의 도메인별 모듈에 둔다.
- React Query를 사용하는 화면 로직은 `useQuery`, `useInfiniteQuery`, `useMutation` 기반의 도메인 훅으로 분리한다.
- 프레젠테이션 컴포넌트는 네트워크 요청을 직접 호출하지 않고 명시적인 props를 받는다.
- 사용자 상호작용과 한 컴포넌트에만 필요한 단순 상태까지 억지로 훅으로 추출하지 않는다.
- 서버 상태를 Context나 Zustand에 복제하지 않는다.
- Client Component는 상호작용이나 브라우저 API가 필요할 때만 사용한다. 가능한 레이아웃과 정적 UI는 Server Component로 유지한다.

### 서버 데이터 동기화

- 서버 데이터 변경 후 일반적인 UI 동기화 목적으로 `window.location.reload()`를 사용하지 않는다.
- React Query mutation은 응답 데이터로 `setQueryData`를 적용하거나 영향받는 정확한 query key만 `invalidateQueries`한다. 모든 query를 광범위하게 무효화하지 않는다.
- Server Action 또는 Server Component 데이터 캐시는 서버 코드에서만 `revalidatePath` 또는 `revalidateTag`로 무효화한다. Server Component 갱신이 필요하면 `router.refresh()`를 사용할 수 있다.
- React Query 캐시와 Next.js 서버 캐시를 구분하고 데이터의 실제 소유 캐시만 갱신한다. 두 캐시를 근거 없이 동시에 무효화해 중복 요청을 만들지 않는다.
- 전체 페이지 새로고침은 인증 상태 완전 초기화처럼 명확한 이유가 있는 경우에만 허용하고 코드에 이유를 남긴다.

### Server Action과 route 상태

- Server Action은 서버에서만 가능한 작업이 실제로 필요할 때 사용한다. 외부 API mutation을 무조건 Server Action으로 전환하지 않는다.
- 관리자 전용 Server Action은 컴포넌트 내부에 인라인으로 작성하지 않고 `lib/dashboard/actions/**`에 분리하며 파일 최상단에 `"use server"`를 선언한다.
- 예상 가능한 validation과 business 오류는 `{ ok: true, data } | { ok: false, error: { code, message } }` 형태의 직렬화 가능한 discriminated union으로 반환한다.
- 예상하지 못한 서버 오류는 성공 응답처럼 감싸지 않는다. 안전하게 로깅한 뒤 throw하고 secret, stack trace 또는 내부 오류 정보를 클라이언트에 반환하지 않는다.
- `loading.tsx`와 `error.tsx`는 route segment의 로딩 및 렌더링 오류에 사용한다. React Query widget의 loading, empty, error 상태와 event handler 오류는 해당 컴포넌트에서 처리한다.
- `error.tsx`는 Client Component로 작성하고 사용자가 실행할 수 있는 재시도 동작을 제공한다.

### App Router 렌더링 경계

- React Hook, event handler 또는 browser API가 필요한 컴포넌트는 Client Component 경계 안에 둔다. Server Component에서 직접 import되는 client 경계 파일은 import보다 앞에 `"use client"`를 선언한다.
- client 경계 아래의 모든 파일에 `"use client"`를 반복하지 않는다. 정적 레이아웃과 서버 데이터 조회는 Server Component로 유지하고 상호작용 영역만 작은 Client Component로 분리한다.
- Server Component에서 `useState`, `useEffect`, `useSearchParams` 또는 browser API를 호출하지 않는다.
- `useSearchParams`가 필요한 정적 route는 가능한 경우 page의 `searchParams`를 읽어 props로 전달한다. 클라이언트에서 직접 사용해야 한다면 가장 작은 컴포넌트를 `Suspense` 경계로 감싼다.
- 초기 렌더링에서 `Math.random()`, 현재 시각 또는 browser 전용 값처럼 서버와 클라이언트 결과가 달라지는 값을 직접 생성하지 않는다. 고유 ID는 `useId`, browser 값은 `useEffect`, 시간 값은 서버에서 전달된 기준 시각을 사용한다.

### URL 상태

- 새로고침, 뒤로가기 또는 URL 공유 후에도 유지되어야 하는 비민감 탐색 상태는 URL query parameter를 단일 기준으로 사용한다.
- 차량 상태, 타이어 위험도, 예약 상태, 날짜 범위, 정렬과 페이지 번호는 `searchParams` 또는 `useSearchParams`와 `router.replace/push`를 사용해 URL과 동기화한다.
- 다중 선택 값은 항상 같은 순서와 형식으로 직렬화하고 기본값은 URL에서 생략한다. URL 상태를 Context, Zustand 또는 별도 `useState`에 중복 저장하지 않는다.
- 고객 이름, 전화번호 등 개인정보와 dropdown, modal, hover, 지도 애니메이션 같은 일시적 상태는 URL에 저장하지 않는다.
- 무한 스크롤의 서버 cursor와 현재 로딩 상태는 React Query가 관리하며 URL에 노출하지 않는다. 검색어는 개인정보가 포함되지 않는 경우에만 URL 동기화를 허용한다.

### Form 상태와 검증

- 단순한 입력 1~3개는 uncontrolled input, `FormData` 또는 `useState`로 처리한다. 모든 form에 별도 라이브러리를 도입하지 않는다.
- 필드 간 조건, 동적 배열, 중첩 값 또는 복잡한 오류 표시가 있는 form은 프로젝트에서 승인된 form 및 schema 라이브러리를 사용한다. 새 라이브러리가 필요하면 기존 도구로 해결할 수 없는 이유를 먼저 확인한다.
- 클라이언트 검증은 빠른 UX 피드백 용도로만 사용한다. Server Action 또는 백엔드는 동일하거나 더 엄격한 규칙으로 입력을 다시 검증하며 클라이언트 검증 결과를 신뢰하지 않는다.
- validation 오류는 필드별로 표시하고 `aria-invalid`, 입력과 오류 메시지 연결, 제출 실패 시 최초 오류 focus를 제공한다.

### TypeScript

- `any`, 무근거 type assertion, `@ts-ignore`를 사용하지 않는다.
- 불명확한 외부 입력은 `unknown`으로 받고 검증한 뒤 좁힌다.
- API DTO, UI model, mock fixture에 명시적인 타입을 정의한다.
- API 응답을 UI에서 바로 변형하지 말고 변환 경계를 둔다.
- nullable/optional 값과 loading, empty, error 상태를 명시적으로 처리한다.

### 컴포넌트

- 재사용보다 책임 분리를 우선하며, 한 컴포넌트가 데이터 조회·복잡한 상태·대형 UI를 모두 소유하지 않게 한다.
- 공통 컴포넌트를 만들기 전에 실제로 반복되는지 확인한다.
- 상태 이름은 백엔드와 화면 전반에서 동일한 용어를 사용한다.
- 날짜 표시 형식은 요구사항에 따라 `YYYY.MM.DD`로 통일하되 전송 값은 API 계약을 따른다.
- 접근 가능한 이름, 키보드 조작, focus 상태, 적절한 semantic element를 제공한다.
- 불필요한 렌더링 최적화는 측정 없이 추가하지 않는다.
- Tailwind 클래스는 source에서 정적으로 확인 가능한 완전한 문자열로 작성한다. `bg-${color}-500`처럼 런타임에 클래스 이름을 조합하지 않는다.
- 단순한 조건부 클래스는 명확한 삼항식 또는 배열 조합을 허용한다. 반복되는 조건 조합이나 외부 `className` override가 있는 공통 컴포넌트는 프로젝트의 단일 `cn()` 유틸리티를 사용한다.
- `clsx`와 `tailwind-merge`는 실제 병합 충돌을 해결해야 할 때만 도입한다. 자동 병합 후 responsive, state variant와 custom token이 의도치 않게 제거되지 않는지 확인한다.

## 5. Figma 구현 규칙

- 화면 구현 전 Figma MCP로 대상 node의 design context, screenshot, component와 token 정보를 확인한다.
- Figma 값은 참고 코드 그대로 복사하지 않고 이 저장소의 Tailwind token과 컴포넌트 규칙에 매핑한다.
- 색상, spacing, typography가 반복되면 `tailwind.config.ts` 또는 공통 token으로 정의한다.
- Lucide에 정확히 대응하는 일반 아이콘은 Lucide를 사용한다. 브랜드, 차량, 타이어 등 제품 고유 자산은 SVG/PNG로 export해 `/public/assets/`에 둔다.
- Figma 접근이 불가능하거나 node가 불명확하면 디자인을 추측해 완료 처리하지 않는다.
- Figma MCP 에셋 추출에 실패하면 screenshot, metadata, 기존 `/public/assets/`, 정확히 대응하는 Lucide 아이콘 순서로 대안을 확인한다.
- 에셋과 무관한 작업은 계속할 수 있으며 개발 중에는 명확히 표시된 placeholder를 임시로 사용할 수 있다. placeholder 위치와 필요한 원본을 기록하고 완료 보고 및 PR의 알려진 제한에 포함한다.
- 디자인 핵심 에셋이 누락되거나 placeholder가 남은 UI는 완료 처리하지 않는다. 임의의 유사 이미지나 가짜 에셋으로 대체하지 않는다.
- Figma 분석 에이전트는 구현 전에 file key, 화면 root Node ID, 주요 컴포넌트 Node ID, node 이름과 마지막 확인 시점을 해당 이슈 또는 `docs/design/`의 화면별 매핑 문서에 기록한다.
- 검색창, 차량 목록, 지도, 타이어 차트처럼 독립적으로 구현하는 주요 영역만 매핑한다. 작은 텍스트나 장식 node까지 기록해 문서를 비대하게 만들지 않는다.
- UI 에이전트는 전체 Figma 파일을 반복 조회하지 않고 매핑된 Node ID의 design context와 screenshot을 우선 조회한다. node 이름이나 screenshot이 작업 지시와 다르면 오래된 매핑으로 간주하고 재확인한다.
- 전체 MCP 응답과 Figma 생성 코드를 캐시하지 않는다. 다음 단계에는 Node ID 매핑, 확정된 token과 필요한 screenshot만 전달한다.
- Tailwind 값은 기존 디자인 token과 utility, 반복값의 semantic token 등록, 근거가 명확한 단일 arbitrary value 순서로 선택한다.
- 반복되는 raw hex, spacing, shadow 또는 typography를 arbitrary value로 복제하지 않는다. 브랜드 고유 값이나 여러 화면에서 반복되는 값은 `tailwind.config.ts`에 token으로 등록한다.
- 재사용되지 않는 정확한 Figma 치수나 기하학적 위치에는 arbitrary value를 허용하되, 가장 가까운 utility로 임의 반올림하여 디자인 정확도를 훼손하지 않는다.
- 사용자 데이터에 따라 달라지는 값은 동적으로 조합한 Tailwind class 대신 CSS variable 또는 검증된 style 값을 사용한다. 고정 width보다 responsive layout, grid, flex와 `min/max-width`를 우선한다.
- 구현 후 주요 viewport를 screenshot으로 비교하고 눈에 띄는 레이아웃 차이를 수정한다.

## 6. API와 Mock 규칙

- 백엔드 OpenAPI 명세와 합의된 응답 예시를 API 계약의 기준으로 삼는다.
- 미완성 API는 타입이 지정된 fixture와 MSW handler로 대체한다. 컴포넌트 내부에 임시 mock을 넣지 않는다.
- mock과 실제 API는 동일한 DTO와 변환 경계를 사용한다.
- 목록 API는 loading, empty, error, 마지막 페이지, 중복 요청을 검증한다.
- 무한 스크롤은 서버 cursor 또는 page 계약을 따르고 응답 취소와 중복 fetch를 처리한다.
- 환경 변수나 비밀 값은 커밋하지 않는다. 브라우저에 노출 가능한 값만 `NEXT_PUBLIC_`을 사용한다.
- API가 정의되지 않은 기능은 가짜 endpoint를 확정된 것처럼 작성하지 않는다.
- fixture의 필드와 상태는 OpenAPI, Figma 또는 이슈에 정의된 계약만 사용한다. 현실적으로 보이게 만들기 위해 정의되지 않은 필드나 상태를 임의로 추가하지 않는다.
- Mock은 한국 렌터카 도메인 형식의 명백한 합성 데이터로 작성한다. 예: `홍길동`, `12가 3456`, `아반떼 하이브리드`, `010-0000-0001`. 실제 고객, 전화번호 또는 차량 번호를 복사하지 않는다.
- fixture는 정상, 빈 목록, 주의, 위험, 대여 중, 반납 완료와 API 오류처럼 이름이 명확한 시나리오로 분리한다.
- 날짜 fixture는 실행 시점의 `new Date()`로 만들지 않는다. 고정된 기준 시각을 사용하고 시나리오에 따라 과거, 현재와 미래 날짜를 의도적으로 배치한다.
- fixture 객체는 가능하면 `satisfies`를 사용해 API 계약 변경 시 타입 검사에서 불일치를 발견하도록 한다.
- 환경별 API 주소와 외부 서비스 설정은 코드에 하드코딩하지 않고 환경 변수로 관리한다.
- 새 환경 변수를 추가할 때 코드, `.env.example`, README와 CI/Vercel 설정 문서를 함께 갱신한다. `.env.example`이 ignore되지 않도록 `.gitignore` 예외도 확인한다.
- `.env.example`에는 변수 이름과 안전한 예시 또는 빈 값만 기록하고 실제 secret을 넣지 않는다.
- secret에는 `NEXT_PUBLIC_`을 사용하지 않는다. 브라우저에 공개되어도 안전한 값만 `NEXT_PUBLIC_`으로 선언한다.
- 필수 환경 변수는 앱 시작 또는 build 시 검증한다. 누락된 운영 설정을 임의의 localhost 주소나 가짜 기본값으로 대체하지 않는다.
- 환경 변수 접근은 `lib/dashboard/env/server.ts`와 `lib/dashboard/env/client.ts`처럼 서버용과 공개용 모듈로 분리한다.
- Server Component와 서버 코드에서만 server env 모듈을 import한다. Client Component에는 `NEXT_PUBLIC_` 변수만 포함한 client env 모듈만 허용한다.
- 필수 환경 변수는 기존 schema 라이브러리 또는 명시적인 validator로 검증한다. 환경 변수 검증 하나만을 위해 새 의존성을 무조건 추가하지 않는다.
- 일반 애플리케이션 코드에서는 검증된 env 객체를 사용한다. Next.js가 공개 변수를 정적으로 치환할 수 있도록 client env 모듈에서는 `process.env.NEXT_PUBLIC_NAME` 형태로 명시적으로 참조하고 동적 key 접근을 사용하지 않는다.
- server env 모듈 또는 secret 값을 Client Component에서 import하지 않는다.

## 7. 테스트와 완료 조건

변경 범위에 비례해 다음을 작성한다.

- 순수 변환 및 필터 로직: Vitest 단위 테스트
- 컴포넌트 상호작용과 비동기 상태: Testing Library + MSW
- 주요 사용자 흐름: Playwright E2E가 구성된 이후 E2E 테스트
- 버그 수정: 가능하면 실패를 재현하는 회귀 테스트를 먼저 추가
- 기존 `/rental-checklist`: 관리자 변경으로 인한 회귀 확인

작업 완료 전 아래 명령을 저장소 루트에서 실행한다.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

- `npx tsc --noEmit` 대신 저장소에 고정된 `npm run typecheck`를 사용한다.
- 실행하지 않은 검사를 통과했다고 보고하지 않는다.
- 실패하면 원인과 변경 관련 여부를 확인하고, 관련 실패를 수정한 뒤 전체 검사를 다시 실행한다.
- 검사 실패 시 로그와 변경 diff를 근거로 원인을 분석하고, 사용자에게 묻기 전에 최대 3회의 자가 복구를 시도한다. 각 재시도에는 이전과 다른 근거 또는 가설이 있어야 하며 같은 실패를 근거 없이 반복하지 않는다.
- 테스트 통과를 목적으로 테스트를 삭제하거나, 검사를 비활성화하거나, 제품 요구사항을 변경하지 않는다.
- 인증, 권한, API 계약 부재, 기획 충돌, 파괴적인 변경처럼 사용자 결정이 필요한 문제는 무의미하게 재시도하지 않고 blocker로 보고한다.
- 기존 인프라 문제로 명령이 실행되지 않으면 이를 숨기거나 우회하지 말고 blocker로 보고한다.
- lint/type/test를 건너뛰는 옵션이나 hook 우회 옵션을 사용하지 않는다.
- lint 실패가 자동 수정 가능한 formatting, import 순서 또는 정적 규칙 문제인지 먼저 확인한다.
- 프로젝트에 `lint:fix` 또는 formatter 명령이 구성되어 있으면 변경한 파일 범위에 우선 실행한다. 구성되지 않은 임의 명령이나 대화형 설정을 실행하지 않는다.
- 자동 수정 후 `git diff`로 변경 범위를 확인하고 동작 코드, 사용자 변경 또는 작업 범위 밖 파일이 변경되지 않았는지 검토한다.
- 자동 수정 결과를 그대로 신뢰하지 않고 lint, typecheck와 관련 테스트를 다시 실행한다.
- 타입 오류, React Hook 규칙, 접근성 또는 business logic 문제를 자동 수정으로 숨기지 않고 원인을 분석해 수정한다.

## 8. 서브에이전트 운영

dashboard 작업의 호출 순서, 병렬 규칙, 게이트, Blocker·충돌 처리는 **§0 Agent Collaboration Protocol**을 따른다. 이 절은 handoff 형식과 운영 세부 규칙을 정의한다.

- 메인 에이전트는 요구사항, 작업 분해, 파일 소유권, 최종 통합을 담당한다.
- 서브에이전트는 `.claude/agents/*.md`에 정의하고 역할 위임 시 해당 이름의 에이전트를 명시적으로 호출한다. `docs/agents/`는 사람을 위한 보조 문서로만 사용한다.
- 서브에이전트 작업 지시에는 이슈 번호, 인수 조건, 수정 가능한 파일, 수정 금지 경로, 필요한 입력과 반환 형식을 포함한다.
- Explore/design/API 에이전트는 기본적으로 읽기 전용으로 사용한다.
- 구현 에이전트에게는 한 이슈의 명확한 인수 조건과 수정 가능한 파일 범위를 제공한다.
- test-runner와 reviewer는 구현 에이전트와 분리한다. 구현 에이전트의 자체 검토만으로 완료하지 않는다.
- 작업 단계가 바뀌면 기존 에이전트에 새 역할을 누적하지 않고 적합한 별도 에이전트에 위임한다. 이전 단계에서는 변경 파일, 결정 사항, 테스트 결과와 남은 blocker만 전달한다.
- 각 역할은 독립된 서브에이전트 컨텍스트에서 시작한다. 다음 역할에 전체 대화, 내부 고민 과정, 전체 명령 로그 또는 원본 MCP 응답을 전달하지 않는다.
- 단계 간 handoff는 이슈와 인수 조건, 관련 파일, 확정된 결정, 생성된 산출물, 실제 테스트 결과와 남은 blocker만 구조화하여 전달한다.
- 간단한 handoff는 서브에이전트의 구조화된 결과 요약으로 전달한다. 여러 단계에서 재사용할 복잡한 결정이나 Figma Node 매핑만 파일로 기록한다.
- 파일 기반 handoff는 단일 공유 파일을 사용하지 않고 `.claude/handoffs/{issue-number}-{stage}.md` 형식으로 작업별 분리한다. 예: `.claude/handoffs/12-figma-analysis.md`.
- handoff 파일에는 전체 대화, 내부 추론, 코드 전문, 원본 MCP 응답과 전체 명령 로그를 복사하지 않는다. 다음 에이전트는 작업 지시에 명시된 handoff 파일만 읽는다.
- handoff 파일은 임시 산출물로 취급해 커밋하지 않고 `.gitignore`에 포함한다. PR에 남아야 하는 결정은 GitHub 이슈 또는 영구 문서로 옮긴다.
- 역할 전환마다 `/clear` 또는 `/compact` 실행을 강제하지 않는다. 메인 컨텍스트가 실제로 커졌을 때만 필요한 핵심 상태를 보존한 뒤 압축한다.
- 병렬 작업은 서로 다른 파일과 독립된 결과물일 때만 수행한다.
- 여러 에이전트가 코드를 동시에 수정할 때는 별도 git worktree와 브랜치를 사용한다.
- 서브에이전트는 지시 없이 commit, push, PR 생성, 의존성 추가를 하지 않는다.
- 리뷰 결과는 심각도, 파일 위치, 재현 근거와 수정 제안을 포함해야 한다.
- 리뷰 수정 후 관련 테스트와 전체 품질 명령을 다시 실행한다.
- 임시 구현과 규칙 예외는 원칙적으로 PR에 포함하지 않는다. 외부 API 미완성처럼 현재 작업에서 해결할 수 없는 명확한 이유가 있을 때만 영향 범위와 제거 조건을 기록하고 허용한다.
- 보안, 개인정보, 데이터 정합성 또는 테스트 우회와 관련된 기술 부채는 허용하지 않는다.
- 코드에 TODO가 필요하면 실제 추적 이슈 번호와 제거 조건을 포함해 `TODO(#123): 차량 API 제공 후 MSW fixture를 실제 adapter로 교체한다.` 형식으로 작성한다.
- 이슈 없는 `TODO`, `FIXME`, 주석 처리된 코드 또는 근거 없는 “추후 수정” 문구를 남기지 않는다.
- PR의 `Remaining Tasks`에는 관련 파일, 현재 영향, 후속 이슈와 제거 조건을 기록한다. 임시 구현이 남으면 해당 범위를 완전히 완료했다고 보고하지 않는다.
- acceptance criteria를 충족하고 후속 작업이 독립적으로 분리 가능한 경우에만 알려진 제한을 명시해 PR을 제출할 수 있다.
- `CLAUDE.md`와 `.claude/agents/**`는 Harness 제어 파일로 취급한다. 사용자가 Harness 수정을 명시적으로 요청한 작업에서만 변경한다.
- Harness 규칙이 비효율적이거나 작업과 충돌하더라도 에이전트가 임의로 삭제, 완화 또는 우회하지 않는다. 충돌한 규칙, 실제 영향과 구체적인 개선안을 사용자에게 보고한다.
- 승인된 Harness 변경은 기능 구현과 분리하고 변경 이유, 영향 범위와 검증 방법을 기록한다.
- 품질 검사를 통과시키기 위해 Harness 규칙, 테스트 또는 검사 명령을 수정하지 않는다.

## 9. GitHub 협업 규칙

GitHub에서 확인된 저장소 규칙을 따른다.

- 기본 및 PR 대상 브랜치: `develop`
- 기능 브랜치: `feature/{issue-number}-{short-kebab-description}`
- 예시: `feature/5-admin-dashboard-ui`
- 하나의 이슈는 하나의 검토 가능한 수직 기능을 기본 단위로 한다.
- 큰 화면 이슈는 공통 셸, 대시보드, 차량 목록, 차량 상세, 예약 관리처럼 하위 이슈와 PR로 분리한다.
- 사용자에게 구현 또는 이슈 수행을 요청받은 경우에만 GitHub 변경을 수행한다.
- 이슈 없이 작업을 시작하지 않는다. 기존 이슈가 없으면 인수 조건과 테스트 항목을 포함해 먼저 생성한다.
- 브랜치는 최신 `develop`에서 생성한다. 다른 작업자의 브랜치나 변경을 덮어쓰지 않는다.

커밋 메시지는 Conventional Commits 형식을 사용한다.

```text
feat: 관리자 차량 상태 필터 추가
fix: 무한 스크롤 중복 요청 방지
test: 차량 목록 오류 상태 검증
refactor: 차량 API 응답 변환 분리
docs: 관리자 개발 규칙 추가
chore: 테스트 환경 구성
```

- 커밋 하나는 한 가지 논리적 변경만 포함한다.
- 품질 검사가 실패한 상태에서는 commit 또는 PR을 만들지 않는다.
- 비밀 값, `.env*`, 생성물, 무관한 사용자 변경을 commit하지 않는다.
- force push, hook 우회, 무단 amend를 하지 않는다.

PR에는 다음을 포함한다.

- 제목: 커밋 규칙과 일치하는 간결한 제목
- 연관 이슈: `Closes #{issue-number}`
- 작업 내용: 사용자에게 보이는 변화와 주요 구현 결정
- 테스트: 실제 실행한 명령과 결과
- 스크린샷: UI 변경의 주요 viewport
- 남은 작업 또는 알려진 제한

CI 통과와 독립 리뷰 반영 후에만 ready 상태로 전환한다. merge는 사용자 또는 지정 리뷰어가 수행하며, review-agent `APPROVE`를 전제로 한다(§0.9).

## 10. 작업 절차

1. 현재 branch, working tree, 관련 이슈와 Figma/API 자료를 확인한다.
2. 사용자 변경을 보존하고 작업을 수직 기능으로 분해한다.
3. 이슈의 인수 조건과 테스트 계획을 확정한다.
4. 필요한 조사만 읽기 전용 서브에이전트에 위임한다.
5. 최소 범위로 구현하고 관련 테스트를 작성한다.
6. 품질 명령을 모두 실행한다.
7. 별도 reviewer로 diff를 검토하고 발견 사항을 수정한다.
8. 품질 명령을 다시 실행한다.
9. 제출 전 자가 점검과 문서 동기화를 완료한다.
10. 승인된 범위에서 commit, push, PR을 생성하고 이슈를 연결한다.

### 제출 전 자가 점검

- commit, PR 또는 완료 보고 전에 `git diff --name-only`와 전체 diff를 확인한다.
- 체크리스트 보호 경로, 작업 범위 밖 파일 또는 다른 사용자의 변경을 수정하지 않았는지 확인한다.
- 새 의존성, 임시 코드, 미추적 TODO와 placeholder가 있는지 확인하고 허용 근거와 후속 이슈가 없는 항목은 제거한다.
- 서버와 클라이언트 경계, 상태 중복, 캐시 무효화, 환경 변수와 개인정보 규칙 위반이 없는지 확인한다.
- 공유 파일 변경이 `/rental-checklist`에 회귀를 일으킬 가능성을 검토하고 필요한 회귀 테스트를 실행한다.
- 코드 변경에 필요한 테스트와 문서가 함께 갱신되었는지 확인한다.
- 자가 점검은 독립 reviewer의 diff 검토를 대체하지 않는다.

### 문서 동기화

- 실행 방법, 환경 변수, 공개 API 계약, route 구조, 주요 아키텍처 또는 개발 절차가 변경되면 같은 PR에서 README와 관련 `docs/`를 갱신한다.
- 코드와 문서가 충돌하면 코드만 완료 처리하지 않는다. 현재 동작, 설정 예시와 테스트 명령이 실제 저장소 상태와 일치하는지 확인한다.
- 내부 구현 세부사항처럼 쉽게 낡는 내용은 불필요하게 문서화하지 않는다. 임시 제한은 영구 문서 대신 이슈와 PR의 `Remaining Tasks`에서 관리한다.

### 모호한 요구사항 대응

- 요구사항이 모호하면 영향도와 되돌리기 비용을 기준으로 사용자 결정이 필요한지 판단한다.
- 제품 동작, API 계약, 데이터 손실, 보안과 개인정보, 접근 권한, URL 구조 또는 디자인 핵심 의도처럼 해석에 따라 결과가 크게 달라지면 해당 부분 구현을 중단하고 질문한다.
- 네이밍, 내부 파일 분리 또는 비파괴적인 UI 기본값처럼 쉽게 되돌릴 수 있는 기술적 선택은 저장소 관례를 우선하고 가정을 기록한 뒤 진행할 수 있다.
- 일부만 모호하면 확정된 영역은 계속 진행하고 모호한 부분만 blocker로 분리한다.
- 가정은 구현 전에 이슈 또는 handoff에 근거와 영향 범위를 기록하고 PR의 `Assumptions`에 포함한다. 가정을 API 계약이나 확정 요구사항처럼 표현하지 않는다.
- 가정은 기본적으로 이슈, handoff와 PR에서 관리한다. 코드만 읽어서는 이해하기 어려운 가정이 실제 동작에 직접 영향을 줄 때만 해당 로직 근처에 간결하게 “왜”를 설명한다.
- 제거가 필요한 임시 구현은 별도 `@assumption` 태그를 만들지 않고 기존 `TODO(#issue-number): 이유와 제거 조건` 형식을 사용한다.
- API에 정의되지 않은 필드, 보안 예외 또는 데이터 정합성 문제를 assumption이나 TODO로 정당화하여 구현하지 않는다.
- 장기간 유지되는 아키텍처 결정은 반복적인 코드 주석 대신 GitHub 이슈 또는 영구 결정 문서에 기록하고 필요한 코드 위치에서 해당 근거를 참조한다.
- 질문하기 전에 코드, Figma, API 명세, 이슈와 저장소 규칙에서 답을 확인한다. 이미 확인 가능한 내용을 사용자에게 다시 묻지 않는다.
- 질문은 한 번에 핵심 결정 1~2개로 제한하고 선택지별 장단점, 코드 영향 범위와 추천 선택지를 함께 제시한다. 단순히 “어떻게 할까요?”라고 묻지 않는다.

완료 보고에는 변경 요약, 테스트 결과, 알려진 제한, PR 링크를 포함한다.
