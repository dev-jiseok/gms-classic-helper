import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GMS Classic Helper · 우리들의 클래식 모험",
  description: "GMS 클래식 도감, 퀘스트, 육성 공략과 우리 파티의 사냥 효율을 한곳에서.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
