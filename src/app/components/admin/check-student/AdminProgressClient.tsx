"use client";
import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import Select from "react-select"; // ✅ 1. เพิ่มการ import

// ✅ 2. ปรับปรุง Type ให้รองรับ progressMode
type Book = { id: number; title: string };
type Course = { id: number; name: string };
type SubCourse = {
  id: number;
  name: string;
  alwaycourse: number | null;
  inSubjectCount: number | null;
};
type Stat = {
  id: number;
  _count?: { experiences: number };
};

interface AdminProgressClientProps {
  accessToken: string;
  studentId: number;
}

export default function AdminProgressClient({
  accessToken,
  studentId,
}: AdminProgressClientProps) {
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBook, setSelectedBook] = useState<number | "">("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [subcoursesByCourse, setSubcoursesByCourse] = useState<
    Record<number, SubCourse[]>
  >({});
  const [statsMap, setStatsMap] = useState<Record<number, Stat>>({});
  const [openCourses, setOpenCourses] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  // ✅ 3. เพิ่ม State สำหรับ 'Progress Mode'
  const [progressMode, setProgressMode] = useState<"all" | "subject">("all");

  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const authHeader = useMemo(
    () => ({ headers: { Authorization: `Bearer ${accessToken}` } }),
    [accessToken],
  );

  // โหลดสมุด (เหมือนเดิม)
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

  // เมื่อเลือกสมุดให้โหลดข้อมูลทั้งหมด
  useEffect(() => {
    if (!selectedBook || !authHeader) return;

    const load = async () => {
      try {
        setLoading(true);
        // รีเซ็ต state เมื่อเลือกสมุดใหม่
        setCourses([]);
        setSubcoursesByCourse({});
        setStatsMap({});
        setOpenCourses(new Set());
        setProgressMode("all");

        // ดึงคอร์สและสถิติพร้อมกัน
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

        // ✅ 4. แก้ไขการเรียงลำดับ (Natural Sort)
        const sortedCourses = coursesRes.data.sort((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true }),
        );
        setCourses(sortedCourses);

        const newStatsMap: Record<number, Stat> = {};
        statsRes.data.forEach((s) => (newStatsMap[s.id] = s));
        setStatsMap(newStatsMap);

        // ดึง subcourses ของแต่ละคอร์ส
        const subcoursePromises = sortedCourses.map((c) =>
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
        Swal.fire("Error", "โหลดข้อมูลไม่สำเร็จ", "error");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [selectedBook, authHeader, studentId, BASE]);

  // --- Calculations ---
  // ✅ 5. ปรับปรุงการคำนวณให้รองรับ progressMode
  const overall = useMemo(() => {
    let done = 0,
      total = 0;
    Object.values(subcoursesByCourse)
      .flat()
      .forEach((sc) => {
        const required =
          progressMode === "subject" ? sc.inSubjectCount : sc.alwaycourse;
        if (required != null && required > 0) {
          const rawDone = statsMap[sc.id]?._count?.experiences ?? 0;
          done += Math.min(rawDone, required);
          total += required;
        }
      });
    const pct = total > 0 ? Math.round((done / total) * 100) : 100; // แก้ไข: ถ้า total เป็น 0 ให้เป็น 100%
    return { done, total, pct };
  }, [subcoursesByCourse, statsMap, progressMode]);

  // --- Render Logic ---
  const toggleCourse = (id: number) => {
    setOpenCourses((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getBarColor = (pct: number) => {
    if (pct >= 100) return "bg-green-500";
    if (pct >= 50) return "bg-yellow-400";
    return "bg-red-500";
  };

  const progressModeOptions = [
    { value: "all", label: "ตลอดหลักสูตร" },
    { value: "subject", label: "ในวิชา" },
  ];
  const selectedProgressModeOption =
    progressModeOptions.find((opt) => opt.value === progressMode) || null;

  // --- JSX Return ---
  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto space-y-6">
      {/* ✅ 6. อัปเกรด UI ด้วย react-select และเพิ่ม Progress Mode */}
      <div className="p-4 mb-6 bg-white shadow-md rounded-xl dark:bg-[#1E293B]">
        <div className="flex flex-col items-center gap-4 md:flex-row">
          <div className="flex-1 w-full">
            <label className="block mb-1 text-sm font-medium text-gray-800 dark:text-white">
              สมุด
            </label>
            <Select
              instanceId="book-select-admin"
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
              instanceId="progress-mode-select-admin"
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

      {selectedBook && !loading && (
        <>
          {/* Overall Progress */}
          <div className="p-6 bg-white border border-gray-200 shadow-md dark:bg-gray-800 rounded-xl dark:border-gray-700">
            <h2 className="mb-4 text-xl font-semibold text-[#f46b45]">
              ความคืบหน้า
              {progressMode === "subject" ? "ในวิชา" : "ตลอดหลักสูตร"}
            </h2>
            <div className="w-full">
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium text-gray-800 dark:text-gray-300">
                  ความสำเร็จ
                </span>
                <span className="text-sm font-medium text-indigo-500">
                  {overall.pct}% ({overall.done}/{overall.total})
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-indigo-600 h-2.5 rounded-full transition-all"
                  style={{ width: `${overall.pct}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Course List */}
          <div className="p-6 bg-white shadow-md rounded-xl dark:bg-[#1E293B]">
            {/* ... Loading/Empty states ... */}
            <div className="space-y-4">
              {courses.map((course) => {
                const subs = subcoursesByCourse[course.id] || [];
                if (subs.length === 0) return null;

                const totals = subs.reduce(
                  (acc, sc) => {
                    const required =
                      progressMode === "subject"
                        ? sc.inSubjectCount
                        : sc.alwaycourse;
                    if (required != null && required > 0) {
                      const doneCount =
                        statsMap[sc.id]?._count?.experiences ?? 0;
                      acc.done += Math.min(doneCount, required);
                      acc.total += required;
                    }
                    return acc;
                  },
                  { done: 0, total: 0 },
                );

                // ✅ 7. แก้ไขการคำนวณเปอร์เซ็นต์ของ Course
                const pct =
                  totals.total > 0
                    ? Math.round((totals.done / totals.total) * 100)
                    : 100;

                const barColor = getBarColor(pct);
                const isOpen = openCourses.has(course.id);

                return (
                  <div
                    key={course.id}
                    className="mt-3 overflow-hidden bg-white border border-gray-200 shadow-sm dark:bg-gray-600 rounded-xl dark:border-gray-700"
                  >
                    {/* ... Course Toggle and Bar ... */}
                    <div
                      className="cursor-pointer px-5 py-4"
                      onClick={() => toggleCourse(course.id)}
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                          {course.name}
                        </h3>
                        <svg
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
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-end mb-1">
                          <span className="text-sm font-medium text-indigo-600 dark:text-gray-200">
                            {pct}%
                          </span>
                        </div>
                        <div className="h-2 overflow-hidden bg-gray-200 rounded-full dark:bg-gray-700">
                          <div
                            className={`h-full ${barColor} transition-all`}
                            style={{ width: `${pct}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div className="p-5 space-y-4 bg-gray-100 border-t border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                        {subs.map((sc) => {
                          const required =
                            progressMode === "subject"
                              ? sc.inSubjectCount
                              : sc.alwaycourse;
                          const doneCount =
                            statsMap[sc.id]?._count?.experiences ?? 0;

                          // ✅ 8. แก้ไขการคำนวณเปอร์เซ็นต์ของ Sub-course
                          const subPct =
                            required != null && required > 0
                              ? Math.min(
                                  100,
                                  Math.round((doneCount / required) * 100),
                                )
                              : 100;

                          const subBarColor = getBarColor(subPct);
                          return (
                            <div
                              key={sc.id}
                              className="p-4 bg-white rounded-lg shadow dark:bg-gray-800"
                            >
                              <span className="text-gray-800 dark:text-gray-200">
                                {sc.name}
                              </span>
                              <div className="flex items-center justify-between mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`${subBarColor} h-2`}
                                    style={{ width: `${subPct}%` }}
                                  ></div>
                                </div>
                                <div className="text-sm text-right text-gray-700 dark:text-gray-300 min-w-[80px]">
                                  <span>
                                    {subPct}% ({doneCount}/{required ?? "N/A"})
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
