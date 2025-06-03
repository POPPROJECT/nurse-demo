'use client';
import React from 'react';

interface Props {
  pageIndex: number;
  setPageIndex: (n: number) => void;
  totalPages: number;
  getPageNumbers: () => (number | '...')[];
}

export default function TablePagination({
  pageIndex,
  setPageIndex,
  totalPages,
  getPageNumbers,
}: Props) {
  return (
    <div className="flex items-center justify-center gap-2 mt-4">
      <button
        onClick={() => setPageIndex(0)}
        disabled={pageIndex === 0}
        className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:text-white"
      >
        หน้าแรก
      </button>
      <button
        onClick={() => setPageIndex(Math.max(0, pageIndex - 1))}
        disabled={pageIndex === 0}
        className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:text-white"
      >
        ก่อนหน้า
      </button>
      {getPageNumbers().map((p, idx) =>
        p === '...' ? (
          <span key={idx} className="px-2">
            …
          </span>
        ) : (
          <button
            key={idx}
            onClick={() => setPageIndex(p - 1)}
            className={`px-3 py-1 text-sm border rounded ${
              pageIndex === p - 1 ? 'bg-blue-300 text-white' : 'bg-white'
            }`}
          >
            {p}
          </button>
        )
      )}
      <button
        onClick={() => setPageIndex(Math.min(totalPages - 1, pageIndex + 1))}
        disabled={pageIndex >= totalPages - 1}
        className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:text-white"
      >
        ถัดไป
      </button>
      <button
        onClick={() => setPageIndex(totalPages - 1)}
        disabled={pageIndex >= totalPages - 1}
        className="px-3 py-1 text-sm border rounded disabled:opacity-50 dark:text-white"
      >
        หน้าสุดท้าย
      </button>
    </div>
  );
}
