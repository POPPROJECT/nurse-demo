"use client";

import React from "react";

type Props = {
  page: number;
  totalPages: number;
  setPageAction: (p: number) => void;
  // เพิ่ม Props สำหรับแสดงจำนวนรายการทั้งหมด
  totalItems: number;
  pageSize: number;
};

function getPageNumbers(current: number, total: number): (number | "...")[] {
  const pages: (number | "...")[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push("...");
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
  }
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  setPageAction,
  totalItems,
  pageSize,
}: Props) {
  const pageNumbers = getPageNumbers(page, totalPages);

  if (totalPages <= 0) return null;

  const fromItem = totalItems > 0 ? (page - 1) * pageSize + 1 : 0;
  const toItem = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-y-3 gap-x-4 mt-4 w-full pt-4 border-t border-gray-200 dark:border-slate-700">
      <div className="text-sm text-gray-500 dark:text-gray-400">
        แสดง {fromItem} - {toItem} จาก {totalItems} รายการ
      </div>

      {totalPages > 1 && (
        <nav className="flex flex-wrap items-center justify-center gap-2">
          {/* ... (โค้ดปุ่ม Pagination ที่ปรับปรุงแล้วเหมือนในคำตอบก่อนหน้า) ... */}
          <button
            onClick={() => setPageAction(1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 ..."
          >
            หน้าแรก
          </button>
          <button
            onClick={() => setPageAction(page - 1)}
            disabled={page === 1}
            className="px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 ..."
          >
            ก่อนหน้า
          </button>
          {pageNumbers.map((pNo, idx) =>
            pNo === "..." ? (
              <span key={idx}>...</span>
            ) : (
              <button key={idx} onClick={() => setPageAction(pNo)}>
                {pNo}
              </button>
            ),
          )}
          <button
            onClick={() => setPageAction(page + 1)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 ..."
          >
            ถัดไป
          </button>
          <button
            onClick={() => setPageAction(totalPages)}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-sm font-medium rounded-md disabled:opacity-50 ..."
          >
            หน้าสุดท้าย
          </button>
        </nav>
      )}
    </div>
  );
}
