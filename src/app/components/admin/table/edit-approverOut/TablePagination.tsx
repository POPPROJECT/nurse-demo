"use client";
import React from "react";

interface Props {
  pageIndex: number;
  setPageIndexAction: (n: number) => void;
  totalPages: number;
  getPageNumbersAction: () => (number | "...")[];
  totalItems: number;
  pageSize: number;
}

export default function TablePagination({
  pageIndex,
  setPageIndexAction,
  totalPages,
  getPageNumbersAction,
  totalItems,
  pageSize,
}: Props) {
  const fromItem = totalItems > 0 ? pageIndex * pageSize + 1 : 0;
  const toItem = Math.min((pageIndex + 1) * pageSize, totalItems);

  // --- จุดที่แก้ไข: เราลบเงื่อนไข if (totalPages <=1) ออกไปจากตรงนี้ ---
  // การแสดงผลจะถูกควบคุมโดยจำนวน totalItems แทน
  if (totalItems === 0) {
    return null; // ถ้าไม่มีข้อมูลเลย ก็ไม่ต้องแสดงอะไร
  }

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-y-3 gap-x-4 mt-6 w-full">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        แสดง {fromItem} - {toItem} จาก {totalItems} รายการ
      </div>

      {/* ถ้ามีแค่หน้าเดียว ให้แสดงแค่ข้อความ แต่ไม่แสดงปุ่ม */}
      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setPageIndexAction(0)}
            disabled={pageIndex === 0}
            className="px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border dark:border-slate-700"
          >
            หน้าแรก
          </button>
          <button
            onClick={() => setPageIndexAction(Math.max(0, pageIndex - 1))}
            disabled={pageIndex === 0}
            className="px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border dark:border-slate-700"
          >
            ก่อนหน้า
          </button>

          {getPageNumbersAction().map((p, idx) =>
            p === "..." ? (
              <span key={idx} className="px-2 text-gray-500 dark:text-gray-400">
                …
              </span>
            ) : (
              <button
                key={idx}
                onClick={() => setPageIndexAction(p - 1)}
                className={`min-w-[32px] px-2 py-1.5 text-sm font-medium rounded-md transition-colors ${
                  pageIndex === p - 1
                    ? "bg-indigo-600 text-white hover:bg-indigo-700"
                    : "bg-white text-gray-700 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border dark:border-slate-700"
                }`}
              >
                {p}
              </button>
            ),
          )}

          <button
            onClick={() =>
              setPageIndexAction(Math.min(totalPages - 1, pageIndex + 1))
            }
            disabled={pageIndex >= totalPages - 1}
            className="px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border dark:border-slate-700"
          >
            ถัดไป
          </button>
          <button
            onClick={() => setPageIndexAction(totalPages - 1)}
            disabled={pageIndex >= totalPages - 1}
            className="px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-700 border dark:border-slate-700"
          >
            หน้าสุดท้าย
          </button>
        </nav>
      )}
    </div>
  );
}
