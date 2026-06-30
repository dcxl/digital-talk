import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Next Digital Human",
  description: "Open source AI digital human framework.",
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

