# mota-frontend-web

모타 렌트 차량 인수 **체크리스트** 프론트엔드입니다. 차량에 부착된 QR을 스캔하면
`/rental-checklist?token=...` 로 진입해, 백엔드 API와 연동하여 체크리스트를 제출합니다.

- 프레임워크: Next.js 14 (App Router) + TypeScript
- 배포: Vercel
- 백엔드 API: `mota_backend` (Spring Boot)

## 화면 흐름

1. `?token=` 쿼리에서 토큰을 읽음
2. `GET /api/checklists/tokens/{token}` — 토큰 검증 + 차량 정보
3. `GET /api/checklists/questions` — 점검 항목 목록
4. `POST /api/checklists/submissions` (multipart) — 답변 + 사진 제출

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # NEXT_PUBLIC_API_BASE 를 백엔드 주소로
npm run dev                  # http://localhost:3000
```

테스트 URL 예: `http://localhost:3000/rental-checklist?token=<발급된 토큰>`

## 품질 검사

PR 전 또는 CI와 동일하게 아래를 실행합니다.

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 환경 변수

| 이름 | 설명 | 예시 |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE` | 백엔드 API 주소 (운영은 반드시 https) | `https://api.your-domain.com` |

## Vercel 배포

### 1. 코드 푸시
이 폴더를 별도 Git 저장소로 올리거나, 모노레포로 두고 Vercel의 **Root Directory**를
`mota_frontend_web` 으로 지정합니다.

### 2. Vercel 프로젝트 생성
- [vercel.com](https://vercel.com) → **Add New → Project** → 저장소 선택
- Framework Preset: **Next.js** (자동 감지)
- Root Directory: `mota_frontend_web` (모노레포인 경우)

### 3. 환경 변수 등록
Project → **Settings → Environment Variables**

```
NEXT_PUBLIC_API_BASE = https://api.your-domain.com
```

Production / Preview 모두 등록.

### 4. 배포
```bash
npm i -g vercel
vercel          # 프리뷰 배포
vercel --prod   # 운영 배포
```

배포 후 나오는 도메인(예: `https://mota-checklist.vercel.app`)을 **백엔드의
`FRONTEND_DOMAIN` 환경 변수**에 넣어야 QR 링크가 이 프론트로 연결됩니다.

## 백엔드에서 함께 확인할 것

1. **`FRONTEND_DOMAIN`** — 발급되는 QR/링크의 도메인. Vercel 도메인으로 설정.
2. **CORS** — 이 프론트(vercel.app)에서 백엔드 API를 호출하므로, 백엔드에서
   해당 오리진을 허용해야 함.
3. **HTTPS** — Vercel은 https이므로 백엔드 API도 https여야 함 (mixed-content 차단).
