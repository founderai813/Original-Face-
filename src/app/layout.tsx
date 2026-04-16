import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "本來面目｜五行自我探索",
  description:
    "東方版塔羅，用五行認識自己。遊戲結束後輸入生辰八字，獲得你的命盤報告。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
