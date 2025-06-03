'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

type Book = { id: number; title: string };
type Course = { id: number; name: string };
type SubCourse = { id: number; name: string; alwaycourse: number };
type Stat = {
  id: number;
  alwaycourse: number;
  _count?: { experiences: number };
};

interface ApproverProgressClientProps {
  accessToken: string;
  studentId: number;
}

export default function ApproverProgressClient({
  accessToken,
  studentId,
}: ApproverProgressClientProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | ''>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [subcoursesByCourse, setSubcoursesByCourse] = useState<
    Record<number, SubCourse[]>
  >({});
  const [statsMap, setStatsMap] = useState<Record<number, Stat>>({});
  const [openCourses, setOpenCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${accessToken}` } }),
    [accessToken]
  );
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;

  // โหลดสมุด
  useEffect(() => {
    if (!studentId || !authHeader) return;
    axios
      .get<Book[]>(
        `${BASE}/experience-books/authorized/student/${studentId}`,
        authHeader
      )
      .then((r) => setBooks(r.data))
      .catch(() => Swal.fire('Error', 'โหลดสมุดไม่ได้', 'error'));
  }, [studentId, authHeader]);

  // โหลดคอร์ส + สถิติ + หัวข้อย่อย เมื่อเลือกสมุด
  useEffect(() => {
    if (!selectedBook) {
      setCourses([]);
      setSubcoursesByCourse({});
      setStatsMap({});
      setOpenCourses(new Set());
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        const [coursesRes, statsRes] = await Promise.all([
          axios.get<Course[]>(
            `${BASE}/experience-books/${selectedBook}/courses`,
            authHeader
          ),
          axios.get<Stat[]>(
            `${BASE}/experience-books/${selectedBook}/subcourses/stats/student/${studentId}`,
            authHeader
          ),
        ]);
        setCourses(coursesRes.data);
        const m: Record<number, Stat> = {};
        statsRes.data.forEach((s) => (m[s.id] = s));
        setStatsMap(m);

        const arr = await Promise.all(
          coursesRes.data.map((c) =>
            axios
              .get<SubCourse[]>(
                `${BASE}/courses/${c.id}/subcourses`,
                authHeader
              )
              .then((r) => ({ id: c.id, subs: r.data }))
              .catch(() => ({ id: c.id, subs: [] }))
          )
        );
        const byC: Record<number, SubCourse[]> = {};
        arr.forEach((x) => (byC[x.id] = x.subs));
        setSubcoursesByCourse(byC);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'โหลดข้อมูลไม่สำเร็จ', 'error');
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedBook, studentId, authHeader, BASE]);

  const toggleCourse = (id: number) => {
    setOpenCourses((prev) => {
      const nxt = new Set(prev);
      nxt.has(id) ? nxt.delete(id) : nxt.add(id);
      return nxt;
    });
  };

  // คำนวณ overall progress
  const overall = useMemo(() => {
    let done = 0,
      total = 0;
    Object.values(subcoursesByCourse)
      .flat()
      .forEach((sc) => {
        const r = statsMap[sc.id]?._count?.experiences ?? 0;
        done += Math.min(r, sc.alwaycourse);
        total += sc.alwaycourse;
      });
    const pct = total ? Math.min(100, Math.round((done / total) * 100)) : 0;
    return { done, total, percent: pct };
  }, [subcoursesByCourse, statsMap]);

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-2 space-y-6 sm:mt-0">
      {/* Select Book */}
      <div className="p-6 bg-white dark:bg-[#1E293B] rounded-xl shadow-md">
        <label className="block mb-2 text-gray-700 dark:text-gray-300">
          เลือกสมุด
        </label>
        <select
          className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={selectedBook}
          onChange={(e) =>
            setSelectedBook(e.target.value ? Number(e.target.value) : '')
          }
        >
          <option value="">-- เลือกสมุด --</option>
          {books.map((b) => (
            <option key={b.id} value={b.id}>
              {b.title}
            </option>
          ))}
        </select>
      </div>

      {selectedBook && (
        <>
          {/* Overall Progress */}
          <div className="p-4 bg-white border border-gray-200 shadow-md dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h2 className="mb-4 text-xl font-semibold text-[#f46b45]">
                ความคืบหน้าโดยรวม
              </h2>
            </div>
            <div className="h-2 mb-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
              <div
                className="h-full transition-all bg-indigo-600"
                style={{ width: `${overall.percent}%` }}
              />
            </div>
            <div className="text-sm text-right text-gray-700 dark:text-gray-300">
              <span className="mr-2 font-semibold text-indigo-600">
                {overall.percent}%
              </span>
              ({overall.done}/{overall.total})
            </div>
          </div>

          {/* Course List */}
          <div className="p-6 bg-white shadow-md rounded-xl dark:bg-[#1E293B] mt-1">
            {loading && (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                กำลังโหลดข้อมูล...
              </div>
            )}

            {!loading && courses.length === 0 && (
              <div className="py-10 text-center text-gray-500 dark:text-gray-400">
                ไม่มีคอร์สสำหรับสมุดนี้
              </div>
            )}

            {!loading &&
              courses.map((course) => {
                const subs = subcoursesByCourse[course.id] || [];
                const totals = subs.reduce(
                  (acc: { done: number; total: number }, sc: SubCourse) => {
                    const doneCount = statsMap[sc.id]?._count?.experiences ?? 0;
                    acc.done += Math.min(doneCount, sc.alwaycourse);
                    acc.total += sc.alwaycourse;
                    return acc;
                  },
                  { done: 0, total: 0 }
                );
                const pct = totals.total
                  ? Math.round((totals.done / totals.total) * 100)
                  : 0;
                const barColor =
                  pct < 50
                    ? 'bg-red-500'
                    : pct < 100
                    ? 'bg-yellow-500'
                    : 'bg-green-500';
                const isOpen = openCourses.has(course.id);

                return (
                  <div
                    key={course.id}
                    className="mt-3 overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-600 rounded-xl dark:border-gray-700 "
                  >
                    {/* Course Toggle */}
                    <button
                      onClick={() => toggleCourse(course.id)}
                      className="flex items-center justify-between w-full px-4 py-3 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`w-5 h-5 transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          } text-indigo-600 dark:text-gray-200`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10
                               10.586l3.293-3.293a1 1 0 111.414
                               1.414l-4 4a1 1 0 01-1.414
                               0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-medium text-gray-800 dark:text-gray-200">
                          {course.name}
                        </span>
                      </div>
                    </button>

                    {/* Course Bar */}
                    <div className="px-4 pb-3 ">
                      <div className="h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                        <div
                          className={`${barColor} h-full transition-all`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-indigo-600 dark:text-gray-200 ">
                          {pct}%
                        </span>
                      </div>
                    </div>

                    {/* Subcourses */}
                    {isOpen && (
                      <div>
                        <div className="p-5 space-y-4 bg-gray-100 border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                          {subs.length > 0 ? (
                            subs.map((sc) => {
                              const doneCount =
                                statsMap[sc.id]?._count?.experiences ?? 0;
                              const pct = sc.alwaycourse
                                ? Math.round(
                                    (Math.min(doneCount, sc.alwaycourse) /
                                      sc.alwaycourse) *
                                      100
                                  )
                                : 0;
                              const barColor =
                                pct < 50
                                  ? 'bg-red-500'
                                  : pct < 100
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500';
                              return (
                                <div
                                  key={sc.id}
                                  className="p-4 bg-white rounded-lg shadow dark:bg-gray-800"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-gray-800 dark:text-gray-200">
                                      {sc.name}
                                    </span>
                                  </div>
                                  <div className="w-full h-2 overflow-hidden bg-gray-200 rounded-full">
                                    <div
                                      className={`${barColor} h-2 transition-all`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <div className="text-sm text-right text-gray-700 dark:text-gray-300">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                      {pct}% (
                                      {Math.min(doneCount, sc.alwaycourse)}/
                                      {sc.alwaycourse})
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-center text-gray-500 dark:text-gray-400">
                              ไม่มีหัวข้อย่อย
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </>
      )}
    </div>
  );
}
