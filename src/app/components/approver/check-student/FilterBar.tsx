'use client';

import React from 'react';

type Props = {
  books: { id: number; title: string }[];
  selectedBook: number | string;
  setSelectedBook: (v: number | string) => void;
  search: string;
  setSearch: (v: string) => void;
  limit: number;
  setLimit: (v: number) => void;
};

export default function FilterBar({
  books,
  selectedBook,
  setSelectedBook,
  search,
  setSearch,
  limit,
  setLimit,
}: Props) {
  return (
    <div className="bg-white p-4 rounded-xl shadow flex flex-col lg:flex-row gap-4 items-center dark:bg-[#1E293B] dark:text-white">
      {/* เล่ม */}
      <label className="block mb-1 font-medium">เลือกเล่มสมุด</label>
      <select
        className="w-full px-3 py-2 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg lg:w-1/4"
        value={selectedBook}
        onChange={(e) => setSelectedBook(e.target.value ? +e.target.value : '')}
      >
        <option value="" className="dark:text-gray-800">
          -- เลือกสมุด --
        </option>
        {books.map((b) => (
          <option key={b.id} value={b.id} className="dark:text-gray-800">
            {b.title}
          </option>
        ))}
      </select>

      {/* ค้นหา */}
      <div className="relative flex-1">
        <input
          type="text"
          placeholder="ค้นหารหัสนิสิต หรือ ชื่อ-นามสกุล"
          className="w-full px-3 py-2 pl-10 pr-4 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <span className="absolute text-gray-400 -translate-y-1/2 left-3 top-1/2">
          <svg
            className="w-5 h-5 text-gray-400"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M8 4a4 4 0 100 8 4 4 0 000-8zM2
                             8a6 6 0 1110.89 3.476l4.817 4.817a1
                             1 0 01-1.414 1.414l-4.816-4.816A6 6
                             0 012 8z"
            />
          </svg>
        </span>
      </div>

      {/* จำนวนรายการ */}
      <div className="flex items-center space-x-2">
        <span>แสดง</span>
        <select
          className="px-2 py-1 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg"
          value={limit}
          onChange={(e) => setLimit(+e.target.value)}
        >
          {[5, 10, 15, 20, 50].map((n) => (
            <option key={n} value={n} className="dark:text-gray-800">
              {n}
            </option>
          ))}
        </select>
        <span>รายการ</span>
      </div>
    </div>
  );
}
