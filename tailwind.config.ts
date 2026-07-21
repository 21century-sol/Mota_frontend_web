import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        // Asta Sans (self-hosted via @fontsource-variable) is the design font.
        sans: ["'Asta Sans Variable'", "system-ui", "sans-serif"],
        // Dashboard-only stack (issue #38): Pretendard Variable (self-hosted
        // via `pretendard`) is the Korean fallback for admin screens. Kept
        // out of the shared `sans` key and applied via `font-dashboard-sans`
        // on `app/dashboard/layout.tsx` only, so `/rental-checklist` Korean
        // text keeps rendering through its existing `system-ui` fallback
        // unchanged (CLAUDE.md §3 — additive shared-file edits must not
        // change checklist styles).
        "dashboard-sans": [
          "'Asta Sans Variable'",
          "'Pretendard Variable'",
          "Pretendard",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        // Figma design tokens (mota QR mobile flow)
        ink: "#000000",
        "text-strong": "#424b53", // 강조 본문 (약관 전체 동의 등)
        "text-body": "#555555", // 기본 본문
        "text-sub": "#777777", // 보조/캡션 ((필수) 등)
        "text-disabled": "#a4a8ae", // 비활성 텍스트
        "fill-card": "#f3f3f3", // 카드 배경
        "btn-basic": "rgba(19,20,23,0.05)", // color_button_basic_enabled
        brand: "#5a46fa", // 브랜드 프라이머리 (활성 버튼/체크)
        "brand-soft": "rgba(90,70,250,0.1)", // 선택된 카드 배경

        // Dashboard shell tokens (Figma file JRL5IHK20Ocs9hfiGus7Xz, node 2361:23649).
        // Scoped to the dark admin Sidebar/TopBar palette — intentionally NOT shared
        // with the light /rental-checklist tokens above (different values, different theme).
        // 관리자 화면 프레임 배경 (Figma file nt8U8I48Rcfz8LGNqYvRZv, node 1:13203 "차량관리").
        // 기존 `dashboard-surface`(#f7f7f8, 검색창 배경)와 값이 미세하게 달라 별도 토큰으로 등록한다.
        "dashboard-page-bg": "#f7f7fb", // TopBar/Main 콘텐츠 영역 배경
        "dashboard-sidebar": "#0f0f10", // Sidebar 배경 (node 2483:30897)
        "dashboard-nav-active": "rgba(128,124,255,0.2)", // 활성 메뉴 배경
        "dashboard-nav-active-icon": "#807CFF", // 활성 메뉴 아이콘 색(텍스트는 흰색 유지, 아이콘만 별도 색 — issue #40, node 1:12191)
        "dashboard-nav-inactive": "#c2c4c8", // 비활성 메뉴 텍스트
        "dashboard-nav-muted": "#8c8e91", // Settings 메뉴 텍스트
        "dashboard-border": "#eaebec", // TopBar 하단 보더 / 계정 pill 보더
        "dashboard-surface": "#f7f7f8", // Search box 배경
        "dashboard-search-border": "#30c1d9", // Search box 보더
        "dashboard-placeholder": "#989ba2", // Search placeholder 텍스트
        "dashboard-text": "#111111", // Search 입력값 텍스트
        "dashboard-account-text": "#5a5c63", // 계정/알림 아이콘 텍스트

        // Dashboard main-content (light background) tokens (Figma file
        // JRL5IHK20Ocs9hfiGus7Xz, node 2361:23652 "Stats Container"). Value equals
        // `dashboard-sidebar` (#0f0f10) but intentionally kept as a separate token —
        // that one is a dark Sidebar background, this is a light-surface text color
        // (Decision Resolved 2026-07-16, .claude/handoffs/11-figma-specs.md #2).
        "dashboard-text-primary": "#0f0f10", // 요약 카드 Label/Count 텍스트
        "dashboard-text-muted": "#70737c", // 요약 카드 Unit("대") 텍스트

        // Dashboard cost chart tokens (issue #13, Figma file JRL5IHK20Ocs9hfiGus7Xz,
        // node 2361:23748 "Stats Section"). `#5a55f2` is visually close to but
        // confirmed distinct from checklist `brand` (#5a46fa) — kept as its own token
        // (.claude/handoffs/13-figma-specs.md Token Mapping, resolved 2026-07-16).
        "dashboard-chart-accent": "#5a55f2", // current(올해) 라인 / 강조월 / 활성연도 / 증감%
        "dashboard-chart-accent-soft": "rgba(90,85,242,0.18)", // 활성 연도 pill 배경
        "dashboard-chart-axis": "#b2b2c2", // last(전년) 라인 / 비활성 월·축 라벨

        // Dashboard alerts + vehicle map tokens (issue #12, Figma file
        // JRL5IHK20Ocs9hfiGus7Xz, node 2377:23755 "Map and Alerts Container").
        // (.claude/handoffs/12-figma-specs.md Token Mapping, resolved 2026-07-16).
        "dashboard-alert-danger-bg": "rgba(254,61,22,0.1)", // 위험 알림 아이콘 배경
        "dashboard-alert-warning-bg": "rgba(255,138,0,0.1)", // 주의 알림 아이콘 배경
        "dashboard-text-tertiary": "#99a1ab", // 알림 시각 텍스트 / 지도 "전체" 링크
        "dashboard-divider": "#f0f0f0", // 알림 리스트 항목 구분선(review-agent Medium finding, 이전엔 arbitrary value로 중복)

        // Dashboard vehicle list tokens (issue #14, Figma file JRL5IHK20Ocs9hfiGus7Xz,
        // node 2467:25966 "Vehicle List Section" / 2467:25928 "Filter Tabs" /
        // 2722:28835 타이어 상태 필터). (.claude/handoffs/14-figma-specs.md Token
        // Mapping, resolved 2026-07-16).
        "dashboard-vehicles-border": "#e1e2e4", // 테이블/필터 보더
        "dashboard-vehicles-surface": "#f1f1f5", // 목록 영역 배경
        "dashboard-vehicles-label": "#878a93", // 테이블 헤더 라벨 / 보조 텍스트
        "dashboard-vehicles-title": "#2e2f33", // 차량정보 타이틀 텍스트
        // 선택된 타이어 상태 칩 배경. Figma 값 rgba(90,70,250,0.2)은 기존 `brand`
        // 토큰(#5a46fa ≈ rgb(90,70,250))의 20% 알파와 사실상 동일해 별도 hex 대신
        // 알파만 다른 파생 토큰으로 등록한다.
        "dashboard-chip-selected-bg": "rgba(90,70,250,0.2)",
        // 상태 뱃지 3색(대여 가능/대여 중/운행 불가). 배경은 Figma에 명시된 값이 아니라
        // 기존 알림 배지 규칙(`dashboard-alert-danger-bg` 등, 10% 알파)을 그대로 적용한
        // 파생값이다 — ui-agent 재량 판단(PM Decision 8), 실제 배경 스타일이
        // 필요하면 재검증 대상.
        "dashboard-status-available": "#16b338",
        "dashboard-status-rented": "#fb963d",
        "dashboard-status-repair": "#fb463d",
        "dashboard-status-available-bg": "rgba(22,179,56,0.1)",
        "dashboard-status-rented-bg": "rgba(251,150,61,0.1)",
        "dashboard-status-repair-bg": "rgba(251,70,61,0.1)",
        // Vehicle list thumbnail border (issue #35, Figma file nt8U8I48Rcfz8LGNqYvRZv,
        // node 1:13334 "Vehicle List Section"). `#eee` also happens to equal
        // `dashboard-reservation-page-border`, but that token is scoped to a
        // different domain (reservation pagination) — kept separate per
        // `.claude/handoffs/35-figma-analysis.md` Mismatch #3.
        "dashboard-vehicles-image-border": "#eee",

        // Dashboard vehicle detail tokens (issue #15, Figma file
        // nt8U8I48Rcfz8LGNqYvRZv, root 1:13715 / 1:14480). New values not present
        // in the #12 alert tokens above — intentionally NOT reused
        // (`.claude/handoffs/15-figma-specs.md` Token Mapping: different hex).
        "dashboard-tire-caution": "#ffbc01", // 타이어 주의(CAUTION) 강조 오버레이/배지
        "dashboard-tire-caution-bg": "rgba(255,188,1,0.16)",
        "dashboard-tire-warning": "#ff1935", // 타이어 위험(WARNING) 강조 오버레이/배지
        "dashboard-tire-warning-bg": "rgba(255,25,53,0.16)",
        "dashboard-usage-text": "#141415", // 이용 이력 탭 본문 텍스트
        "dashboard-usage-text-muted": "#909090", // 이용 이력 탭 전화번호 텍스트
        "dashboard-usage-text-subtle": "#969696", // 이용 이력 탭 리포트 링크 텍스트
        "dashboard-usage-alert": "#fe3d16", // 이용 이력 탭 알림건수 경고 아이콘 (issue #56, Figma 1:14659)

        // Dashboard reservations tokens (issue #16, Figma file nt8U8I48Rcfz8LGNqYvRZv,
        // root 11:27931 / 1:12430). (.claude/handoffs/16-figma-specs.md Token Mapping,
        // Safe Assumption A6.)
        "dashboard-accent-solid": "#5a46fa", // 선택 상태 탭 텍스트/언더라인
        // 예약 상태 배지 2색. `#fb963d`/`#969696`은 각각 기존 `dashboard-status-rented`
        // (차량 관리 "대여 중")와 `dashboard-usage-text-subtle`(이용 이력 탭 텍스트)의 hex와
        // 우연히 동일하지만, 이 화면의 배지는 다른 도메인(예약 상태)의 시맨틱 색상이라 별도
        // 토큰으로 분리한다 — `dashboard-text-primary` vs `dashboard-sidebar`(#11, 값은 같지만
        // 스코프가 다른 별개 토큰으로 유지)와 동일한 저장소 관례. `dashboard-usage-text-subtle`은
        // 계속 일반 텍스트 용도로만 쓰고(예: PDF 버튼 텍스트), 값이 나중에 바뀌어도 이 배지
        // 색상이 의도치 않게 함께 바뀌지 않도록 분리했다(main-agent 지시, 2026-07-17).
        "dashboard-reservation-status-rented": "#fb963d", // 배지 "대여 중"
        "dashboard-reservation-status-returned": "#969696", // 배지 "반납완료"
        "dashboard-reservation-page-border": "#eee", // 비활성 페이지네이션 숫자 버튼 보더

        // Reservation date-picker popover tokens (issue #29, Figma file
        // nt8U8I48Rcfz8LGNqYvRZv, node 1:12762 "달력"). (.claude/handoffs/29-figma-specs.md
        // Token Mapping — `#7e818c`/`#212225` are new hex values not covered by any
        // existing token; `dashboard-vehicles-border`/`dashboard-usage-text`/
        // `dashboard-placeholder`/`dashboard-accent-solid` are reused per Safe
        // Assumptions A9/A10/A11, not duplicated here.)
        "dashboard-reservation-calendar-weekday": "#7e818c", // 요일 헤더(일 월 화 수 목 금 토) 텍스트
        "dashboard-reservation-calendar-text": "#212225", // 날짜 셀 / 하단 버튼 / chevron 텍스트(A11)
      },
      borderRadius: {
        card: "12px",
        btn: "18px",
        "dashboard-nav": "10px", // 비활성 사이드바 메뉴 radius (표준 스케일 밖 값, node 2483:30897)
        "dashboard-card": "24px", // 요약 카드 radius (node 2361:23653 등), 기존 `card`(12px)와 별개
        "dashboard-banner": "20px", // 차량 상세 "점검 필요" 배너 radius (issue #15, node 1:13916)
        "dashboard-tire-card": "14px", // 타이어 카드 radius (issue #15)
      },
      boxShadow: {
        "dashboard-card": "0px 2px 8px rgba(0,0,0,0.08)", // 요약 카드 그림자 (node 2361:23652 하위)
        "dashboard-tire-card": "0px 14px 54px rgba(0,0,0,0.03)", // 타이어 카드 그림자 (issue #15)
        // 예약 날짜 팝오버 이중 그림자 (issue #29, node 1:12762 "달력").
        "dashboard-popover":
          "0px 2px 4px rgba(0,0,0,0.2), 8px 3px 22px 10px rgba(150,150,150,0.11)",
        // 차량 상세 "예약 내역" 카드 그림자 (issue #42, node 1:13775/1:14540,
        // `.claude/handoffs/42-figma-specs.md` Token Mapping). Registered under
        // `boxShadow` (not `dropShadow`, which this repo reserves for SVG
        // `filter: drop-shadow` elements like `dashboard-tooltip` below) since
        // this shadows a plain HTML card, matching `dashboard-card`/
        // `dashboard-tire-card`/`dashboard-popover` above.
        "dashboard-reservation-card": "0px 14px 27px rgba(0,0,0,0.03)",
      },
      dropShadow: {
        // 차트 강조 포인트 툴팁 그림자 (node 2361:23766). SVG 요소는 CSS `box-shadow`가
        // 적용되지 않아 `filter: drop-shadow(...)` 기반 유틸리티로 등록한다.
        "dashboard-tooltip": "0px 4px 10px rgba(77,77,128,0.12)",
      },
      // 타이어 상세 화면 펄스(맥동) 애니메이션 (issue #15, Figma node 1:4808
      // "타이어 이미지_FL"). 중심에 겹쳐진 동심 레이어 4개가 안→밖 순서로 순차 등장한 뒤
      // 동시에 페이드아웃하며 무한 반복한다. 한 사이클 1650ms = 등장 350ms × 4 + 소멸 250ms.
      // 각 레이어는 자기 등장 구간까지 opacity 0으로 대기 → 등장 → 소멸 시각(84.85%)까지 유지 →
      // 전 레이어가 100%에서 동시에 0으로 사라진다. 반투명 레이어는 등장 시 0.92→1로 살짝
      // 확대되고(코어는 확대 없음), 최대 불투명도는 바깥일수록 진하다(0.95/0.75/0.55, 코어 1).
      // 각 레이어는 translate(-50%,-50%)로 중앙 정렬되므로 scale은 이 변환에 합성한다.
      keyframes: {
        // 코어(가장 안쪽, 불투명): 확대 없이 페이드인만.
        "tire-pulse-core": {
          "0%": { opacity: "0" },
          "21.21%": { opacity: "1" },
          "84.85%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
        // 안쪽 반투명 레이어: 21.21%~42.42% 등장, peak 0.55.
        "tire-pulse-inner": {
          "0%, 21.21%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.92)" },
          "42.42%": { opacity: "0.55", transform: "translate(-50%, -50%) scale(1)" },
          "84.85%": { opacity: "0.55", transform: "translate(-50%, -50%) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -50%) scale(1)" },
        },
        // 중간 반투명 레이어: 42.42%~63.64% 등장, peak 0.75.
        "tire-pulse-mid": {
          "0%, 42.42%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.92)" },
          "63.64%": { opacity: "0.75", transform: "translate(-50%, -50%) scale(1)" },
          "84.85%": { opacity: "0.75", transform: "translate(-50%, -50%) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -50%) scale(1)" },
        },
        // 바깥 반투명 레이어: 63.64%~84.85% 등장, peak 0.95 (소멸 직전 도달).
        "tire-pulse-outer": {
          "0%, 63.64%": { opacity: "0", transform: "translate(-50%, -50%) scale(0.92)" },
          "84.85%": { opacity: "0.95", transform: "translate(-50%, -50%) scale(1)" },
          "100%": { opacity: "0", transform: "translate(-50%, -50%) scale(1)" },
        },
      },
      animation: {
        "tire-pulse-core": "tire-pulse-core 1650ms ease-in-out infinite",
        "tire-pulse-inner": "tire-pulse-inner 1650ms ease-in-out infinite",
        "tire-pulse-mid": "tire-pulse-mid 1650ms ease-in-out infinite",
        "tire-pulse-outer": "tire-pulse-outer 1650ms ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
