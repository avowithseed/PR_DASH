import "./globals.css";

export const metadata = {
  title: "더불어민주당 홍보위원회 - 홍보통합 대시보드",
  description: "홍보통합 대시보드",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
