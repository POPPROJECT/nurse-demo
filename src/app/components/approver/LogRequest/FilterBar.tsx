"use client";
import React from "react";

type Props = {
  search: string;
  setSearchAction: (v: string) => void;
  status: "all" | "confirmed" | "cancel";
  setStatusAction: (v: "all" | "confirmed" | "cancel") => void;
  limit: number;
  setLimitAction: (n: number) => void;
};

export default function FilterBar({
  search,
  setSearchAction,
  status,
  setStatusAction,
  limit,
  setLimitAction,
}: Props) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 items-end">
      {/* Search Input */}
      <div className="md:col-span-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearchAction(e.target.value)}
          placeholder="ค้นหารหัสนิสิต, ชื่อ-นามสกุล, หมวดหมู่..."
          className="w-full py-2 px-4 transition bg-gray-100 dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400 dark:text-white"
        />
      </div>

      {/* Status Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          สถานะ
        </label>
        <select
          value={status}
          onChange={(e) => setStatusAction(e.target.value as any)}
          className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-300"
        >
          <option value="all">ทั้งหมด</option>
          <option value="confirmed">อนุมัติ</option>
          <option value="cancel">ปฏิเสธ</option>
        </select>
      </div>

      {/* Page Size Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          แสดงผล
        </label>
        <select
          value={limit}
          onChange={(e) => setLimitAction(+e.target.value)}
          className="w-full p-2 border rounded-lg bg-white dark:bg-slate-800 border-gray-300 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-700 dark:text-gray-300"
        >
          <option value={10}>10 รายการ</option>
          <option value={20}>20 รายการ</option>
          <option value={50}>50 รายการ</option>
        </select>
      </div>
    </div>
  );
}
