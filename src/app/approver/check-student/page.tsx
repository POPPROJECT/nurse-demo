"use client";

import React, { useEffect, useState } from "react";
import axios from "axios";
import { getSession } from "lib/session";
import { Role } from "lib/type";
import FilterBar from "@/app/components/approver/check-student/FilterBar";
import StudentTable from "@/app/components/approver/check-student/StudentTable";
import Pagination from "@/app/components/approver/check-student/Pagination";

export default function CheckStudentPage() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

  // const [books, setBooks] = useState<{ id: number; title: string }[]>([]);
  // const [bookId, setBookId] = useState<number | string>('');
  // ▼▼▼ [แก้ไข] เปลี่ยน state จาก courses เป็น subjects ▼▼▼
  const [books, setBooks] = useState<{ id: number; title: string }[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]); // <--- แก้ไข
  const [bookId, setBookId] = useState<number | string>("");
  const [progressMode, setProgressMode] = useState("all");
  // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(10);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"studentId" | "name" | "percent">(
    "studentId",
  );
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const [data, setData] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // โหลดสมุดทั้งหมด
  useEffect(() => {
    getSession().then((sess) => {
      if (!sess || sess.user.role !== Role.APPROVER_IN)
        return (window.location.href = "/");
      axios
        .get<{ id: number; title: string }[]>(`${BASE}/experience-books`, {
          headers: { Authorization: `Bearer ${sess.accessToken}` },
        })
        .then((r) => setBooks(r.data));
    });
  }, []);

  // ▼▼▼ [แก้ไข] 2. โหลด "Subjects" เมื่อเลือกสมุดใหม่ ▼▼▼
  useEffect(() => {
    setSubjects([]);
    setProgressMode("all");

    if (!bookId) return;

    getSession().then((sess) => {
      if (!sess) return;
      // เรียก Endpoint ใหม่ /subjects
      axios
        .get<string[]>(`${BASE}/experience-books/${bookId}/subjects`, {
          headers: { Authorization: `Bearer ${sess.accessToken}` },
        })
        .then((r) => setSubjects(r.data));
    });
  }, [bookId, BASE]);
  // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

  // ▼▼▼ [แก้ไข] 3. โหลด "ข้อมูลนิสิต" ทุกครั้งที่ filter/sort/page หรือ progressMode เปลี่ยน ▼▼▼
  useEffect(() => {
    if (!bookId) {
      setData([]);
      setTotal(0);
      return;
    }
    setLoading(true);
    getSession().then((sess) => {
      if (!sess) {
        setLoading(false);
        return;
      }
      axios
        .get<{ total: number; data: any[] }>(
          `${BASE}/approver/check-students`,
          {
            headers: { Authorization: `Bearer ${sess.accessToken}` },
            // เพิ่ม progressMode เข้าไปใน params
            params: {
              bookId,
              page,
              limit,
              search,
              sortBy,
              order,
              progressMode,
            },
          },
        )
        .then((r) => {
          setData(r.data.data);
          setTotal(r.data.total);
        })
        .finally(() => {
          setLoading(false);
        });
    });
  }, [bookId, page, limit, search, sortBy, order, progressMode, BASE]); // เพิ่ม progressMode ใน dependency array
  // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲

  // // โหลดนิสิต ทุกครั้งที่ filter/sort/page เปลี่ยน
  // useEffect(() => {
  //   if (!bookId) {
  //     setData([]);
  //     return;
  //   }
  //   getSession().then((sess) => {
  //     if (!sess) return;
  //     axios
  //       .get<{ total: number; data: any[] }>(
  //         `${BASE}/approver/check-students`,
  //         {
  //           headers: { Authorization: `Bearer ${sess.accessToken}` },
  //           params: { bookId, page, limit, search, sortBy, order },
  //         }
  //       )
  //       .then((r) => {
  //         setData(r.data.data);
  //         setTotal(r.data.total);
  //       });
  //   });
  // }, [bookId, page, limit, search, sortBy, order]);

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      {/* Header */}
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">รายงานผลของนิสิต</h1>
      </div>
      <FilterBar
        books={books}
        selectedBook={bookId}
        setSelectedBookAction={(b) => {
          setBookId(b);
          setPage(1);
        }}
        // ▼▼▼ [แก้ไข] ส่ง props ใหม่ไปให้ FilterBar ▼▼▼
        subjects={subjects}
        progressMode={progressMode}
        setProgressModeAction={(m) => {
          setProgressMode(m);
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
      {data.length === 0 ? (
        <div className="py-6 text-center text-gray-500 dark:text-gray-400">
          ไม่พบข้อมูลนิสิตสำหรับสมุดนี้ หรืออาจยังไม่ได้เลือกสมุด
        </div>
      ) : (
        <StudentTable
          data={data}
          sortBy={sortBy}
          order={order}
          onSortAction={(col) => {
            if (sortBy === col) setOrder((o) => (o === "asc" ? "desc" : "asc"));
            else {
              setSortBy(col);
              setOrder("asc");
            }
          }}
        />
      )}
      <div className="mt-2 text-sm text-gray-600">
        แสดง <span className="font-medium">{data.length}</span> จาก{" "}
        <span className="font-medium">{total}</span> รายการ
      </div>
      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        setPageAction={setPage}
      />
    </div>
  );
}
