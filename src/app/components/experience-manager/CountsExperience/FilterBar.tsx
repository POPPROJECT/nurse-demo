"use client";
import React from "react";
import Select from "react-select"; // ใช้ react-select เพื่อความสวยงาม

type BookOption = { value: number; label: string };

type Props = {
  books: { id: number; title: string }[];
  selectedBook: number | string;
  setSelectedBookAction: (v: number | string) => void;
  search: string;
  setSearchAction: (v: string) => void;
  limit: number;
  setLimitAction: (v: number) => void;
};

export default function FilterBar({
  books,
  selectedBook,
  setSelectedBookAction,
  search,
  setSearchAction,
  limit,
  setLimitAction,
}: Props) {
  const bookOptions: BookOption[] = books.map((b) => ({
    value: b.id,
    label: b.title,
  }));
  const selectedBookOption =
    bookOptions.find((opt) => opt.value === selectedBook) || null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 items-end">
      <div className="md:col-span-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          เล่มบันทึก
        </label>
        <Select
          instanceId="book-select-manager"
          options={bookOptions}
          value={selectedBookOption}
          onChange={(opt) => setSelectedBookAction(opt ? opt.value : "")}
          placeholder="-- กรุณาเลือกเล่มบันทึก --"
          isClearable
          className="text-gray-800 react-select-container"
          classNamePrefix="react-select"
        />
      </div>

      <div className="md:col-span-2">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          ค้นหานิสิต
        </label>
        <input
          type="text"
          placeholder="รหัสนิสิต หรือ ชื่อ..."
          className="w-full py-2 px-4 transition bg-gray-100 dark:bg-gray-100 border border-gray-300  rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
          value={search}
          onChange={(e) => setSearchAction(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          แสดงผล
        </label>
        <select
          className="w-full p-2 border rounded-lg bg-white dark:bg-gray-100 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-600 dark:text-gray-600"
          value={limit}
          onChange={(e) => setLimitAction(+e.target.value)}
        >
          {[10, 20, 50, 100].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
