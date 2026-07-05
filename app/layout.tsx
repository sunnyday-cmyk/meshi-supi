import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeshiSpin | みんなで楽しくお店を決めるグループ投票アプリ",
  description:
    "MeshiSpinは、友達や同僚と近くのレストランを探して投票・ルーレットで店を決められるWebアプリです。ジャンルや予算の条件設定、QR招待、リアルタイム投票に対応。",
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
