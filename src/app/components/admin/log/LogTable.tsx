"use client";
import React from "react";

const actionMap = {
  create: "สร้าง",
  update: "อัปเดต",
  delete: "ลบ",
  import: "อัปโหลด",
};

const badgeClass = {
  create: "bg-green-100 text-green-600 before:bg-green-500",
  update: "bg-blue-100 text-blue-600 before:bg-blue-500",
  delete: "bg-red-100 text-red-600 before:bg-red-500",
  import: "bg-purple-100 text-purple-600 before:bg-purple-500",
};

type LogAction = "create" | "update" | "delete" | "import";

interface AdminLog {
  id: number;
  action: LogAction;
  entity: string;
  description: string;
  createdAt: string;
}

export default function LogTable({ data }: { data: AdminLog[] }) {
  const getEntityDisplayName = (entity: string) => {
    switch (entity) {
      case "ExperienceBook":
        return "เล่มบันทึก";
      case "User":
        return "ผู้ใช้";
      case "FieldConfig":
        return "รายละเอียดเล่ม";
      default:
        return entity;
    }
  };

  {
    /* กรณีไม่มีข้อมูล */
  }
  if (data.length === 0) {
    return (
      <div className="p-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-indigo-100 rounded-full">
          <svg
            className="w-8 h-8 text-indigo-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900">ไม่พบข้อมูล</h3>
        <p className="mt-1 text-gray-500">
          ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาของคุณ
        </p>
        <button className="px-4 py-2 mt-4 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
          ล้างตัวกรอง
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-white dark:bg-[#1E293B] border border-gray-200 dark:border-slate-700 shadow-sm rounded-xl overflow-hidden">
      {/* Header (แสดงเฉพาะจอใหญ่) */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 font-medium text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-cyan-600 dark:to-cyan-500">
        <div className="col-span-2">การกระทำ</div>
        <div className="col-span-2">เป้าหมาย</div>
        <div className="col-span-5">รายละเอียด</div>
        <div className="col-span-3">เวลาที่กระทำ</div>
      </div>
      {/* List of Logs (Card on mobile, Row on desktop) */}
      <div className="flex flex-col">
        {data.map((log, index) => (
          <div
            key={log.id}
            className={`grid grid-cols-1 md:grid-cols-12 gap-x-4 gap-y-2 p-4 md:p-0 md:px-6 md:py-4 transition items-center ${index < data.length - 1 ? "border-b border-gray-200 dark:border-slate-700" : ""} hover:bg-indigo-50 dark:hover:bg-slate-700/50`}
          >
            {/* Column 1: Action */}
            <div className="md:col-span-2">
              <span className="md:hidden text-xs font-bold text-gray-500 dark:text-white">
                การกระทำ:
              </span>
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${badgeClass[log.action] || ""} before:content-[''] before:w-2 before:h-2 before:rounded-full`}
              >
                {actionMap[log.action]}
              </span>
            </div>

            {/* Column 2: Entity */}
            <div className="md:col-span-2">
              <span className="md:hidden text-xs font-bold text-gray-500 dark:text-white">
                เป้าหมาย:
              </span>
              <span className="inline-block px-3 py-1 text-sm dark:bg-slate-700 dark:text-gray-300 font-medium bg-white border border-gray-300 dark:border-slate-600 rounded">
                {getEntityDisplayName(log.entity)}
              </span>
            </div>

            {/* Column 3: Description */}
            <div className="md:col-span-5">
              <span className="md:hidden text-xs font-bold text-gray-500 dark:text-white">
                รายละเอียด:
              </span>
              <span className="text-sm text-gray-800 dark:text-gray-300">
                {log.description}
              </span>
            </div>

            {/* Column 4: Timestamp */}
            <div className="md:col-span-3">
              <span className="md:hidden text-xs font-bold text-gray-500 dark:text-white">
                เวลาที่กระทำ:
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {new Date(log.createdAt).toLocaleString("th-TH", {
                  year: "numeric",
                  month: "2-digit",
                  day: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
