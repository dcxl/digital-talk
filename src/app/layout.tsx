import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Character Platform",
  description: "创建、管理和运行 AI 角色的平台。",
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
