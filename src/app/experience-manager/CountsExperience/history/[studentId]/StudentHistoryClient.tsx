// //frontend\src\app\experience-manager\CountsExperience\history\[studentId]\StudentHistoryClient.tsx
"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";

interface FieldValue {
  field?: { label: string };
  value: string;
}
interface Experience {
  id: string;
  course: { id: number; name: string }; // แก้ไขจาก string เป็น object
  subCourse: { id: number; name: string }; // แก้ไขจาก string เป็น object
  status: "PENDING" | "CONFIRMED" | "CANCEL";
  createdAt: string;
  approverName: string;
  fieldValues: FieldValue[];
}
interface Book {
  id: number;
  title: string;
}

interface StudentHistoryClientProps {
  studentId: string;
}

const DeleteIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="w-5 h-5"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

export default function StudentHistoryPage({
  studentId,
}: StudentHistoryClientProps) {
  const { session } = useAuth(); // Accessing session from AuthContext
  const token = session?.accessToken; // Get token from session
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL;
  const [studentName, setStudentName] = useState("");
  const [realUserId, setRealUserId] = useState<number | null>(null);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState<number | null>(null);
  const [status, setStatus] = useState<
    "ALL" | "PENDING" | "CONFIRMED" | "CANCEL"
  >("ALL");
  const [sortBy, setSortBy] = useState<"createdAt" | "course" | "status">(
    "createdAt",
  );
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(5);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(total / limit);

  // ดึง userId จาก studentProfile.id
  useEffect(() => {
    if (!studentId) return;
    axios
      .get(`${BASE}/users/by-student-id/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }, // Ensure token is passed here
        withCredentials: true,
      })
      .then((res) => {
        setRealUserId(res.data.userId);
        setStudentName(res.data.name);
      })
      .catch(() => Swal.fire("Error", "โหลดข้อมูลนิสิตล้มเหลว", "error"));
  }, [studentId, token]);

  // โหลดสมุด
  useEffect(() => {
    if (!realUserId) return;
    axios
      .get(`${BASE}/experience-books/authorized/student/${realUserId}`, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      })
      .then((r) => {
        setBooks(r.data);
        if (r.data.length > 0) setBookId(r.data[0].id);
      })
      .catch(() => Swal.fire("Error", "โหลดสมุดไม่ได้", "error"));
  }, [realUserId, token, BASE]);

  // โหลดรายการบันทึก
  useEffect(() => {
    if (!realUserId || !bookId) return;
    setLoading(true);
    axios
      .get(`${BASE}/student-experiences/admin`, {
        headers: { Authorization: `Bearer ${token}` }, // Ensure token is sent in the request headers
        withCredentials: true,
        params: {
          studentId: realUserId,
          bookId,
          status,
          sortBy,
          order,
          search,
          page,
          limit,
        },
      })
      .then((res) => {
        setExperiences(res.data.data);
        setTotal(res.data.total);
      })
      .catch(() => Swal.fire("Error", "ไม่สามารถโหลดข้อมูลได้", "error"))
      .finally(() => setLoading(false));
  }, [
    realUserId,
    bookId,
    page,
    limit,
    status,
    sortBy,
    order,
    search,
    token,
    BASE,
  ]);

  const handleDelete = (id: string) => {
    Swal.fire({
      title: "ลบรายการนี้?",
      text: "เมื่อลบแล้วจะไม่สามารถกู้คืนได้",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#ef4444",
    }).then((result) => {
      if (!result.isConfirmed) return;
      axios
        .delete(`${BASE}/student-experiences/admin/${id}`, {
          headers: { Authorization: `Bearer ${token}` }, // Ensure token is passed here
          withCredentials: true,
        })
        .then(() => {
          Swal.fire("ลบสำเร็จ", "", "success");
          setExperiences((prev) => prev.filter((exp) => exp.id !== id));
        })
        .catch(() => Swal.fire("Error", "ลบไม่สำเร็จ", "error"));
    });
  };

  const getPageNumbers = (
    current: number,
    total: number,
    delta = 2,
  ): (number | "...")[] => {
    const range: (number | "...")[] = [];
    let l = 0;
    for (let i = 1; i <= total; i++) {
      if (
        i === 1 ||
        i === total ||
        (i >= current - delta && i <= current + delta)
      ) {
        if (l + 1 !== i) range.push("...");
        range.push(i);
        l = i;
      }
    }
    return range;
  };

  return (
    <div className="max-w-6xl p-6 mx-auto mt-6 text-gray-800   dark:text-white">
      <Link
        href="/experience-manager/CountsExperience"
        className="inline-flex items-center mb-2 text-gray-600 hover:text-gray-700 dark:text-gray-300"
      >
        <svg
          className="w-5 h-5 mr-2"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 19l-7-7 7-7"
          />
        </svg>
        กลับไปหน้าจัดการข้อมูลประสบการณ์นิสิต
      </Link>

      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl ">
          ประวัติการบันทึกของนิสิต
        </h1>
      </div>

      <div className="p-3 mb-6  dark:text-white bg-white dark:bg-[#1E293B] text-gray-800 rounded-xl shadow-md transition-shadow duration-300 min-w-auto">
        <h2 className="text-lg font-semibold sm:text-xl ">
          🔎 {studentId} - {studentName}
        </h2>
      </div>

      {/* Filter */}
      <div className="p-6 mb-6 bg-white shadow rounded-xl dark:bg-[#1E293B] dark:text-white">
        <div className="flex flex-wrap items-end gap-y-4 gap-x-6">
          {/* Book Filter */}
          <div className="flex flex-col">
            <label htmlFor="bookFilter" className="mb-1 text-sm font-medium">
              สมุด
            </label>
            <select
              id="bookFilter"
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg dark:text-black"
              value={bookId ?? ""}
              onChange={(e) => {
                const v = Number(e.target.value);
                setBookId(isNaN(v) ? null : v);
                setPage(1);
              }}
            >
              <option value="" className="dark:text-black">
                -- เลือกสมุด --
              </option>
              {books.map((b) => (
                <option key={b.id} value={b.id} className="dark:text-black">
                  {b.title}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col">
            <label htmlFor="statusFilter" className="mb-1 text-sm font-medium">
              สถานะ
            </label>
            <select
              id="statusFilter"
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg dark:text-black"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as any);
                setPage(1);
              }}
            >
              <option className="dark:text-black" value="ALL">
                ทั้งหมด
              </option>
              <option className="dark:text-black" value="PENDING">
                รอดำเนินการ
              </option>
              <option className="dark:text-black" value="CONFIRMED">
                ยืนยันแล้ว
              </option>
              <option className="dark:text-black" value="CANCEL">
                ปฏิเสธ
              </option>
            </select>
          </div>

          {/* Sort Filter */}
          <div className="flex flex-col">
            <label htmlFor="sortBy" className="mb-1 text-sm font-medium">
              เรียงตาม
            </label>
            <select
              id="sortBy"
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg dark:text-black"
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setPage(1);
              }}
            >
              <option className="dark:text-black" value="createdAt">
                วันที่
              </option>
              <option className="dark:text-black" value="course">
                หมวดหมู่
              </option>
              <option className="dark:text-black" value="status">
                สถานะ
              </option>
            </select>
          </div>

          {/* Search */}
          <div className="flex flex-col flex-grow min-w-[180px]">
            <label htmlFor="search" className="mb-1 text-sm font-medium">
              ค้นหา
            </label>
            <div className="relative">
              <input
                id="search"
                type="text"
                className="w-full py-2 pl-10 pr-4 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-400 dark:text-black"
                placeholder="ค้นหา…"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
              <div className="absolute inset-y-0 left-0 flex items-center pl-3">
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
              </div>
            </div>
          </div>

          {/* Limit Selector */}
          <div className="flex items-center">
            <label htmlFor="limit" className="mr-2 text-sm font-medium">
              แสดง:
            </label>
            <select
              id="limit"
              className="px-2 py-1 border border-gray-300 rounded-lg dark:bg-white dark:text-gray-800"
              value={limit}
              onChange={(e) => {
                setLimit(+e.target.value);
                setPage(1);
              }}
            >
              {[5, 10, 20, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span className="ml-2 text-sm text-gray-600 dark:text-white">
              รายการ
            </span>
          </div>
        </div>
      </div>

      {/* Result */}
      {loading ? (
        <p className="text-center">กำลังโหลดข้อมูล...</p>
      ) : !experiences || experiences.length === 0 ? (
        <p className="text-center">ไม่พบรายการ</p>
      ) : (
        <div className="space-y-4">
          {experiences.map((exp) => (
            <div
              key={exp.id}
              className={`p-4 rounded-xl shadow border-l-4 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-200 ${
                exp.status === "PENDING"
                  ? "border-yellow-400"
                  : exp.status === "CONFIRMED"
                    ? "border-green-400"
                    : "border-red-400"
              }`}
            >
              <div className="flex justify-between">
                <div>
                  <h2 className="text-xl font-bold text-blue-600">
                    {exp.course.name}
                  </h2>
                  <p className="mb-1 text-sm font-semibold text-blue-500">
                    {exp.subCourse.name}
                  </p>
                  <p className="text-sm">
                    สถานะ:{" "}
                    {exp.status === "PENDING"
                      ? "รอดำเนินการ"
                      : exp.status === "CONFIRMED"
                        ? "ยืนยันแล้ว"
                        : "ปฏิเสธ"}
                  </p>
                  <p className="text-sm">ผู้นิเทศ: {exp.approverName}</p>
                  <p className="text-sm">
                    วันที่:{" "}
                    {new Date(exp.createdAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
                <button
                  className="sm:text-gray-400 text-red-500 hover:text-red-500 p-1.5    transition-colors"
                  onClick={() => handleDelete(exp.id)}
                >
                  <DeleteIcon />
                </button>
              </div>
              <div className="mt-2 text-sm">
                {exp.fieldValues.map((fv, i) => (
                  <div key={i}>
                    <span className="font-semibold">{fv.field?.label}:</span>{" "}
                    {fv.value}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* {totalPages > 1 && bookFilter !== null && records.length > 0 && ( // เพิ่ม records.length > 0 เพื่อความแน่นอน */}
      {/* Pagination */}
      <div className="flex items-center justify-center pt-4 mt-6 space-x-1 border-t border-gray-200 dark:border-gray-700 sm:space-x-2">
        {/* ปุ่มหน้าแรก */}
        <button
          onClick={() => setPage(1)}
          disabled={page === 1}
          className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
        >
          หน้าแรก
        </button>

        {/* ปุ่มก่อนหน้า */}
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
        >
          ก่อนหน้า
        </button>

        {/* เลขหน้า */}
        {getPageNumbers(page, totalPages).map((pNo, index) => (
          <div key={index}>
            {pNo === "..." ? (
              <span className="px-2 py-1 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 sm:px-3">
                ...
              </span>
            ) : (
              <button
                onClick={() => setPage(pNo as number)}
                className={`
            px-2 sm:px-3 py-1 border text-sm font-medium rounded-lg transition-colors duration-200
            ${
              pNo === page
                ? "bg-blue-600 border-blue-600 text-white shadow-sm hover:bg-blue-700" // Active state for Light mode
                : "bg-white border-gray-300 text-gray-600 hover:bg-gray-100 hover:text-gray-800" // Inactive state for Light mode
            }
            ${
              pNo === page
                ? "dark:bg-blue-700 dark:border-blue-700 dark:text-white dark:hover:bg-blue-800" // Active state for Dark mode
                : "dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white" // Inactive state for Dark mode
            }
          `}
                aria-current={pNo === page ? "page" : undefined}
              >
                {pNo}
              </button>
            )}
          </div>
        ))}

        {/* ปุ่มถัดไป */}
        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages || totalPages === 0}
          className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
        >
          ถัดไป
        </button>

        {/* ปุ่มหน้าสุดท้าย */}
        <button
          onClick={() => setPage(totalPages)}
          disabled={page === totalPages || totalPages === 0}
          className="px-2 py-1 text-sm font-medium text-gray-600 transition-colors duration-200 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 hover:text-gray-800 dark:text-gray-300 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed sm:px-3"
        >
          หน้าสุดท้าย
        </button>
      </div>
    </div>
  );
}
