"use client";
import React, { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import ApproverProgressClient from "@/app/components/approver/check-student/ApproverProgressClient";
import { getSession } from "lib/session";

export default function StudentProgressPage() {
  const { studentId } = useParams();
  const searchParams = useSearchParams();
  const studentNameParam = searchParams.get("name") || "";
  const studentIdStringParam = searchParams.get("studentId") || ""; // <-- อ่านค่ารหัสนิสิต
  const [token, setToken] = useState<string>("");

  useEffect(() => {
    getSession().then((sess) => {
      if (!sess) return (window.location.href = "/");
      setToken(sess.accessToken);
    });
  }, []);

  if (!token || !studentId) return <div>Loading...</div>;

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      {/* ปุ่มย้อนกลับ */}
      <Link
        href="/approver/check-student"
        className="inline-flex items-center mb-4 text-gray-600 transition-colors hover:text-gray-800"
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
        กลับไปหน้ารายงานผลของนิสิต
      </Link>

      {/* Header */}
      <div className="p-4 text-white rounded-lg shadow bg-gradient-to-r from-orange-400 to-yellow-400">
        <h1 className="text-2xl font-semibold">ตรวจสอบความคืบหน้า</h1>
      </div>

      <div className="p-3 mb-2 mt-3 dark:text-white bg-white dark:bg-[#1E293B] text-gray-800 rounded-xl shadow-md transition-shadow duration-300 min-w-auto">
        <h2 className="text-lg sm:text-xl ml-4">
          <span>{studentNameParam}</span>
          <span style={{ marginLeft: "1.5rem" }}>
            รหัสนิสิต: {studentIdStringParam}
          </span>
        </h2>
      </div>

      <ApproverProgressClient
        accessToken={token}
        studentId={Number(studentId)}
      />
    </div>
  );
}
