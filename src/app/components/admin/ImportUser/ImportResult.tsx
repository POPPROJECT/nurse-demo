"use client";
import React, { useEffect, useMemo, useState } from "react";
import { RowData, SkippedEntry } from "lib/type";

interface Props {
  successList: RowData[];
  skipped: SkippedEntry[];
  onUndoAction: () => void;
  // ไม่จำเป็นต้องรับ Props เกี่ยวกับ Pagination มาจากข้างนอกแล้ว
}

// Helper component สำหรับตาราง (ใช้โค้ดเดิมของคุณ)
const ResponsiveResultTable = ({
  headers,
  data,
  isErrorTable = false,
}: {
  headers: string[];
  data: any[];
  isErrorTable?: boolean;
}) => {
  // ... โค้ดส่วนนี้เหมือนเดิม ไม่ต้องแก้ไข ...
  return (
    <div
      className={`bg-white rounded-lg border ${
        isErrorTable
          ? "border-red-200 dark:border-red-200"
          : "border-green-200 dark:border-slate-200"
      }`}
    >
      <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-2 font-semibold text-sm text-gray-600 dark:text-gray-600 bg-gray-50 rounded-t-lg">
        {headers.map((h, i) => (
          <div
            key={i}
            className={`col-span-1 ${i === 0 ? "md:col-span-2" : ""}`}
          >
            {h}
          </div>
        ))}
      </div>
      <div className="flex flex-col">
        {data.map((item, index) => (
          <div
            key={index}
            className={`grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-2 p-4 text-sm items-center ${
              index < data.length - 1 ? "border-b border-gray-200" : ""
            }`}
          >
            <div className="col-span-2 md:col-span-2">
              <span className="font-semibold md:hidden">ชื่อ: </span>
              {item.name}
            </div>
            <div className="col-span-2 md:col-span-1 break-all">
              <span className="font-semibold md:hidden">อีเมล: </span>
              {item.email}
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="font-semibold md:hidden">รหัสนิสิต: </span>
              {item.studentId || "-"}
            </div>
            <div className="col-span-2 md:col-span-1">
              <span className="font-semibold md:hidden">Role: </span>
              {item.role}
            </div>
            {isErrorTable && (
              <div className="col-span-2 md:col-span-1">
                <span className="font-semibold md:hidden">สาเหตุ:</span>
                {item.reason}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- Component หลักที่แก้ไขใหม่ ---
export default function ImportResult({
  successList,
  skipped,
  onUndoAction,
}: Props) {
  const [countdown, setCountdown] = useState(60);
  const [activeTab, setActiveTab] = useState<"success" | "skipped">("success");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10; // แสดงผล 10 รายการต่อหน้า

  // Effect สำหรับนับถอยหลัง (เหมือนเดิม)
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // เลือกว่าจะใช้ข้อมูลชุดไหนตามแท็บที่เลือก
  const activeList = useMemo(() => {
    return activeTab === "success" ? successList : skipped;
  }, [activeTab, successList, skipped]);

  // คำนวณข้อมูลสำหรับแสดงผลในหน้านั้นๆ
  const totalPages = Math.ceil(activeList.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return activeList.slice(start, start + pageSize);
  }, [activeList, currentPage, pageSize]);

  const handleTabClick = (tab: "success" | "skipped") => {
    setActiveTab(tab);
    setCurrentPage(1); // กลับไปหน้า 1 ทุกครั้งที่เปลี่ยนแท็บ
  };

  const headers =
    activeTab === "success"
      ? ["ชื่อ", "อีเมล", "รหัสนิสิต", "Role"]
      : ["ชื่อ", "อีเมล", "รหัสนิสิต", "Role", "สาเหตุ"];

  return (
    <div className="space-y-4 p-4 bg-white rounded-lg shadow">
      {/* ส่วนของปุ่ม Undo จะแสดงเมื่อมีรายการที่สำเร็จ */}
      {successList.length > 0 && (
        <div className="flex items-center justify-end">
          <button
            onClick={onUndoAction}
            disabled={countdown === 0}
            className="px-3 py-1 text-sm text-red-600 bg-white border border-red-300 rounded hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            🗑 ยกเลิกการนำเข้าล่าสุด ({countdown}s)
          </button>
        </div>
      )}

      {/* --- ระบบแท็บ --- */}
      <div className="flex border-b border-gray-200 dark:border-slate-700">
        <button
          onClick={() => handleTabClick("success")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "success" ? "border-b-2 border-blue-600 text-blue-600 dark:text-blue-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          ✅ นำเข้าสำเร็จ ({successList.length})
        </button>
        <button
          onClick={() => handleTabClick("skipped")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === "skipped" ? "border-b-2 border-red-600 text-red-600 dark:text-red-400" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
        >
          ❌ ไม่สำเร็จ ({skipped.length})
        </button>
      </div>

      {/* --- ตารางแสดงผลและ Pagination --- */}
      <div className="mt-4">
        {activeList.length > 0 ? (
          <>
            <ResponsiveResultTable
              headers={headers}
              data={paginatedData}
              isErrorTable={activeTab === "skipped"}
            />
            {totalPages > 1 && (
              <div className="flex items-center justify-end mt-4">
                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1 rounded border text-sm ${
                          page === currentPage
                            ? "bg-indigo-600 text-white border-indigo-600"
                            : "bg-white  border-gray-300  text-gray-600 dark:text-gray-600 hover:bg-gray-300"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="py-8 text-center text-gray-500">ไม่มีข้อมูลในส่วนนี้</p>
        )}
      </div>
    </div>
  );
}
