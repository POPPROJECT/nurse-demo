"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import AdminProgressClient from "@/app/components/admin/check-student/AdminProgressClient";
import { useAuth } from "@/app/contexts/AuthContext";

export default function AdminStudentProgressPage() {
  const { studentId } = useParams();
  const searchParams = useSearchParams();
  const studentNameParam = searchParams.get("name") || "";
  const studentIdStringParam = searchParams.get("studentId") || ""; // <-- อ่านค่ารหัสนิสิต

  const { accessToken, session: authUser } = useAuth(); // ✅ 2. ดึง accessToken และ user จาก Context
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ✅ ตรวจสอบ accessToken จาก Context เมื่อ Component mount
    // AdminLayout ควรจะป้องกันเส้นทางนี้อยู่แล้ว ถ้าไม่มี session จริงๆ จะถูก redirect ไปก่อน
    if (accessToken) {
      setIsLoading(false); // ถ้ามี token ก็พร้อมใช้งาน
    } else if (authUser === null && accessToken === null) {
      // กรณีที่ AuthProvider บอกว่าไม่มี session (อาจจะหลัง logout หรือ session หมดอายุจริงๆ)
      // AdminLayout ควรจะ redirect ไปแล้ว แต่ถ้ามาถึงตรงนี้ได้ ก็อาจจะ redirect ซ้ำอีกที
      // หรือแสดงข้อความว่า session หมดอายุ
      console.error(
        "⛔ [AdminStudentProgressPage] No session found in AuthContext.",
      );
      // window.location.href = '/'; // ไม่ควร redirect จากที่นี่ ปล่อยให้ AdminLayout จัดการ
      setIsLoading(false); // เพื่อให้ UI แสดงผลว่ามีปัญหา
    }
    // ถ้า authUser กำลังโหลด (ถ้า Context มี state loading ของตัวเอง) ก็ให้ isLoading เป็น true ต่อไป
  }, [accessToken, authUser]);

  // ✅ แสดง Loading UI ขณะรอ accessToken จาก Context หรือกำลังตรวจสอบ
  if (isLoading)
    return <div className="p-6 text-center">Loading session...</div>;

  // ✅ ถ้าไม่มี accessToken จริงๆ (หลังจาก Context โหลดแล้ว) แสดงข้อความให้ Login ใหม่
  // AdminLayout ควรจะดักจับกรณีนี้ไปแล้ว แต่ใส่ไว้เผื่อ
  if (!accessToken) {
    return (
      <div className="p-6 text-center text-red-500">
        Session not available. Please
        <Link href="/" className="underline">
          login
        </Link>
        again.
      </div>
    );
  }

  if (!studentId) return <div className="p-6">ไม่พบรหัสนิสิต</div>;

  const displayName = studentNameParam || studentId.toString(); // studentId อาจจะเป็น string[]

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto">
      {/* ปุ่มย้อนกลับ */}
      <Link
        href="/admin/edituser/student"
        className="inline-flex items-center mb-4 text-gray-600 transition-colors dark:text-white hover:text-gray-800"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        กลับไปหน้าจัดการบัญชีนิสิต
      </Link>

      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">
          ตรวจสอบความคืบหน้า
        </h1>
      </div>

      <div className="p-3 mt-3 dark:text-white bg-white dark:bg-[#1E293B] text-gray-800 rounded-xl shadow-md transition-shadow duration-300 min-w-auto">
        <h1 className="text-lg font-semibold sm:text-xl ml-3">
          <span>{displayName}</span>
          <span style={{ marginLeft: "1.5rem" }}>
            รหัสนิสิต: {studentIdStringParam}
          </span>
        </h1>
      </div>

      <AdminProgressClient
        accessToken={accessToken}
        studentId={Number(studentId)}
      />
    </div>
  );
}
