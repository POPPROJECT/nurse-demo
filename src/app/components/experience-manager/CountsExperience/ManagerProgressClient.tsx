'use client';
import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

type Book = { id: number; title: string };
type Course = { id: number; name: string };
type SubCourse = { id: number; name: string; requiredCount: number };
type Stat = {
  id: number;
  requiredCount: number;
  _count?: { experiences: number };
};

interface ManagerProgressClientProps {
  accessToken: string;
  studentId: number;
}

export default function ManagerProgressClient({
  accessToken,
  studentId,
}: ManagerProgressClientProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | ''>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [subcoursesByCourse, setSubcoursesByCourse] = useState<
    Record<number, SubCourse[]>
  >({});
  const [statsMap, setStatsMap] = useState<Record<number, Stat>>({});
  const [openCourses, setOpenCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${accessToken}` } }),
    [accessToken]
  );
  // 1) โหลดสมุดที่ student นี้มีสิทธิ์
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

  // 2) เมื่อเลือกสมุดให้โหลดคอร์ส + สถิติ + หัวข้อย่อย
  useEffect(() => {
    if (!selectedBook || !authHeader) return;

    const load = async () => {
      try {
        setLoading(true);

        // ดึงคอร์ส
        const { data: coursesData } = await axios.get<Course[]>(
          `${BASE}/experience-books/${selectedBook}/courses`,
          authHeader
        );
        setCourses(coursesData);

        // ดึงสถิติ subcourse ของ student
        const { data: statsData } = await axios.get<Stat[]>(
          `${BASE}/experience-books/${selectedBook}/subcourses/stats/student/${studentId}`,
          authHeader
        );

        const m: Record<number, Stat> = {};
        statsData.forEach((s) => (m[s.id] = s));
        setStatsMap(m);

        // ดึง subcourses แต่ละคอร์ส
        const arr = await Promise.all(
          coursesData.map((c) =>
            axios
              .get<SubCourse[]>(
                `${BASE}/courses/${c.id}/subcourses`,
                authHeader
              )
              .then((r) => ({ courseId: c.id, subs: r.data }))
              .catch(() => ({ courseId: c.id, subs: [] }))
          )
        );
        const byC: Record<number, SubCourse[]> = {};
        arr.forEach((x) => (byC[x.courseId] = x.subs));
        setSubcoursesByCourse(byC);
      } catch {
        Swal.fire('Error', 'โหลดข้อมูลไม่สำเร็จ', 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedBook, authHeader]);

  // toggle เปิด/ปิด subcourse
  const toggleCourse = (id: number) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // overall progress
  const overall = React.useMemo(() => {
    let done = 0,
      total = 0;
    Object.values(subcoursesByCourse)
      .flat()
      .forEach((sc) => {
        const raw = statsMap[sc.id]?._count?.experiences ?? 0;
        done += Math.min(raw, sc.requiredCount);
        total += sc.requiredCount;
      });
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [subcoursesByCourse, statsMap]);

  return (
    <div className="container px-4 py-8 mx-auto">
      {/* เลือกสมุด */}
      <div className="flex justify-end mb-6">
        <select
          className="px-4 py-2 border rounded-lg"
          value={selectedBook}
          onChange={(e) =>
            setSelectedBook(e.target.value ? +e.target.value : '')
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
          {/* การ์ดความคืบหน้าโดยรวม */}
          <div className="p-6 mb-6 bg-white rounded-lg shadow">
            <h2 className="mb-2 text-lg font-semibold">ความคืบหน้าโดยรวม</h2>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full h-2 mb-1 overflow-hidden bg-gray-200 rounded">
                  <div
                    className="h-2 transition-all bg-indigo-600"
                    style={{ width: `${overall.pct}%` }}
                  />
                </div>
                <div className="text-sm text-gray-700">{overall.pct}%</div>
              </div>
              <div className="font-medium text-indigo-800">
                {overall.done}/{overall.total}
              </div>
            </div>
          </div>

          {/* รายการคอร์ส */}
          <div className="space-y-4">
            {loading && <div className="text-center">กำลังโหลด...</div>}
            {!loading &&
              courses.map((course) => {
                const subs = subcoursesByCourse[course.id] || [];
                // คำนวณ progress ของคอร์สนี้
                const totals = subs.reduce(
                  (acc, sc) => {
                    const raw = statsMap[sc.id]?._count?.experiences ?? 0;
                    acc.done += Math.min(raw, sc.requiredCount);
                    acc.total += sc.requiredCount;
                    return acc;
                  },
                  { done: 0, total: 0 }
                );
                const coursePct = totals.total
                  ? Math.round((totals.done / totals.total) * 100)
                  : 0;
                const color =
                  coursePct < 50
                    ? 'bg-red-500'
                    : coursePct < 100
                    ? 'bg-yellow-500'
                    : 'bg-green-500';
                const isOpen = openCourses.has(course.id);

                return (
                  <div
                    key={course.id}
                    className="overflow-hidden border border-indigo-100 rounded-lg shadow-sm"
                  >
                    {/* Header (ชื่อคอร์ส + progress) */}
                    <div
                      className="flex items-center justify-between px-6 py-4 bg-white cursor-pointer"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <div className="flex items-center gap-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 text-indigo-600 transform transition-transform ${
                            isOpen ? 'rotate-180' : ''
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414
                             1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <h3 className="font-semibold text-indigo-900">
                          {course.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-indigo-600">
                          {coursePct}%
                        </span>
                        <div className="w-32 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`${color} h-1.5 transition-all`}
                            style={{ width: `${coursePct}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Subcourses (ถ้าเปิด) */}
                    {isOpen && (
                      <div className="p-4 space-y-4 border-t border-indigo-100 bg-indigo-50">
                        {subs.map((sc) => {
                          const raw = statsMap[sc.id]?._count?.experiences ?? 0;
                          const pct = sc.requiredCount
                            ? Math.round(
                                (Math.min(raw, sc.requiredCount) /
                                  sc.requiredCount) *
                                  100
                              )
                            : 0;
                          const col =
                            pct < 50
                              ? 'bg-red-500 text-red-600'
                              : pct < 100
                              ? 'bg-yellow-500 text-yellow-600'
                              : 'bg-green-500 text-green-600';
                          return (
                            <div
                              key={sc.id}
                              className="p-4 bg-white rounded-lg shadow-sm"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-800">
                                  {sc.name}
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">
                                    {pct}%
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    ({Math.min(raw, sc.requiredCount)}/
                                    {sc.requiredCount})
                                  </span>
                                </div>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full">
                                <div
                                  className={`${col} h-2 rounded-full transition-all`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                        {subs.length === 0 && (
                          <p className="text-center text-gray-500">
                            ไม่มีหัวข้อย่อย
                          </p>
                        )}
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
