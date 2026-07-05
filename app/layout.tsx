import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MeshiSpin",
  description: "友達とお店選びを楽しむゲーム風Webアプリ"
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
