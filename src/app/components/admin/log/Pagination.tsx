'use client';
import React from 'react';
import {
  HiChevronDoubleLeft,
  HiChevronLeft,
  HiChevronRight,
  HiChevronDoubleRight,
} from 'react-icons/hi';

interface Props {
  page: number;
  totalPages: number;
  setPage: (n: number) => void;
  totalItems: number;
  limit: number;
}

export default function Pagination({
  page,
  totalPages,
  setPage,
  totalItems,
  limit,
}: Props) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-4 mt-6 md:flex-row">
      {/* Left: Showing count */}
      <div className="order-2 px-4 py-2 dark:bg-[#1E293B] dark:text-white text-sm text-gray-600 bg-white border border-gray-100 rounded-lg shadow-sm md:order-1">
        แสดงผล{' '}
        <span className="font-medium text-indigo-600 dark:text-cyan-500">
          {from}-{to}
        </span>{' '}
        จาก{' '}
        <span className="font-medium text-indigo-600 dark:text-cyan-500">
          {totalItems}
        </span>{' '}
        รายการ
      </div>

      {/* Right: Page buttons */}
      <div className="flex justify-center order-1 gap-2 md:order-2">
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-200 rounded-md pagination-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiChevronDoubleLeft />
        </button>

        <button
          onClick={() => setPage(page - 1)}
          disabled={page === 1}
          className="flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-200 rounded-md pagination-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiChevronLeft />
        </button>

        {pages.map((p) => (
          <button
            key={p}
            onClick={() => setPage(p)}
            className={`w-10 h-10 rounded-md border font-medium flex items-center justify-center ${
              p === page
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-gray-800 hover:bg-gray-50 border-gray-200'
            }`}
          >
            {p}
          </button>
        ))}

        <button
          onClick={() => setPage(page + 1)}
          disabled={page === totalPages}
          className="flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-200 rounded-md pagination-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiChevronRight />
        </button>

        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages}
          className="flex items-center justify-center w-10 h-10 text-gray-500 bg-white border border-gray-200 rounded-md pagination-button disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <HiChevronDoubleRight />
        </button>
      </div>
    </div>
  );
}
