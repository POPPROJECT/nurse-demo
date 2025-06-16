// app/approver/ApproverClientLayout.tsx
"use client";
import React from "react";
import NavbarApprover from "@/app/components/approver/NavbarApprover";
import SidebarApprover from "@/app/components/approver/SidebarApprover";
import Footer from "@/app/components/Footer"; // ✅ 1. Import Footer ของคุณ

interface ApproverClientLayoutProps {
  children: React.ReactNode;
  role: "APPROVER_IN" | "APPROVER_OUT";
}

export default function ApproverClientLayout({
  children,
  role,
}: ApproverClientLayoutProps) {
  return (
    // ✅ 2. ทำให้ div หลักเป็น flex container แนวตั้ง และสูงเต็มหน้าจอ
    <div className="flex flex-col min-h-screen bg-gray-100 dark:bg-[#0F172A]">
      <NavbarApprover role={role} />

      {/* ✅ 3. สร้าง container กลางให้ยืดขยายเต็มพื้นที่ที่เหลือในแนวสูง */}
      <div className="flex flex-1">
        <SidebarApprover role={role} />

        {/* ✅ 4. ให้ main ยืดขยายในแนวนอนและจัดการ margin ให้ถูกต้อง */}
        <main className="flex-1 p-6 mt-10 sm:mt-0">{children}</main>
      </div>

      {/* ✅ 5. นำ Footer กลับมาใช้งานและวางไว้นอกสุด เพื่อให้ถูกดันลงไปอยู่ข้างล่าง */}
      <Footer />
    </div>
  );
}
