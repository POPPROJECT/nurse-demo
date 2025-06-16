import { RowData } from "lib/type";
import React from "react";

interface Props {
  rows: RowData[];
  validateRow: (row: RowData) => boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function PreviewTable({
  rows,
  validateRow,
  currentPage,
  totalPages,
  onPageChange,
}: Props) {
  const formatName = (name: any) => {
    if (typeof name === "string") return name;
    if (name)
      return `${name.prefix || ""}${name.firstName || ""} ${name.lastName || ""}`.trim();
    return "-";
  };

  return (
    <div className="p-4 sm:p-6 bg-white shadow rounded-xl">
      <h2 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-800">
        ตรวจสอบข้อมูลก่อนนำเข้า ({rows.length})
      </h2>

      {/* Responsive Container */}
      <div className="bg-white rounded-lg">
        {/* Header (แสดงเฉพาะจอใหญ่) */}
        <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-2 font-semibold text-sm text-black dark:text-gray-800 bg-gray-50 rounded-t-lg">
          <div className="col-span-2">ชื่อ</div>
          <div>อีเมล</div>
          <div>รหัสนิสิต</div>
          <div>รหัสผ่าน</div>
          <div className="text-center">สถานะ</div>
        </div>

        {/* List of Rows (Card on mobile) */}
        <div className="flex flex-col">
          {rows.map((r, idx) => {
            const valid = validateRow(r);
            return (
              <div
                key={idx}
                className={`grid grid-cols-2 md:grid-cols-6 gap-x-4 gap-y-2 p-4 items-center ${!valid ? "bg-red-50 dark:bg-red-900/20" : ""} ${idx < rows.length - 1 ? "border-b border-gray-200 dark:border-slate-700" : ""} text-black dark:text-gray-800`}
              >
                <div className="col-span-2 md:col-span-2 text-sm">
                  <span className="font-semibold md:hidden">ชื่อ: </span>
                  {formatName(r.name)}
                </div>
                <div className="col-span-2 md:col-span-1 text-sm break-all">
                  <span className="font-semibold md:hidden">อีเมล: </span>
                  {r.email || "-"}
                </div>
                <div className="col-span-2 md:col-span-1 text-sm">
                  <span className="font-semibold md:hidden">รหัสนิสิต: </span>
                  {r.studentId ?? "-"}
                </div>
                <div className="col-span-2 md:col-span-1 text-sm">
                  <span className="font-semibold md:hidden">รหัสผ่าน: </span>
                  {r.password ?? "-"}
                </div>
                <div className="col-span-2 md:col-span-1 text-center text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${valid ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                  >
                    {valid ? "ถูกต้อง" : "ไม่ถูกต้อง"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-end mt-4">
        <div className="flex space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded border text-sm ${
                page === currentPage
                  ? "bg-indigo-600 text-white"
                  : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100"
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
