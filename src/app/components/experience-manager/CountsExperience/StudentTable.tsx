"use client";
import React from "react";
import { FaPlus, FaSort, FaSortDown, FaSortUp } from "react-icons/fa";
import { GrView } from "react-icons/gr";
import { useRouter } from "next/navigation";

type Student = {
  id: number;
  studentId: string;
  name: string;
  done: number;
  total: number;
  percent: number;
};

type Props = {
  data: Student[];
  sortBy: "studentId" | "name" | "percent";
  order: "asc" | "desc";
  onSortAction: (col: "studentId" | "name" | "percent") => void;
};

const getProgressBarColor = (percent: number) => {
  if (percent >= 100) return "bg-green-500";
  if (percent >= 50) return "bg-blue-500";
  return "bg-amber-500";
};

const HEADERS: { key: Props["sortBy"]; label: string; span: number }[] = [
  { key: "studentId", label: "รหัสนิสิต", span: 3 },
  { key: "name", label: "ชื่อ-นามสกุล", span: 4 },
  { key: "percent", label: "ความคืบหน้า", span: 3 },
];

export default function StudentTable({
  data,
  sortBy,
  order,
  onSortAction,
}: Props) {
  const router = useRouter();

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
      {/* Desktop Header */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 rounded-t-lg">
        {HEADERS.map((h) => (
          <div
            key={h.key}
            onClick={() => onSortAction(h.key)}
            // --- ✅ 1. แก้ไข col-span ใน Header ---
            className={`col-span-${h.span} cursor-pointer group flex items-center gap-2`}
          >
            <span>{h.label}</span>
            <span className="p-1 transition-colors rounded-full group-hover:bg-indigo-100 dark:group-hover:bg-slate-600">
              {sortBy !== h.key && (
                <FaSort className="text-gray-400 dark:text-gray-500" />
              )}
              {sortBy === h.key && order === "asc" && (
                <FaSortUp className="text-indigo-600 dark:text-indigo-400" />
              )}
              {sortBy === h.key && order === "desc" && (
                <FaSortDown className="text-indigo-600 dark:text-indigo-400" />
              )}
            </span>
          </div>
        ))}
        {/* จัดการ: 3 + 4 + 3 = 10, เหลือ 2 col */}
        <div className="col-span-2 text-center">จัดการ</div>
      </div>

      {/* List of Students (Card on mobile) */}
      <div className="flex flex-col">
        {data.length > 0 ? (
          data.map((s, index) => (
            <div
              key={s.id}
              className={`flex flex-col md:grid md:grid-cols-12 md:gap-x-4 p-4 md:items-center text-gray-800 dark:text-gray-300 ${index < data.length - 1 ? "border-b border-gray-200 dark:border-slate-700" : ""}`}
            >
              {/* --- ✅ 2. แก้ไข col-span ใน Body ให้ตรงกับ Header --- */}
              <div className="md:col-span-3 text-sm">
                <span className="font-semibold md:hidden">รหัสนิสิต: </span>
                {s.studentId}
              </div>
              <div className="md:col-span-4 text-sm">
                <span className="font-semibold md:hidden">ชื่อ: </span>
                {s.name}
              </div>

              <div className="mt-2 md:mt-0 md:col-span-3 text-sm">
                <span className="font-semibold md:hidden">ความคืบหน้า: </span>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-gray-200 rounded-full dark:bg-slate-600">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${getProgressBarColor(s.percent)}`}
                      style={{ width: `${s.percent}%` }}
                    />
                  </div>
                  <span className="font-medium text-xs whitespace-nowrap">
                    {s.percent}% ({s.done}/{s.total})
                  </span>
                </div>
              </div>

              <div className="flex justify-end items-center gap-2 mt-4 md:mt-0 md:col-span-2 md:justify-center">
                <button
                  className="p-2 text-white transition-colors bg-blue-500 rounded-full hover:bg-blue-600"
                  title="เพิ่ม/ดูข้อมูลประสบการณ์"
                  onClick={() => {
                    const nameParam = encodeURIComponent(s.name);
                    router.push(
                      `/experience-manager/CountsExperience/${s.studentId}?name=${nameParam}`,
                    );
                  }}
                >
                  <FaPlus size={12} />
                </button>
                <button
                  className="p-2 text-gray-700 transition-colors bg-gray-200 rounded-full hover:bg-gray-300 dark:bg-slate-600 dark:text-gray-200 dark:hover:bg-slate-500"
                  title="ดูประวัติการบันทึก"
                  onClick={() => {
                    const nameParam = encodeURIComponent(s.name);
                    router.push(
                      `/experience-manager/CountsExperience/history/${s.studentId}?name=${nameParam}`,
                    );
                  }}
                >
                  <GrView size={12} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            ไม่มีข้อมูลนิสิต
          </div>
        )}
      </div>
    </div>
  );
}
