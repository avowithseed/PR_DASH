import "./globals.css";

export const metadata = {
  title: "더불어민주당 홍보위원회 - 홍보통합 대시보드",
  description: "홍보통합 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <head>
        {/* 프리텐다드 - 전체 기본 폰트 */}
        <link
          rel="stylesheet"
          as="style"
          crossOrigin=""
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
