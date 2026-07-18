import type { Metadata, Viewport } from "next";
import "@fontsource-variable/asta-sans";
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "모타 차량 인수 체크리스트",
  description: "렌트 차량 인수 전 상태를 점검하고 제출합니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}