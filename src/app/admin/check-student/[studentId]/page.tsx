'use client';
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSession } from 'lib/session';
import AdminProgressClient from '@/app/components/admin/check-student/AdminProgressClient';

export default function AdminStudentProgressPage() {
  const { studentId } = useParams();
  const searchParams = useSearchParams();
  const studentNameParam = searchParams.get('name') || '';
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    getSession().then((sess) => {
      if (!sess) console.error('⛔ Session not found!');
      return;
    });
  }, []);

  if (!token) return <div className="p-6">Loading session...</div>;
  if (!studentId) return <div className="p-6">ไม่พบรหัสนิสิต</div>;

  const displayName = studentNameParam || studentId;

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
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

      <div className="p-3 mb-6 mt-3 dark:text-white bg-white dark:bg-[#1E293B] text-gray-800 rounded-xl shadow-md transition-shadow duration-300 min-w-auto">
        <h2 className="text-lg font-semibold sm:text-xl ">🔍 {displayName}</h2>
      </div>

      <AdminProgressClient accessToken={token} studentId={Number(studentId)} />
    </div>
  );
}
