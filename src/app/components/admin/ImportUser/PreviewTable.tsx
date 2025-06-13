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
  return (
    <div className="p-6 bg-white shadow rounded-xl">
      <h2 className="mb-4 text-lg font-semibold text-black">
        รายการที่นำเข้า ({rows.length})
      </h2>

      <div className="overflow-auto border border-gray-200 rounded">
        <table className="w-full text-sm">
          <thead className="text-gray-700 bg-gray-100">
            <tr>
              <th className="p-2 border">ชื่อ</th>
              <th className="p-2 border">อีเมล</th>
              <th className="p-2 border">รหัสนิสิต</th>
              <th className="p-2 border">รหัสผ่าน</th>
              <th className="p-2 border">Provider</th>
              <th className="p-2 text-center border">สถานะ</th>
            </tr>
          </thead>
          <tbody className="text-black">
            {rows.map((r, idx) => {
              const valid = validateRow(r);
              return (
                <tr key={idx} className={!valid ? "bg-red-50" : ""}>
                  <td className="p-2 border">
                    {typeof r.name === "string"
                      ? r.name
                      : r.name
                        ? `${r.name.prefix || ""}${r.name.firstName || ""} ${
                            r.name.lastName || ""
                          }`.trim()
                        : "-"}
                  </td>
                  <td className="p-2 border">{r.email || "-"}</td>
                  <td className="p-2 border">{r.studentId ?? "-"}</td>
                  <td className="p-2 border">{r.password ?? "-"}</td>
                  <td className="p-2 border">{r.provider}</td>
                  <td className="p-2 text-center border">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        valid
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {valid ? "ถูกต้อง" : "ไม่ถูกต้อง"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
