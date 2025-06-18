//frontend\src\app\experience-manager\CountsExperience\CountsExperienceClient.tsx
"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { Session } from "lib/session";
import FilterBar from "@/app/components/experience-manager/CountsExperience/FilterBar";
import StudentTable from "@/app/components/experience-manager/CountsExperience/StudentTable";
import Pagination from "@/app/components/experience-manager/CountsExperience/Pagination";

// ... (Interface Student และ Props ไม่ต้องแก้ไข)
interface Student {
  id: number;
  studentId: string;
  name: string;
  done: number;
  total: number;
  percent: number;
}

interface CountsExperienceClientProps {
  session: Session;
}

export default function CountsExperienceClient({
  session,
}: CountsExperienceClientProps) {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const { accessToken } = session;

  const [books, setBooks] = useState<{ id: number; title: string }[]>([]);
  const [bookId, setBookId] = useState<number | string>("");
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"studentId" | "name" | "percent">(
    "studentId",
  );
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [data, setData] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // ... (โค้ด useEffect และ fetchData ของคุณทำงานได้ดีอยู่แล้ว ไม่ต้องแก้ไข)
  useEffect(() => {
    if (!accessToken) return;
    axios
      .get(`${BASE}/experience-books`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => setBooks(res.data))
      .catch((err) => console.error("Error fetching books:", err));
  }, [accessToken, BASE]);

  const fetchData = useCallback(() => {
    if (!bookId || !accessToken) {
      setData([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    axios
      .get(`${BASE}/approver/check-students`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { bookId, page, limit, search, sortBy, order },
      })
      .then((res) => {
        setData(res.data.data);
        setTotal(res.data.total);
      })
      .catch((err) => {
        console.error("Error fetching student data:", err);
        setData([]);
        setTotal(0);
      })
      .finally(() => setLoading(false));
  }, [bookId, page, limit, search, sortBy, order, accessToken, BASE]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- ส่วน Return ที่มีการแก้ไข ---
  return (
    <div className="w-full p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        <header className="p-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-slate-900 rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">
                จัดการข้อมูลประสบการณ์นิสิต
              </h1>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 bg-white dark:bg-[#1E293B] rounded-xl shadow-lg">
          <FilterBar
            books={books}
            selectedBook={bookId}
            setSelectedBookAction={(b) => {
              setBookId(b);
              setPage(1);
            }}
            search={search}
            setSearchAction={(s) => {
              setSearch(s);
              setPage(1);
            }}
            limit={limit}
            setLimitAction={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
          {loading && (
            <div className="p-4 text-center text-gray-500 dark:text-gray-400">
              กำลังโหลดข้อมูล...
            </div>
          )}

          {/* ถ้าไม่ได้ loading และไม่มีข้อมูล (หลังจากเลือกสมุดแล้ว) */}
          {!loading && bookId && data.length === 0 && (
            <div className="py-8 text-center text-gray-500 dark:text-gray-400">
              ไม่พบข้อมูลนิสิตในเล่มบันทึกนี้
            </div>
          )}

          {/* แสดงตารางเมื่อมีข้อมูลเท่านั้น */}
          {data.length > 0 && (
            <StudentTable
              data={data}
              sortBy={sortBy}
              order={order}
              onSortAction={(col) => {
                if (sortBy === col) {
                  setOrder((o) => (o === "asc" ? "desc" : "asc"));
                } else {
                  setSortBy(col);
                  setOrder("asc");
                }
              }}
            />
          )}

          {/* --- จุดแก้ไข: ส่ง Props ไปยัง Pagination ให้ครบถ้วน --- */}
          <Pagination
            pageIndex={page - 1} // แปลง 'page' (เริ่มจาก 1) เป็น 'pageIndex' (เริ่มจาก 0)
            setPageIndexAction={(n) => setPage(n + 1)} // แปลง 'pageIndex' กลับเป็น 'page'
            totalPages={Math.ceil(total / limit) || 1}
            getPageNumbersAction={() => {
              // ส่งฟังก์ชันสร้างเลขหน้าเข้าไปโดยตรง
              const pages: (number | "...")[] = [];
              const totalP = Math.ceil(total / limit) || 1;
              if (totalP <= 5) {
                for (let i = 1; i <= totalP; i++) pages.push(i);
              } else {
                pages.push(1);
                if (page > 3) pages.push("...");
                for (
                  let i = Math.max(2, page - 1);
                  i <= Math.min(totalP - 1, page + 1);
                  i++
                )
                  pages.push(i);
                if (page < totalP - 2) pages.push("...");
                pages.push(totalP);
              }
              return pages;
            }}
            totalItems={total}
            pageSize={limit}
          />
        </div>
      </div>
    </div>
  );
}
