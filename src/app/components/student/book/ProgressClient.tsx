'use client';
import React, { useState, useEffect } from 'react';
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

type FieldConfig = { id: number; label: string };
type FieldValue = { fieldId: number; value: string };
type Experience = {
  course: string;
  subCourse: string;
  subject?: number;
  alwaycourse?: number;
  fieldValues: FieldValue[];
  approverName: string;
};

export default function ProgressClient({
  accessToken,
}: {
  accessToken: string;
}) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | ''>('');
  const [courses, setCourses] = useState<Course[]>([]);
  const [subcoursesByCourse, setSubcoursesByCourse] = useState<
    Record<number, SubCourse[]>
  >({});
  const [statsMap, setStatsMap] = useState<Record<number, Stat>>({});
  const [openCourses, setOpenCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // ข้อมูลสำหรับ PDF
  const [fields, setFields] = useState<FieldConfig[]>([]);
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [bookTitle, setBookTitle] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [studentId, setStudentId] = useState<string>('');

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = { headers: { Authorization: `Bearer ${accessToken}` } };

  // 1. Load authorized books
  useEffect(() => {
    axios
      .get<Book[]>(`${BASE}/experience-books/authorized`, authHeader)
      .then((r) => setBooks(r.data))
      .catch(() => Swal.fire('Error', 'โหลดสมุดไม่ได้', 'error'));
  }, [BASE]);

  // 2. Whenever selectedBook changes, fetch all data
  useEffect(() => {
    if (!selectedBook) {
      setCourses([]);
      setSubcoursesByCourse({});
      setStatsMap({});
      setOpenCourses(new Set());
      setLoading(false);
      setFields([]);
      setExperiences([]);
      setBookTitle('');
      return;
    }

    const loadAll = async () => {
      try {
        setLoading(true);

        // — a) Fetch courses
        const { data: coursesData } = await axios.get<Course[]>(
          `${BASE}/experience-books/${selectedBook}/courses`,
          authHeader
        );
        setCourses(coursesData);

        // — b) Fetch stats สำหรับ progress bar
        const { data: statsData } = await axios.get<Stat[]>(
          `${BASE}/experience-books/${selectedBook}/subcourses/stats`,
          authHeader
        );
        const newStatsMap: Record<number, Stat> = {};
        statsData.forEach((s) => {
          newStatsMap[s.id] = s;
        });
        setStatsMap(newStatsMap);

        // — c) Fetch subcourses แต่ละคอร์ส
        const subArr = await Promise.all(
          coursesData.map((c) =>
            axios
              .get<SubCourse[]>(
                `${BASE}/courses/${c.id}/subcourses`,
                authHeader
              )
              .then((r) => ({ courseId: c.id, subs: r.data }))
              .catch(() => ({ courseId: c.id, subs: [] as SubCourse[] }))
          )
        );
        const byCourse: Record<number, SubCourse[]> = {};
        subArr.forEach(({ courseId, subs }) => {
          byCourse[courseId] = subs;
        });
        setSubcoursesByCourse(byCourse);

        // — d) Fetch field configuration (หัวตาราง PDF)
        const { data: fieldCfg } = await axios.get<FieldConfig[]>(
          `${BASE}/experience-books/${selectedBook}/fields`,
          authHeader
        );
        setFields(fieldCfg);

        // — e) Fetch ประวัติที่ status=CONFIRMED ทั้งหมด
        const { data: expPage } = await axios.get<{
          total: number;
          data: Experience[];
        }>(`${BASE}/student-experiences`, {
          ...authHeader,
          params: {
            bookId: selectedBook,
            status: 'CONFIRMED',
            page: 1,
            limit: 1000,
          },
        });
        setExperiences(expPage.data);

        // — f) Fetch ชื่อสมุด (title)
        const { data: bookData } = await axios.get<{ title: string }>(
          `${BASE}/experience-books/${selectedBook}`,
          authHeader
        );
        setBookTitle(bookData.title);

        // — g) Fetch ข้อมูลนิสิต (สมมติ endpoint นี้คืน studentProfile)
        const { data: profile } = await axios.get<{
          studentId: string;
          user: { name: string };
        }>(`${BASE}/users/me/profile`, authHeader);
        setUserName(profile.user.name);
        setStudentId(profile.studentId);
      } catch (err) {
        console.error(err);
        Swal.fire('Error', 'เกิดข้อผิดพลาดในการโหลดข้อมูล', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [selectedBook, BASE]);

  // toggle expand/collapse
  const toggleCourse = (courseId: number) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      next.has(courseId) ? next.delete(courseId) : next.add(courseId);
      return next;
    });
  };

  // compute overall progress
  const overall = React.useMemo(() => {
    let cappedDone = 0;
    let total = 0;

    Object.values(subcoursesByCourse).forEach((subs) => {
      subs.forEach((sc) => {
        const rawDone = statsMap[sc.id]?._count?.experiences ?? 0;
        cappedDone += Math.min(rawDone, sc.alwaycourse);
        total += sc.alwaycourse;
      });
    });

    const percent = total
      ? Math.min(100, Math.round((cappedDone / total) * 100))
      : 0;

    return { done: cappedDone, total, percent };
  }, [subcoursesByCourse, statsMap]);

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg duration-300 ease-in-out transition-all hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">
          ตรวจสอบความคืบหน้า
        </h1>
      </div>

      <div className="w-full">
        {/* นี่ */}
        <div className="p-6 mb-1 bg-white shadow-md rounded-xl dark:bg-[#1E293B] ">
          {/* ใช้ flex และ items-center เพื่อจัดให้อยู่ในแนวเดียวกัน */}
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            {/* เลือกสมุด */}
            <div className="w-full sm:w-auto">
              <label
                htmlFor="bookFilter"
                className="block mb-1 text-sm font-medium text-gray-800 dark:text-white"
              >
                สมุด
              </label>
              <select
                id="bookSelector"
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300 shadow-sm transition-all"
                value={selectedBook}
                onChange={(e) =>
                  setSelectedBook(e.target.value ? Number(e.target.value) : '')
                }
              >
                <option className="dark:text-gray-800" value="">
                  -- เลือกสมุด --
                </option>
                {books.map((b) => (
                  <option
                    key={b.id}
                    value={b.id}
                    className="dark:text-gray-800"
                    title={b.title} // ✅ เพิ่ม title ให้ hover แล้วเห็นชื่อเต็ม
                  >
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Overall Progress */}
        {!loading && selectedBook && (
          <div
            id="overallProgress"
            className="p-6 mt-6 bg-white shadow-md rounded-xl dark:bg-[#1E293B]"
          >
            <h2 className="mb-4 text-xl font-semibold text-[#f46b45]">
              ความคืบหน้าโดยรวม
            </h2>
            <div className="flex items-end gap-4">
              <div className="w-full">
                <div className="flex justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                    ความสำเร็จทั้งหมด
                  </span>
                  <span className="text-sm font-medium text-indigo-500 ">
                    {overall.percent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-indigo-600  h-2.5 rounded-full transition-all"
                    style={{ width: `${overall.percent}%` }}
                  />
                </div>
              </div>
              <div className="text-base  dark:text-gray-300 text-gray-800 min-w-[80px] text-right">
                ({overall.done}/{overall.total})
              </div>
            </div>
          </div>
        )}

        {/* Course List Container */}
        <div className="p-6 bg-white shadow-md rounded-xl dark:bg-[#1E293B] mt-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-12 h-12 border-4 border-indigo-200 rounded-full border-t-indigo-600 animate-spin"></div>
              <p className="mt-4 font-medium text-indigo-600">
                กำลังโหลดข้อมูล...
              </p>
            </div>
          )}

          {!loading && selectedBook && courses.length === 0 && (
            <div className="py-20 text-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-16 h-16 mx-auto text-indigo-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <p className="mt-4 text-lg text-indigo-800">
                ไม่มีคอร์สสำหรับสมุดนี้
              </p>
              <p className="text-indigo-400">
                กรุณาเลือกสมุดอื่น หรือเพิ่มคอร์สใหม่
              </p>
            </div>
          )}

          {!loading && courses.length > 0 && (
            <div className="space-y-4" id="courseList">
              {courses.map((course) => {
                const subcs = subcoursesByCourse[course.id] || [];
                const courseTotals = subcs.reduce(
                  (acc, sc) => {
                    const raw = statsMap[sc.id]?._count?.experiences ?? 0;
                    acc.done += Math.min(raw, sc.alwaycourse);
                    acc.total += sc.alwaycourse;
                    return acc;
                  },
                  { done: 0, total: 0 }
                );
                const coursePct = courseTotals.total
                  ? Math.min(
                      100,
                      Math.round((courseTotals.done / courseTotals.total) * 100)
                    )
                  : 0;
                const barColor =
                  coursePct < 50
                    ? 'bg-red-500'
                    : coursePct < 100
                    ? 'bg-yellow-500'
                    : 'bg-green-500';
                const isOpen = openCourses.has(course.id);

                return (
                  <div
                    key={course.id}
                    className="overflow-hidden transition-all border border-gray-200 shadow-sm dark:border-gray-700 rounded-xl hover:shadow-md"
                  >
                    {/* Course Toggle */}
                    <div
                      className="cursor-pointer course-toggle"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <div className="px-5 py-4 bg-white dark:bg-gray-600 ">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className={`h-5 w-5 text-indigo-600 dark:text-gray-200 transform transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M5.293 7.293a1 1 0
                                  011.414 0L10 10.586l3.293-3.293a1
                                  1 0 111.414 1.414l-4 4a1 1 0
                                  01-1.414 0l-4-4a1 1 0
                                  010-1.414z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <h3 className="font-semibold text-gray-700 dark:text-white">
                              {course.name}
                            </h3>
                          </div>
                        </div>
                        <div className="mt-2">
                          <div className="w-full h-2 bg-gray-200 rounded-full">
                            <div
                              className={`h-2 rounded-full ${barColor} transition-all`}
                              style={{ width: `${coursePct}%` }}
                            />
                          </div>

                          <div className="text-sm font-medium text-right text-indigo-600 dark:text-white">
                            {coursePct}%
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Subcourses */}
                    {isOpen && (
                      <div className="subcourse-container open">
                        <div className="p-5 space-y-4 bg-gray-300 border-t border-gray-100 dark:bg-gray-500 ">
                          {subcs.map((sc) => {
                            const done =
                              statsMap[sc.id]?._count?.experiences ?? 0;
                            const total = sc.alwaycourse;
                            const pct = total
                              ? Math.min(100, Math.round((done / total) * 100))
                              : 0;
                            const color =
                              pct < 50
                                ? 'bg-red-500 text-red-600'
                                : pct < 100
                                ? 'bg-yellow-500 text-yellow-600'
                                : 'bg-green-500 text-green-600';
                            return (
                              <div
                                key={sc.id}
                                className="p-4 bg-white dark:bg-[#364153] dark:text-white rounded-lg shadow-sm"
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <span className="font-medium text-gray-800 dark:text-white">
                                    {sc.name}
                                  </span>
                                </div>
                                <div className="w-full h-2 bg-gray-200 rounded-full">
                                  <div
                                    className={`h-2 rounded-full transition-all ${color}`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                                <div className="text-sm text-right text-gray-700 dark:text-gray-300">
                                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                    {pct}% ({done}/{total})
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          {subcs.length === 0 && (
                            <p className="text-center text-gray-500">
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
          )}
        </div>
      </div>
    </div>
  );
}
