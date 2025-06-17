// components/approver/approved/RequestCard.tsx
"use client";

import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Role } from "lib/type";
import { ExperienceRequest } from "@/app/approver/approved/page";

type Props = {
  req: ExperienceRequest;
  selected: boolean;
  onCheckAction: (checked: boolean) => void;
  onConfirmAction: (pin?: string) => Promise<void>;
  onRejectAction: (pin?: string) => Promise<void>;
  currentUserRole?: Role;
};

export default function RequestCard({
  req,
  selected,
  onCheckAction,
  onConfirmAction,
  onRejectAction,
  currentUserRole,
}: Props) {
  return (
    <div className="relative bg-white dark:bg-[#1E293B] hover:-translate-y-1 hover:shadow-lg transition-all dark:text-white rounded-xl shadow overflow-hidden">
      <div className="absolute top-4 left-4 ">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onCheckAction(e.target.checked)}
          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
        />
      </div>
      <div className="p-6 mt-4">
        <h3 className="text-base sm:text-lg font-semibold text-[#f46b45] dark:text-orange-400">
          {req.student?.user?.name || "ไม่พบชื่อนิสิต"} (รหัสนิสิต
          {req.student?.studentId || "N/A"})
        </h3>
        <div className="grid grid-cols-1 mt-2 mb-4 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
          <div className="flex items-start">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              หมวดหมู่:
            </span>
            <span className="ml-1 text-sm font-medium text-black dark:text-white">
              {/* [แก้ไข] เข้าถึง .name ของ course object */}
              {req.course?.name || "-"}
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              หมวดหมู่ย่อย:
            </span>
            <span className="ml-1 text-sm font-medium text-black dark:text-white">
              {/* [แก้ไข] เข้าถึง .name ของ subCourse object */}
              {req.subCourse?.name || "-"}
            </span>
          </div>
          {req.subject && (
            <div className="flex items-start">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ในวิชา:
              </span>
              <span className="ml-1 text-sm font-medium text-black dark:text-white">
                {req.subject}
              </span>
            </div>
          )}
          {req.fieldValues &&
            req.fieldValues.map((fv, i) => (
              <div key={i} className="flex items-start">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {fv.field?.label || "ข้อมูลเพิ่มเติม"}:
                </span>
                <span className="ml-1 text-sm font-medium ">
                  {fv.value || "-"}
                </span>
              </div>
            ))}
        </div>
        <div className="mt-1 mb-1 text-xs text-gray-600 dark:text-gray-400">
          <span className="">วันที่ส่งข้อมูล:</span>
          <span className="ml-1 text-black dark:text-white">
            {new Date(req.createdAt).toLocaleDateString("th-TH", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {req.status && (
          <div className="mt-2 mb-3">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                req.status === "CONFIRMED"
                  ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                  : req.status === "CANCEL"
                    ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100"
              }`}
            >
              {req.status === "CONFIRMED"
                ? "ยืนยันแล้ว"
                : req.status === "CANCEL"
                  ? "ปฏิเสธ/ยกเลิกแล้ว"
                  : "รอดำเนินการ"}
            </span>
          </div>
        )}
        <div className="flex flex-col pt-4 mt-4 space-y-2 border-t sm:flex-row sm:space-y-0 sm:space-x-2 sm:justify-end">
          <button
            onClick={() => onConfirmAction()}
            className="flex items-center justify-center w-full p-2 space-x-2 text-sm font-medium text-green-700 transition-colors bg-green-100 rounded-lg sm:w-auto hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
          >
            <FaCheck /> <span>ยืนยัน</span>
          </button>
          <button
            onClick={() => onRejectAction()}
            className="flex items-center justify-center w-full p-2 space-x-2 text-sm font-medium text-red-700 transition-colors bg-red-100 rounded-lg sm:w-auto hover:bg-red-200 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600"
          >
            <FaTimes /> <span>ปฏิเสธ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
