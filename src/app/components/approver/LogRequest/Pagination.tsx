'use client';

import React from 'react';

type Props = {
  page: number;
  totalPages: number;
  setPage: (p: number) => void;
};

function getPageNumbers(current: number, total: number): (number | '...')[] {
  const pages: (number | '...')[] = [];
  if (total <= 5) {
    for (let i = 1; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    if (current > 3) pages.push('...');
    const start = Math.max(2, current - 1);
    const end = Math.min(total - 1, current + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    if (current < total - 2) pages.push('...');
    pages.push(total);
  }
  return pages;
}

export default function Pagination({ page, totalPages, setPage }: Props) {
  const pageNumbers = getPageNumbers(page, totalPages);

  return (
    <div className="flex items-center justify-center pt-4 mt-6 space-x-1 border-t border-gray-200 dark:border-gray-700 sm:space-x-2">
      {/* หน้าแรก */}
      <button
        onClick={() => setPage(1)}
        disabled={page === 1}
        className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
      >
        หน้าแรก
      </button>

      {/* ก่อนหน้า */}
      <button
        onClick={() => setPage(Math.max(1, page - 1))}
        disabled={page === 1}
        className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
      >
        ก่อนหน้า
      </button>

      {/* เลขหน้า */}
      {pageNumbers.map((pNo, idx) => (
        <div key={idx}>
          {pNo === '...' ? (
            <span className="px-2 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 sm:px-3">
              …
            </span>
          ) : (
            <button
              onClick={() => setPage(pNo as number)}
              aria-current={pNo === page ? 'page' : undefined}
              className={`
                px-2 sm:px-3 py-1 border text-sm font-medium rounded-lg transition-colors duration-200
                ${
                  pNo === page
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700 dark:bg-blue-700 dark:border-blue-700 dark:text-white dark:hover:bg-blue-800'
                    : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white'
                }
              `}
            >
              {pNo}
            </button>
          )}
        </div>
      ))}

      {/* ถัดไป */}
      <button
        onClick={() => setPage(Math.min(totalPages, page + 1))}
        disabled={page === totalPages || totalPages === 0}
        className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
      >
        ถัดไป
      </button>

      {/* หน้าสุดท้าย */}
      <button
        onClick={() => setPage(totalPages)}
        disabled={page === totalPages || totalPages === 0}
        className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
      >
        หน้าสุดท้าย
      </button>
    </div>
  );
}
