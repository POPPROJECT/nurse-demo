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
  alwaycourse: number;
  inSubjectCount: number; // เพิ่ม field นี้
  subject: string | null;
};
type Stat = {
  id: number;
  alwaycourse: number;
  _count?: { experiences: number };
};
interface ApproverProgressClientProps {
  accessToken: string;
  studentId: number;
}

// --- ฟังก์ชัน Helper สำหรับการเรียงลำดับ ---
const parseVersion = (name: string): number[] => {
  const match = name.match(/^[\d.]+/);
  if (!match) return [Infinity, Infinity];
  const parts = match[0].split(".").map((num) => parseInt(num, 10) || 0);
  return [parts[0] || 0, parts[1] || 0];
};

const compareCourses = (a: Course | SubCourse, b: Course | SubCourse) => {
  const [aMajor, aMinor] = parseVersion(a.name);
  const [bMajor, bMinor] = parseVersion(b.name);
  if (aMajor !== bMajor) return aMajor - bMajor;
  return aMinor - bMinor;
};

// --- MAIN COMPONENT ---
export default function ApproverProgressClient({
  accessToken,
  studentId,
}: ApproverProgressClientProps) {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${accessToken}` } }),
    [accessToken],
  );

  // --- STATES ---
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | "">("");
  const [progressMode, setProgressMode] = useState<string>("all");
  const [courses, setCourses] = useState<Course[]>([]);
  const [subcoursesByCourse, setSubcoursesByCourse] = useState<
    Record<number, SubCourse[]>
  >({});
  const [statsMap, setStatsMap] = useState<Record<number, Stat>>({});
  const [openCourses, setOpenCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);

  // --- DATA FETCHING ---
  useEffect(() => {
    if (!studentId || !authHeader) return;
    axios
      .get<Book[]>(
        `${BASE}/experience-books/authorized/student/${studentId}`,
        authHeader,
      )
      .then((r) => setBooks(r.data))
      .catch(() => Swal.fire("Error", "โหลดสมุดไม่ได้", "error"));
  }, [studentId, authHeader, BASE]);

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

    const loadData = async () => {
      setLoading(true);
      resetState();
      try {
        const [coursesRes, statsRes] = await Promise.all([
          axios.get<Course[]>(
            `${BASE}/experience-books/${selectedBook}/courses`,
            authHeader,
          ),
          axios.get<Stat[]>(
            `${BASE}/experience-books/${selectedBook}/subcourses/stats/student/${studentId}`,
            authHeader,
          ),
        ]);

        const sortedCourses = coursesRes.data.slice().sort(compareCourses);
        setCourses(sortedCourses);

        const m: Record<number, Stat> = {};
        statsRes.data.forEach((s) => (m[s.id] = s));
        setStatsMap(m);

        const subcoursePromises = sortedCourses.map(
          (
            c, // ใช้ sortedCourses
          ) =>
            axios
              .get<
                SubCourse[]
              >(`${BASE}/courses/${c.id}/subcourses`, authHeader)
              .then((r) => ({ id: c.id, subs: r.data })),
        );
        const subcourseResults = await Promise.all(subcoursePromises);
        const byC: Record<number, SubCourse[]> = {};
        subcourseResults.forEach((x) => (byC[x.id] = x.subs));
        setSubcoursesByCourse(byC);
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "โหลดข้อมูลไม่สำเร็จ", "error");
      } finally {
        setLoading(false);
      }
    };
    if (selectedBook) loadData();
  }, [selectedBook, studentId, authHeader, BASE]);

  // --- CALCULATIONS ---
  const { overall, filteredCourses } = useMemo(() => {
    // ▼▼▼ [แก้ไข] เปลี่ยน Logic การเปรียบเทียบทั้งหมดตรงนี้ ▼▼▼

    // 1. เช็คว่าเป็นโหมดรายวิชาหรือไม่ (ไม่ใช่ 'all')
    const isSubjectMode = progressMode === "inSubject";
    const requirementKey = isSubjectMode ? "inSubjectCount" : "alwaycourse";
    const label = isSubjectMode
      ? "ความคืบหน้าในวิชา"
      : "ความคืบหน้าตลอดหลักสูตร";
    let totalDone = 0;
    let totalRequired = 0;

    const allSubCourses = Object.values(subcoursesByCourse).flat();
    allSubCourses.forEach((sc) => {
      const required = sc[requirementKey] ?? 0;
      if (required > 0) {
        const done = statsMap[sc.id]?._count?.experiences ?? 0;
        totalDone += Math.min(done, required);
        totalRequired += required;
      }
    });

    const percent =
      totalRequired === 0 ? 100 : Math.round((totalDone / totalRequired) * 100);

    const overallResult = {
      done: totalDone,
      total: totalRequired,
      percent,
      label,
    };

    const filteredCoursesResult = courses;

    return { overall: overallResult, filteredCourses: filteredCoursesResult };
  }, [subcoursesByCourse, statsMap, progressMode, courses]);

  // --- RENDER LOGIC ---
  const toggleCourse = (id: number) => {
    setOpenCourses((prev) => {
      const nxt = new Set(prev);
      nxt.has(id) ? nxt.delete(id) : nxt.add(id);
      return nxt;
    });
  };

  // ▼▼▼ [แก้ไข] ปรับการสร้าง Options ให้ถูกต้อง 100% ▼▼▼
  const progressOptions = [
    { value: "all", label: "ตลอดหลักสูตร" },
    { value: "inSubject", label: "ในวิชา" },
  ];
  // ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲
  const selectedProgressModeOption =
    progressOptions.find((opt) => opt.value === progressMode) || null;

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-2 space-y-6 sm:mt-0">
      <div className="p-6 bg-white dark:bg-[#1E293B] rounded-xl shadow-md">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="flex-1 w-full">
            <label className="block mb-2 text-gray-700 dark:text-gray-300">
              เลือกสมุด
            </label>
            <Select
              instanceId="book-select-approver-check"
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
            <label className="block mb-2 text-gray-700 dark:text-gray-300">
              ความคืบหน้า
            </label>
            <Select
              instanceId="progress-mode-approver-check"
              options={progressOptions}
              value={selectedProgressModeOption}
              onChange={(opt) => setProgressMode(opt ? opt.value : "all")}
              isDisabled={!selectedBook}
              className="text-gray-800 react-select-container"
              classNamePrefix="react-select"
            />
          </div>
        </div>
      </div>

      {selectedBook && !loading && (
        <>
          {/* <div className="p-4 bg-white border border-gray-200 shadow-md dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <h2 className="mb-2 text-xl font-semibold text-[#f46b45]">{overall.label}</h2>
            <div className="h-2 mb-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
              <div className="h-full transition-all bg-indigo-600" style={{ width: `${overall.percent}%` }}></div>
            </div>
            <div className="text-sm text-right text-gray-700 dark:text-gray-300">
              <span className="mr-2 font-semibold text-indigo-600">{overall.percent}%</span>
              ({overall.done}/{overall.total})
            </div>
          </div> */}
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

          <div className="p-6 mt-1 bg-white shadow-md rounded-xl dark:bg-[#1E293B]">
            {loading && (
              <div className="py-10 text-center">กำลังโหลดข้อมูล...</div>
            )}
            {!loading && filteredCourses.length === 0 && (
              <div className="py-10 text-center">ไม่พบข้อมูล</div>
            )}

            {/* ▼▼▼ [แก้ไข] คืนค่า UI การแสดงผลแบบ Accordion เหมือนเดิม ▼▼▼ */}
            {!loading &&
              filteredCourses.map((course) => {
                const requirementKey =
                  progressMode === "inSubject"
                    ? "inSubjectCount"
                    : "alwaycourse";

                const allSubsInCourse = subcoursesByCourse[course.id] || [];

                const totals = allSubsInCourse.reduce(
                  (acc, sc) => {
                    const required = sc[requirementKey] ?? 0;
                    // คำนวณเฉพาะรายการที่มี required > 0 เพื่อความแม่นยำของ %
                    if (required > 0) {
                      const done = statsMap[sc.id]?._count?.experiences ?? 0;
                      acc.done += Math.min(done, required);
                      acc.total += required;
                    }
                    return acc;
                  },
                  { done: 0, total: 0 },
                );

                const pct =
                  totals.total === 0
                    ? 100
                    : Math.round((totals.done / totals.total) * 100);

                const barColor =
                  pct === 100
                    ? "bg-green-400"
                    : pct >= 50
                      ? "bg-yellow-400"
                      : "bg-red-400";
                const isOpen = openCourses.has(course.id);

                return (
                  <div
                    key={course.id}
                    className="mt-3 overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-600 rounded-xl dark:border-gray-700"
                  >
                    <button
                      onClick={() => toggleCourse(course.id)}
                      className="flex items-center justify-between w-full px-4 py-3 cursor-pointer"
                    >
                      <div className="flex items-center space-x-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""} text-indigo-600 dark:text-gray-200`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">
                          {course.name}
                        </span>
                      </div>
                    </button>
                    <div className="px-4 pb-3">
                      <div className="h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                        <div
                          className={`${barColor} h-full transition-all`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                      <div className="text-right">
                        <span className="text-sm text-indigo-600 dark:text-gray-200 ">
                          {pct}%
                        </span>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="p-5 space-y-4 bg-gray-100 border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                        {/* 1. เช็คว่ามีรายการย่อยในหมวดนี้หรือไม่ */}
                        {allSubsInCourse.length > 0 ? (
                          // 2. ถ้ามี ให้ map แสดงผลทุกรายการโดย "ไม่ใช้ .filter"
                          allSubsInCourse
                            .slice()
                            .sort(compareCourses)
                            .map((sc) => {
                              const doneCount =
                                statsMap[sc.id]?._count?.experiences ?? 0;
                              // เรายังคงใช้ requirementKey เพื่อดึงค่า total ที่ถูกต้องสำหรับแต่ละโหมด
                              const total = sc[requirementKey] ?? 0;
                              const subPct =
                                total === 0
                                  ? 100
                                  : Math.round(
                                      (Math.min(doneCount, total) / total) *
                                        100,
                                    );
                              const subBarColor =
                                subPct === 100
                                  ? "bg-green-400"
                                  : subPct >= 50
                                    ? "bg-yellow-400"
                                    : "bg-red-400";
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
                                      style={{ width: `${subPct}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-sm text-right text-gray-700 dark:text-gray-300">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                      {subPct}% ({doneCount}/{total})
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
                    )}
                  </div>
                );
              })}
            {/* ▲▲▲ [สิ้นสุดส่วนที่แก้ไข] ▲▲▲ */}
          </div>
        </>
      )}
    </div>
  );
}
