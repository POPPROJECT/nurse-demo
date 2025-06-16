"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select";

// --- TYPE DEFINITIONS ---
type Book = { id: number; title: string };
type Course = { id: number; name: string };
type SubCourse = {
  id: number;
  name: string;
  subject: string | null;
  alwaycourse: number | null;
  inSubjectCount: number | null;
  isSubjectFreeform: boolean;
};
type Stat = {
  id: number;
  _count?: { experiences: number };
};

// --- MAIN COMPONENT ---
export default function ProgressClient({
  accessToken,
}: {
  accessToken: string;
}) {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${accessToken}` } }),
    [accessToken],
  );

  // --- STATES ---
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | "">("");
  const [progressMode, setProgressMode] = useState<"all" | "subject">("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [subcoursesByCourse, setSubcoursesByCourse] = useState<
    Record<number, SubCourse[]>
  >({});
  const [statsMap, setStatsMap] = useState<
    Record<number, Pick<Stat, "_count">>
  >({});
  const [openCourses, setOpenCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!accessToken) return;
    axios
      .get<Book[]>(`${BASE}/experience-books/authorized`, authHeader)
      .then((res) => setBooks(res.data))
      .catch(() => Swal.fire("Error", "ไม่สามารถโหลดรายการสมุดได้", "error"));
  }, [BASE, accessToken, authHeader]);

  useEffect(() => {
    const resetState = () => {
      setCourses([]);
      setSubcoursesByCourse({});
      setStatsMap({});
      setOpenCourses(new Set());
      setProgressMode("all");
    };

    if (!selectedBook) {
      resetState();
      return;
    }

    const loadAll = async () => {
      setLoading(true);
      resetState();
      try {
        const [coursesRes, statsRes] = await Promise.all([
          axios.get<Course[]>(
            `${BASE}/experience-books/${selectedBook}/courses`,
            authHeader,
          ),
          axios.get<Stat[]>(
            `${BASE}/experience-books/${selectedBook}/subcourses/stats`,
            authHeader,
          ),
        ]);
        setCourses(coursesRes.data);

        const sortedCourses = coursesRes.data.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true }),
        );
        setCourses(sortedCourses);

        const newStatsMap: Record<number, Pick<Stat, "_count">> = {};
        statsRes.data.forEach((s) => {
          newStatsMap[s.id] = { _count: s._count };
        });
        setStatsMap(newStatsMap);

        const subcoursePromises = coursesRes.data.map((c) =>
          axios
            .get<SubCourse[]>(`${BASE}/courses/${c.id}/subcourses`, authHeader)
            .then((res) => ({ courseId: c.id, subs: res.data })),
        );
        const subcourseResults = await Promise.all(subcoursePromises);
        const newSubcoursesByCourse: Record<number, SubCourse[]> = {};
        subcourseResults.forEach(({ courseId, subs }) => {
          newSubcoursesByCourse[courseId] = subs;
        });
        setSubcoursesByCourse(newSubcoursesByCourse);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "เกิดข้อผิดพลาดในการโหลดข้อมูล", "error");
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, [selectedBook, BASE, authHeader]);

  // --- CALCULATIONS ---
  const overall = useMemo(() => {
    const allSubCourses = Object.values(subcoursesByCourse).flat();
    let cappedDone = 0;
    let total = 0;

    allSubCourses.forEach((sc) => {
      const required =
        progressMode === "subject" ? sc.inSubjectCount : sc.alwaycourse;
      if (required && required > 0) {
        const rawDone = statsMap[sc.id]?._count?.experiences ?? 0;
        cappedDone += Math.min(rawDone, required);
        total += required;
      }
    });

    const percent = total ? Math.round((cappedDone / total) * 100) : 0;
    const label =
      progressMode === "subject"
        ? "ความคืบหน้าในวิชา"
        : "ความคืบหน้าตลอดหลักสูตร";
    return { done: cappedDone, total, percent, label };
  }, [subcoursesByCourse, statsMap, progressMode]);

  // --- RENDER LOGIC ---
  const toggleCourse = (courseId: number) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      next.has(courseId) ? next.delete(courseId) : next.add(courseId);
      return next;
    });
  };

  const progressModeOptions = [
    { value: "all", label: "ตลอดหลักสูตร" },
    { value: "subject", label: "ในวิชา" },
  ];
  const selectedProgressModeOption =
    progressModeOptions.find((opt) => opt.value === progressMode) || null;

  const getBarColor = (pct: number) => {
    if (pct >= 100) return "bg-green-400"; // ถ้า 100 หรือมากกว่า เป็นสีเขียว
    if (pct >= 50) return "bg-yellow-400"; // [แก้ไข] ถ้า 50 หรือมากกว่า (แต่ไม่ถึง 100) เป็นสีเหลือง
    return "bg-red-400"; // ที่เหลือน้อยกว่า 50 เป็นสีแดง
  };

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md">
        <h1 className="text-xl font-semibold sm:text-2xl">
          ตรวจสอบความคืบหน้า
        </h1>
      </div>

      <div className="p-4 mb-6 bg-white shadow-md rounded-xl dark:bg-[#1E293B]">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="flex-1 w-full">
            <label className="block mb-1 text-sm font-medium text-gray-800 dark:text-white">
              สมุด
            </label>
            <Select
              instanceId="book-select-student"
              options={books.map((b) => ({ value: b.id, label: b.title }))}
              value={
                books
                  .map((b) => ({ value: b.id, label: b.title }))
                  .find((opt) => opt.value === selectedBook) || null
              }
              onChange={(opt) => setSelectedBook(opt ? opt.value : "")}
              placeholder="-- เลือกสมุด --"
              isClearable
              className="text-gray-800 react-select-container"
              classNamePrefix="react-select"
            />
          </div>
          <div className="flex-1 w-full">
            <label className="block mb-1 text-sm font-medium text-gray-800 dark:text-white">
              ความคืบหน้า
            </label>
            <Select
              instanceId="progress-mode-select-student"
              options={progressModeOptions}
              value={selectedProgressModeOption}
              onChange={(opt) =>
                setProgressMode(opt ? (opt.value as "all" | "subject") : "all")
              }
              isDisabled={!selectedBook}
              className="text-gray-800 react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </div>

      {!loading && selectedBook && (
        <div className="p-6 mt-6 bg-white shadow-md rounded-xl dark:bg-[#1E293B]">
          <h2 className="mb-4 text-xl font-semibold text-[#f46b45]">
            {overall.label}
          </h2>
          <div className="flex items-end gap-4">
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  ความสำเร็จ
                </span>
                <span className="text-sm font-medium text-indigo-500">
                  {overall.percent}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${overall.percent}%` }}
                ></div>
              </div>
            </div>
            <div className="text-base dark:text-gray-300 text-gray-800 min-w-[80px] text-right">
              ({overall.done}/{overall.total})
            </div>
          </div>
        </div>
      )}

      <div className="p-6 mt-6 bg-white shadow-md rounded-xl dark:bg-[#1E293B] dark:text-gray-300 text-gray-800">
        {loading && <div className="py-20 text-center">กำลังโหลดข้อมูล...</div>}
        {!loading && !selectedBook && (
          <div className="py-20 text-center">กรุณาเลือกสมุดเพื่อดูข้อมูล</div>
        )}
        {!loading && selectedBook && courses.length === 0 && (
          <div className="py-20 text-center">ไม่พบข้อมูลในสมุดนี้</div>
        )}

        {!loading && courses.length > 0 && (
          <div className="space-y-4" id="courseList">
            {courses.map((course) => {
              const subcs = subcoursesByCourse[course.id] || [];
              if (subcs.length === 0) return null;

              const courseTotals = subcs.reduce(
                (acc, sc) => {
                  const required =
                    progressMode === "subject"
                      ? sc.inSubjectCount
                      : sc.alwaycourse;
                  if (required && required > 0) {
                    const raw = statsMap[sc.id]?._count?.experiences ?? 0;
                    acc.done += Math.min(raw, required);
                    acc.total += required;
                  }
                  return acc;
                },
                { done: 0, total: 0 },
              );

              const coursePct =
                courseTotals.total > 0
                  ? Math.round((courseTotals.done / courseTotals.total) * 100)
                  : 100; // ถ้า total เป็น 0 หรือน้อยกว่า ให้เป็น 100%

              const barColor = getBarColor(coursePct);
              const isOpen = openCourses.has(course.id);

              return (
                <div
                  key={course.id}
                  className="mt-3 overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-600 rounded-xl dark:border-gray-700"
                >
                  <div
                    className="cursor-pointer"
                    onClick={() => toggleCourse(course.id)}
                  >
                    <div className="px-5 py-4 bg-white dark:bg-gray-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-5 w-5 text-indigo-600 dark:text-gray-200 transform transition-transform ${isOpen ? "rotate-180" : ""}`}
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                            {course.name}
                          </h3>
                        </div>
                      </div>
                      <div className="px-4 pb-3 mt-3">
                        <div className="h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                          <div
                            className={`h-full ${barColor} transition-all`}
                            style={{ width: `${coursePct}%` }}
                          ></div>
                        </div>
                        <div className="text-sm font-medium text-right text-indigo-600 dark:text-gray-200">
                          {coursePct}%
                        </div>
                      </div>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="p-5 space-y-4 bg-gray-100 border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                      {subcs.map((sc) => {
                        const required =
                          progressMode === "subject"
                            ? sc.inSubjectCount
                            : sc.alwaycourse;
                        const done = statsMap[sc.id]?._count?.experiences ?? 0;
                        const pct =
                          required === null ||
                          required === undefined ||
                          required <= 0
                            ? 100
                            : Math.min(
                                100,
                                Math.round((done / required) * 100),
                              );
                        const subBarColor = getBarColor(pct);

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
                                className={`${subBarColor} h-2 transition-all`}
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                            <div className="text-sm text-right text-gray-700 dark:text-gray-300">
                              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                {pct}% ({done}/{required ?? 0})
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
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
