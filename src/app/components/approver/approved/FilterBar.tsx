import React from "react";

type Props = {
  search: string;
  setSearch: (s: string) => void;
  sortBy: "createdAt" | "course" | "studentName" | "subCourse";
  setSortBy: (s: any) => void;
  order: "asc" | "desc";
  setOrder: (o: any) => void;
};

export default function FilterBar({
  search,
  setSearch,
  sortBy,
  setSortBy,
  order,
  setOrder,
}: Props) {
  return (
    <div className="p-6 mb-4 bg-white shadow-lg rounded-xl dark:bg-[#1E293B] ">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="relative">
          <label
            htmlFor="search"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-white"
          >
            ค้นหา
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg
                className="w-5 h-5 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817
                     4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              className="block w-full px-4 py-3 pl-10 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-800 dark:text-gray-800"
              placeholder="ค้นหาชื่อ ,รหัสนิสิต หรือหมวดหมู่..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="sort"
            className="block mb-1 text-sm font-medium text-gray-700 dark:text-white"
          >
            เรียงตาม
          </label>
          <select
            id="sort"
            className="block w-full px-4 py-3 text-sm border border-gray-300 rounded-lg bg-gray-50 text-gray-700 dark:text-gray-700"
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [sb, od] = e.target.value.split("-");
              setSortBy(sb as any);
              setOrder(od as any);
            }}
          >
            <option value="createdAt-desc">วันที่ (ล่าสุด)</option>
            <option value="createdAt-asc">วันที่ (เก่าสุด)</option>
            <option value="studentName-asc">ชื่อ (ก→ฮ)</option>
            <option value="studentName-desc">ชื่อ (ฮ→ก)</option>
            <option value="course-asc">หมวดหมู่ (ก→ฮ)</option>
            <option value="course-desc">หมวดหมู่ (ฮ→ก)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
