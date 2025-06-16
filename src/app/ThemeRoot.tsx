"use client";

// ไม่จำเป็นต้อง import useTheme แล้ว เพราะ ThemeProvider จัดการ class ให้แล้ว
// เราแค่ต้องการคอมโพเนนต์นี้เพื่อส่งผ่าน children

export default function ThemeRoot({ children }: { children: React.ReactNode }) {
  // ทำให้มันเป็นเพียง "ท่อ" ที่ส่งข้อมูลผ่านไปเฉยๆ
  return <>{children}</>;
}
