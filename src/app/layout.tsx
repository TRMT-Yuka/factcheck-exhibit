import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "ファクトチェック優先度 展示アプリ",
  description: "人間と判定システムの優先度判断を比較する展示用Webアプリ"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
