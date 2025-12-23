import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI 你画我猜",
  description: "在线你画我猜，AI 负责猜测你的画作"
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="app-shell">
          {children}
        </div>
      </body>
    </html>
  );
}
