import "./globals.css";
import { ThemeProvider } from "./contexts/ThemeContext";
import ThemeRoot from "./ThemeRoot";
import type { Viewport } from "next";

export const metadata = {
  title: "ระบบบันทึกประสบการณ์นิสิตพยาบาล",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // 1. สร้าง <html> ที่นี่
    <html lang="th" suppressHydrationWarning>
      {/* suppressHydrationWarning แนะนำให้ใส่เมื่อมีการเปลี่ยน class จาก client-side */}
      {/* 2. สร้าง <body> ที่นี่ */}
      <body>
        {/* 3. ให้ Provider และ Root ครอบ children อยู่ข้างใน body */}
        <ThemeProvider>
          <ThemeRoot>{children}</ThemeRoot>
        </ThemeProvider>
      </body>
    </html>
  );
}
