"use client";
import React from "react";
import { HiChevronDown, HiSearch, HiSortDescending } from "react-icons/hi";

interface FilterBarProps {
  search: string;
  setSearchAction: (val: string) => void;
  action: "all" | "create" | "update" | "delete" | "import";
  setAction: (val: "all" | "create" | "update" | "delete") => void;
  sortBy: string;
  order: "asc" | "desc";
  setSortAction: (sortBy: string, order: "asc" | "desc") => void;
  limit: number;
  setLimitAction: (n: number) => void;
}

export default function FilterBar({
  search,
  setSearchAction,
  action,
  setAction,
  sortBy,
  order,
  setSortAction,
  limit,
  setLimitAction,
}: FilterBarProps) {
  return (
    <div className="p-5 mb-6 bg-white dark:bg-[#1E293B] border border-gray-200 shadow-sm rounded-xl md:p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-center ">
          {/* 🔍 Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <HiSearch className="w-5 h-5 text-gray-400 dark:text-white" />
            </div>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearchAction(e.target.value)}
              placeholder="ค้นหา..."
              className="pl-10 pr-4 py-2.5 w-full md:w-64 border dark:text-white border-gray-300 rounded-md shadow-sm text-sm focus:ring-indigo-200 focus:ring-2 focus:outline-none"
            />
          </div>

          {/* 📁 Action Dropdown */}
          <div className="relative dark:text-white">
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              className="pl-4 pr-10 py-2.5 border dark:bg-[#1E293B]  border-gray-300 rounded-md shadow-sm text-sm bg-white appearance-none focus:ring-indigo-200 focus:ring-2 focus:outline-none"
            >
              <option value="all">ทั้งหมด</option>
              <option value="create">สร้าง</option>
              <option value="update">อัปเดต</option>
              <option value="delete">ลบ</option>
              <option value="import">อัปโหลด</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
              <HiChevronDown className="w-4 h-4" />
            </div>
          </div>

          {/* 📄 Limit Dropdown */}
          <div className="relative dark:text-white">
            <select
              value={limit}
              onChange={(e) => setLimitAction(Number(e.target.value))}
              className="pl-4 pr-10 py-2.5 border dark:bg-[#1E293B] border-gray-300 rounded-md shadow-sm text-sm bg-white appearance-none focus:ring-indigo-200 focus:ring-2 focus:outline-none"
            >
              <option value={10}>10 รายการ/หน้า</option>
              <option value={20}>20 รายการ/หน้า</option>
              <option value={50}>50 รายการ/หน้า</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 pointer-events-none">
              <HiChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* 🔽 Sort Button */}
        <button
          onClick={() =>
            setSortAction(sortBy, order === "desc" ? "asc" : "desc")
          }
          className="flex items-center px-4 py-2 text-sm font-medium text-white rounded-md shadow-sm bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700"
        >
          <HiSortDescending className="w-4 h-4 mr-2" />
          เรียง: {order === "desc" ? "ใหม่ → เก่า" : "เก่า → ใหม่"}
        </button>
      </div>
    </div>
  );
}
