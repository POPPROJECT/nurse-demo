'use client';

import React from 'react';
import Select from 'react-select';

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
  // แปลง books เป็น options สำหรับ react-select
  const bookOptions = books.map((b) => ({
    value: b.id,
    label: b.title,
  }));

  // หา option ที่ตรงกับ selectedBook (หรือ null ถ้าไม่เจอ)
  const selectedOption =
    bookOptions.find((opt) => opt.value === selectedBook) || null;
  return (
    <div className="bg-white p-4 rounded-xl shadow flex flex-col lg:flex-row gap-4 items-center dark:bg-[#1E293B] dark:text-white justify-between">
      {/* เล่ม */}
      <div className="flex items-center w-full lg:w-1/2">
        <label className="block mb-1 mr-2 font-medium">สมุด</label>
        <Select
          instanceId="book-select"
          options={bookOptions}
          value={selectedOption}
          onChange={(opt) =>
            setSelectedBook(opt ? (opt as { value: number }).value : '')
          }
          placeholder="-- เลือกสมุด --"
          isClearable
          className="w-full text-gray-800 react-select-container "
          classNamePrefix="react-select"
        />
      </div>

      {/* ค้นหา */}
      <div className="relative w-full lg:w-1/3">
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
