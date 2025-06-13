"use client";
import React from "react";

interface Props {
  search: string;
  setSearchAction: (s: string) => void;
  perPage: number;
  setPerPageAction: (n: number) => void;
  setPageAction: (n: number) => void;
  totalCount: number;
  filteredCount: number;
}

export default function TableSearchBar({
  search,
  setSearchAction,
  perPage,
  setPerPageAction,
  setPageAction,
  totalCount,
  filteredCount,
}: Props) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 rounded-xl bg-white shadow dark:bg-[#1E293B]">
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="ค้นหารหัสนิสิต หรือ ชื่อ หรือ อีเมล..."
          value={search}
          onChange={(e) => setSearchAction(e.target.value)}
          className="w-full py-2 pl-10 pr-4 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg"
        />
        <span className="absolute text-gray-500 -translate-y-1/2 left-3 top-1/2">
          🔍
        </span>
      </div>

      <div className="flex items-center space-x-2 text-gray-700 dark:text-gray-300">
        <span>แสดง</span>
        <select
          value={perPage}
          onChange={(e) => {
            setPerPageAction(Number(e.target.value));
            setPageAction(1);
          }}
          className="px-2 py-1 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg"
        >
          {[5, 10, 20, 50].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
        <span>จาก</span>
        <span className="font-medium text-indigo-500 dark:text-indigo-300">
          {filteredCount}
        </span>
        <span>รายการ</span>
        {filteredCount !== totalCount && (
          <span className="text-sm text-gray-500">
            (ทั้งหมด {totalCount} รายการ)
          </span>
        )}
      </div>
    </div>
  );
}
