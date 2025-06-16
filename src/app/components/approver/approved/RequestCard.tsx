// components/approver/approved/RequestCard.tsx (หรือ Path ที่ถูกต้องของคุณ)
"use client";

import React from "react";
import { FaCheck, FaTimes } from "react-icons/fa";
import { Role } from "lib/type"; // ✅ Import Role type ถ้าจะใช้ currentUserRole
import { ExperienceRequest } from "@/app/approver/approved/page";

// Interface สำหรับข้อมูล Experience ที่แสดงใน Card
// (ควรจะตรงกับ LogRequestEntry หรือ ExperienceRequest ที่คุณใช้ใน Page Component)

type Props = {
  req: ExperienceRequest;
  selected: boolean;
  onCheckAction: (checked: boolean) => void;
  onConfirmAction: (pin?: string) => Promise<void>; // ✅ เปลี่ยนจาก void เป็น Promise<void>
  onRejectAction: (pin?: string) => Promise<void>; // ✅ เปลี่ยนจาก void เป็น Promise<void>
  currentUserRole?: Role; // ✅ (ถ้าต้องการ) Prop สำหรับรับ Role ของ User ปัจจุบัน
};

export default function RequestCard({
  req,
  selected,
  onCheckAction,
  onConfirmAction,
  onRejectAction,
  currentUserRole, // ✅ รับ currentUserRole
}: Props) {
  // Logic การแสดงปุ่ม "ยืนยัน" อาจจะขึ้นอยู่กับ currentUserRole
  // const canConfirm = currentUserRole === Role.APPROVER_IN; // ตัวอย่าง

  return (
    <div className="relative bg-white dark:bg-[#1E293B] hover:-translate-y-1 hover:shadow-lg transition-all dark:text-white rounded-xl shadow overflow-hidden">
      <div className="absolute top-4 left-4 ">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onCheckAction(e.target.checked)}
          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600" // ปรับ Style Checkbox
        />
      </div>
      <div className="p-6 mt-4">
        {" "}
        {/* อาจจะลด mt-4 ถ้า checkbox ไม่ทับ */}
        <h3 className="text-base sm:text-lg font-semibold text-[#f46b45] dark:text-orange-400">
          {/* ✅ ตรวจสอบ Optional Chaining ให้ดี */}
          {req.student?.user?.name || "ไม่พบชื่อนิสิต"} (รหัสนิสิต{" "}
          {req.student?.studentId || "N/A"})
        </h3>
        <div className="grid grid-cols-1 mt-2 mb-4 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
          <div className="flex items-start">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              หมวดหมู่:
            </span>
            <span className="ml-1 text-sm font-medium ">
              {req.course || "-"}
            </span>
          </div>
          <div className="flex items-start">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              หมวดหมู่ย่อย:
            </span>
            <span className="ml-1 text-sm font-medium ">
              {req.subCourse || "-"}
            </span>
          </div>
          {req.subject && (
            <div className="flex items-start">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                ในวิชา:
              </span>
              <span className="ml-1 text-sm font-medium">{req.subject}</span>
            </div>
          )}
          {req.fieldValues &&
            req.fieldValues.map(
              (
                fv,
                i, // ✅ ตรวจสอบว่า fieldValues มีค่า
              ) => (
                <div key={i} className="flex items-start">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {fv.field?.label || "ข้อมูลเพิ่มเติม"}:
                  </span>
                  <span className="ml-1 text-sm font-medium ">
                    {fv.value || "-"}
                  </span>
                </div>
              ),
            )}
        </div>
        <div className="mt-1 mb-1 text-xs text-gray-400 dark:text-gray-500">
          {" "}
          {/* ปรับขนาด Font */}
          <span className="">วันที่ส่งข้อมูล:</span>
          <span className="ml-1">
            {new Date(req.createdAt).toLocaleDateString("th-TH", {
              // ✅ เพิ่ม Options ให้ toLocaleDateString
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
        {/* แสดงสถานะของ Request ถ้ามี */}
        {req.status && (
          <div className="mt-2 mb-3">
            <span
              className={`px-2 py-1 text-xs font-semibold rounded-full ${
                req.status === "CONFIRMED"
                  ? "bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100"
                  : req.status === "CANCEL"
                    ? "bg-red-100 text-red-700 dark:bg-red-700 dark:text-red-100"
                    : "bg-yellow-100 text-yellow-700 dark:bg-yellow-700 dark:text-yellow-100" // สำหรับ PENDING หรือสถานะอื่น
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
          {/* ✅ อาจจะแสดงปุ่ม "ยืนยัน" เฉพาะเมื่อ currentUserRole เป็น APPROVER_IN และ req.status เป็น PENDING */}
          {/* {canConfirm && req.status === 'PENDING' && ( */}
          <button
            onClick={() => onConfirmAction()} // ไม่ต้องส่ง pin ถ้า Swal.fire ใน Page Component จัดการเรื่อง PIN เอง
            className="flex items-center justify-center w-full p-2 space-x-2 text-sm font-medium text-green-700 transition-colors bg-green-100 rounded-lg sm:w-auto hover:bg-green-200 dark:bg-green-700 dark:text-green-100 dark:hover:bg-green-600"
          >
            <FaCheck /> <span>ยืนยัน</span>
          </button>
          {/* )} */}

          {/* ปุ่ม "ปฏิเสธ" อาจจะแสดงสำหรับทุก Approver Role ถ้า req.status เป็น PENDING */}
          {/* {req.status === 'PENDING' && ( */}
          <button
            onClick={() => onRejectAction()} // ไม่ต้องส่ง pin ถ้า Swal.fire ใน Page Component จัดการเรื่อง PIN เอง
            className="flex items-center justify-center w-full p-2 space-x-2 text-sm font-medium text-red-700 transition-colors bg-red-100 rounded-lg sm:w-auto hover:bg-red-200 dark:bg-red-700 dark:text-red-100 dark:hover:bg-red-600"
          >
            <FaTimes /> <span>ปฏิเสธ</span>
          </button>
          {/* )} */}
        </div>
      </div>
    </div>
  );
}
