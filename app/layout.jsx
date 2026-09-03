import "./globals.css";

export const metadata = {
  title: "홍보통합 대시보드",
  description: "캠페인 현장 운영 현황 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
