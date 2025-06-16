// components/approver/dashboard/StudentListModal.tsx

import { useEffect, useMemo, useState } from "react";
import { Student } from "../../../../../lib/type";
import LoadingSpinner from "@/app/components/approver/dashboard/LoadingSpinner";
import ExcelJS from "exceljs"; // ✅ 1. Import ExcelJS

export default function StudentListModal({
  isOpen,
  onClose,
  title,
  students,
  isLoading,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  students: Student[];
  isLoading: boolean;
}) {
  const [filter, setFilter] = useState<"completed" | "incomplete">("completed");
  const [searchTerm, setSearchTerm] = useState("");

  const { completedStudents, incompleteStudents } = useMemo(() => {
    if (!students) {
      return { completedStudents: [], incompleteStudents: [] };
    }
    return {
      completedStudents: students.filter((s) => s.status === "completed"),
      incompleteStudents: students.filter((s) => s.status === "incomplete"),
    };
  }, [students]);

  const displayedStudents = (
    filter === "completed" ? completedStudents : incompleteStudents
  ).filter(
    (s) =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.id.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // ✅ 2. ฟังก์ชัน Export ที่ใช้ ExcelJS
  const handleExport = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("รายชื่อนิสิต");

    // กำหนดส่วนหัวของตาราง
    worksheet.columns = [
      { header: "รหัสนิสิต", key: "id", width: 15 },
      { header: "ชื่อ-นามสกุล", key: "name", width: 30 },
      { header: "จำนวนที่บันทึก", key: "progress", width: 18 },
      { header: "สถานะ", key: "status", width: 15 },
    ];

    // เติมข้อมูลนิสิต
    displayedStudents.forEach((student) => {
      worksheet.addRow({
        id: student.id,
        name: student.name,
        // ✅ แก้ไขตรงนี้ให้เป็น String ธรรมดา
        progress: `${student.completed}/${student.total}`,
        status: student.status === "completed" ? "บันทึกครบ" : "บันทึกไม่ครบ",
      });
    });

    // ตั้งค่าสีพื้นหลังของส่วนหัว
    worksheet.getRow(1).eachCell((cell) => {
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFD3D3D3" }, // สีเทาอ่อน
      };
      cell.font = { bold: true };
    });

    // สร้าง Buffer จาก Workbook
    const buffer = await workbook.xlsx.writeBuffer();

    const today = new Date()
      .toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .replace(/\//g, "-");

    // สร้าง Blob เพื่อดาวน์โหลด
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `รายชื่อนิสิต-${title}-${today}.xlsx`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 transition-opacity duration-300 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="flex w-full max-w-4xl transform flex-col rounded-xl bg-white shadow-xl transition-transform duration-300 animate-scaleUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b p-6">
          <h3 className="text-xl font-bold text-[#f46b45]">
            รายชื่อนิสิต: <span>{title}</span>
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-4 p-6">
          <div className="flex flex-col gap-4">
            <div className="flex shrink-0 flex-wrap gap-2">
              <button
                onClick={() => setFilter("completed")}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${filter === "completed" ? "bg-[#f46b45] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                บันทึกครบ
              </button>
              <button
                onClick={() => setFilter("incomplete")}
                className={`rounded-lg px-4 py-2 text-sm transition-colors ${filter === "incomplete" ? "bg-[#f46b45] text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
              >
                บันทึกไม่ครบ
              </button>
            </div>
            <div className="relative w-full">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหารหัสนิสิตหรือชื่อ..."
                className="w-full rounded-lg border border-gray-300 py-2 pl-4 pr-10 text-sm focus:border-orange-400 focus:ring-2 focus:ring-orange-400"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                ></path>
              </svg>
            </div>
          </div>

          <div className="flex flex-col items-center justify-between gap-2 rounded-lg border bg-gray-50 p-3 text-sm text-gray-600 sm:flex-row">
            <div>
              <span className="text-gray-500">จำนวนนิสิตที่แสดง:</span>
              <span className="ml-1 font-medium text-gray-800">
                {displayedStudents.length}
              </span>
              <span className="mx-1 text-gray-400">/</span>
              <span className="text-gray-500">
                {filter === "completed"
                  ? completedStudents.length
                  : incompleteStudents.length}
              </span>
            </div>
            <div>
              <span className="text-gray-500">บันทึกครบ:</span>
              <span className="ml-1 font-medium text-green-600">
                {completedStudents.length}
              </span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-gray-500">บันทึกไม่ครบ:</span>
              <span className="ml-1 font-medium text-yellow-600">
                {incompleteStudents.length}
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="py-10">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto rounded-lg border">
              <table className="min-w-full bg-white">
                <thead className="sticky top-0 bg-gray-100 text-sm uppercase text-gray-600 shadow-sm">
                  <tr>
                    <th className="px-6 py-3 text-left">รหัสนิสิต</th>
                    <th className="px-6 py-3 text-left">ชื่อ-นามสกุล</th>
                    <th className="px-6 py-3 text-center">จำนวนที่บันทึก</th>
                    <th className="px-6 py-3 text-center">สถานะ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {displayedStudents.length > 0 ? (
                    displayedStudents.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-800">
                          {student.id}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-sm text-gray-800">
                          {student.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-center text-sm text-gray-800">
                          {student.completed}/{student.total}
                        </td>
                        <td className="whitespace-nowrap px-6 py-3 text-center">
                          <span
                            className={`rounded-full px-2 py-1 text-xs font-medium ${student.status === "completed" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}`}
                          >
                            {student.status === "completed"
                              ? "บันทึกครบ"
                              : "บันทึกไม่ครบ"}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-10 text-center text-gray-500"
                      >
                        ไม่พบข้อมูลนิสิต
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t bg-gray-50 p-4">
          {/* ✅ ปุ่ม Export Excel (ใช้ ExcelJS) */}
          <button
            onClick={handleExport}
            className="flex items-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              ></path>
            </svg>
            ส่งออก Excel
          </button>
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
}
