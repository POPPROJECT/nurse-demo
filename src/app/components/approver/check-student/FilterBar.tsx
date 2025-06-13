//nurse-demo\src\app\components\approver\check-student\FilterBar.tsx
"use client";

import React from "react";
import Select from "react-select";

// ▼▼▼ [แก้ไข] เปลี่ยน Type จาก courses เป็น subjects (number[]) ▼▼▼
type Props = {
  books: { id: number; title: string }[];
  selectedBook: number | string;
  setSelectedBookAction: (v: number | string) => void;
  subjects: string[]; // <-- แก้ไขตรงนี้
  progressMode: string;
  setProgressModeAction: (v: string) => void;
  search: string;
  setSearchAction: (v: string) => void;
  limit: number;
  setLimitAction: (v: number) => void;
};
// ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

// type Props = {
//   books: { id: number; title: string }[];
//   selectedBook: number | string;
//   setSelectedBook: (v: number | string) => void;
//   search: string;
//   setSearch: (v: string) => void;
//   limit: number;
//   setLimit: (v: number) => void;
// };

export default function FilterBar({
  books,
  selectedBook,
  setSelectedBookAction,
  subjects,
  progressMode,
  setProgressModeAction,
  search,
  setSearchAction,
  limit,
  setLimitAction,
}: Props) {
  // แปลง books เป็น options สำหรับ react-select
  const bookOptions = books.map((b) => ({
    value: b.id,
    label: b.title,
  }));

  // หา option ที่ตรงกับ selectedBook (หรือ null ถ้าไม่เจอ)
  const selectedOption =
    bookOptions.find((opt) => opt.value === selectedBook) || null;

  // ▼▼▼ [แก้ไข] สร้าง Options จาก subjects ที่เป็น number[] ▼▼▼
  const progressModeOptions = [
    { value: "all", label: "ตลอดหลักสูตร" },
    ...subjects.map((s) => ({ value: s.toString(), label: `รายวิชา ${s}` })),
  ];
  const selectedProgressModeOption =
    progressModeOptions.find((opt) => opt.value === progressMode) || null;
  // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

  return (
    <div className="bg-white p-4 rounded-xl shadow flex flex-col lg:flex-row gap-4 items-center dark:bg-[#1E293B] dark:text-white justify-between">
      {/* เล่ม */}
      <div className="w-full lg:w-1/2 flex items-center">
        <label className="block mb-1 font-medium mr-2">สมุด</label>
        <Select
          instanceId="book-select"
          options={bookOptions}
          value={selectedOption}
          onChange={(opt) =>
            setSelectedBookAction(opt ? (opt as { value: number }).value : "")
          }
          placeholder="-- เลือกสมุด --"
          isClearable
          className="react-select-container text-gray-800 w-full "
          classNamePrefix="react-select"
        />
      </div>

      {/* ▼▼▼ [เพิ่ม] Progress Mode Select ▼▼▼ */}
      <div className="w-full lg:w-1/3 flex items-center">
        <label className="block font-medium mr-2 whitespace-nowrap">
          ความคืบหน้า
        </label>
        <Select
          instanceId="progress-mode-select"
          options={progressModeOptions}
          value={selectedProgressModeOption}
          onChange={(opt) => setProgressModeAction(opt ? opt.value : "all")}
          isDisabled={!selectedBook}
          className="react-select-container text-gray-800 w-full"
          classNamePrefix="react-select"
        />
      </div>
      {/* ▲▲▲ [สิ้นสุดส่วนที่เพิ่ม] ▲▲▲ */}

      {/* ค้นหา */}
      <div className="relative w-full lg:w-1/3">
        <input
          type="text"
          placeholder="ค้นหารหัสนิสิต หรือ ชื่อ-นามสกุล"
          className="w-full px-3 py-2 pl-10 pr-4 text-gray-800 bg-gray-100 border border-gray-300 rounded-lg"
          value={search}
          onChange={(e) => setSearchAction(e.target.value)}
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
          onChange={(e) => setLimitAction(+e.target.value)}
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
