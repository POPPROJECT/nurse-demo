"use client";

import { ExperienceStatus } from "lib/type";
import React from "react";

interface CourseInfo {
  name: string;
}

// ... (Interface Record เหมือนเดิม) ...
type Record = {
  id: number;
  student: { studentId: string; user: { name: string } };
  course: CourseInfo;
  subCourse: CourseInfo;
  status: ExperienceStatus;
  createdAt: string;
};

type Props = {
  data: Record[];
};

export default function LogTable({ data }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Header (แสดงเฉพาะจอใหญ่) */}
      <div className="hidden md:grid md:grid-cols-7 gap-4 px-4 py-2 font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 rounded-t-lg">
        <div>รหัสนิสิต</div>
        <div className="col-span-2">ชื่อ-นามสกุล</div>
        <div>หมวดหมู่</div>
        <div>หมวดหมู่ย่อย</div>
        <div>วันที่</div>
        <div className="text-center">สถานะ</div>
      </div>

      {/* List of Logs (Card on mobile) */}
      <div className="flex flex-col">
        {data.length > 0 ? (
          data.map((r, index) => (
            <div
              key={r.id}
              className={`grid grid-cols-2 md:grid-cols-7 gap-x-4 gap-y-2 p-4 items-center text-sm ${index < data.length - 1 ? "border-b border-gray-200 dark:border-slate-700" : ""}`}
            >
              <div className="text-gray-800 dark:text-gray-200">
                <span className="font-semibold md:hidden">รหัสนิสิต: </span>
                {r.student.studentId}
              </div>
              <div className="col-span-2 text-gray-800 dark:text-gray-200">
                <span className="font-semibold md:hidden">ชื่อ: </span>
                {r.student.user.name}
              </div>
              {/* Course Name */}
              <div className="text-gray-800 dark:text-gray-200">
                <span className="font-semibold md:hidden">หมวดหมู่: </span>
                {r.course?.name || "-"} {/* [แก้ไข] เข้าถึง .name */}
              </div>
              {/* SubCourse Name (เพิ่มใหม่) */}
              <div className="text-gray-800 dark:text-gray-200">
                <span className="font-semibold md:hidden">หมวดหมู่ย่อย: </span>
                {r.subCourse?.name || "-"} {/* [แก้ไข] เข้าถึง .name */}
              </div>
              <div className="text-gray-600 dark:text-gray-400">
                <span className="font-semibold md:hidden text-gray-800 dark:text-gray-200">
                  วันที่:{" "}
                </span>
                {new Date(r.createdAt).toLocaleDateString("th-TH")}
              </div>

              <div className="text-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${r.status === "CONFIRMED" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                >
                  {r.status === "CONFIRMED" ? "อนุมัติ" : "ปฏิเสธ"}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500">ไม่พบข้อมูล</div>
        )}
      </div>
    </div>
  );
}
