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
        "dashboard-sidebar": "#0f0f10", // Sidebar 배경 (node 2483:30897)
        "dashboard-nav-active": "rgba(128,124,255,0.2)", // 활성 메뉴 배경
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
      },
      borderRadius: {
        card: "12px",
        btn: "18px",
        "dashboard-nav": "10px", // 비활성 사이드바 메뉴 radius (표준 스케일 밖 값, node 2483:30897)
        "dashboard-card": "24px", // 요약 카드 radius (node 2361:23653 등), 기존 `card`(12px)와 별개
      },
      boxShadow: {
        "dashboard-card": "0px 2px 8px rgba(0,0,0,0.08)", // 요약 카드 그림자 (node 2361:23652 하위)
      },
    },
  },
  plugins: [],
};

export default config;
