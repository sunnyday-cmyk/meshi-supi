import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "飯スピ | MeshiSpin - グループでご飯をゲーム感覚で決めるアプリ",
  description:
    "飯スピ（MeshiSpin）は友達グループでご飯の場所をルーレットや投票で楽しく決めるWebアプリです。",
  keywords: "飯スピ, MeshiSpin, グループ, ご飯, 飯, 決める, ルーレット, 投票",
  verification: {
    google: "nYnsReuq__-1a0mO_P929c66GJcTQhweDfBfVPwEUYI"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="body-font">{children}</body>
    </html>
  );
}
