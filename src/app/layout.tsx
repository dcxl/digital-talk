import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "下一代数字人",
  description: "开源 AI 数字人框架。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
