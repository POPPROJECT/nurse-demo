"use client";

import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { FaCheckCircle, FaUsers } from "react-icons/fa";
import { BACKEND_URL } from "lib/constants";
import { useAuth } from "@/app/contexts/AuthContext";
import Select from "react-select";

// --- TYPE DEFINITIONS ---
type Book = {
  id: number;
  title: string;
};

type CourseOption = {
  id: number;
  name: string;
};

interface SubProgress {
  id: number;
  name: string;
  alwaycourse: number;
  doneCount: number;
  percent: number;
}

interface CourseProgress {
  id: number;
  name: string;
  totalUnits: number;
  doneUnits: number;
  percent: number;
  subProgress: SubProgress[];
}

interface DashboardData {
  totalStudents: number;
  completedStudents: number;
  overallProgress: number;
  courseProgress: CourseProgress[];
}
// --- END TYPE DEFINITIONS ---

// --- SUB-COMPONENTS ---
function FilterBar({
  books,
  selectedBook,
  setSelectedBook,
  courses,
  selectedCourse,
  setSelectedCourse,
  isCourseLoading,
}: {
  books: Book[];
  selectedBook: number | "";
  setSelectedBook: (v: number | "") => void;
  courses: CourseOption[];
  selectedCourse: number | "";
  setSelectedCourse: (v: number | "") => void;
  isCourseLoading: boolean;
}) {
  const bookOptions = books.map((b) => ({ value: b.id, label: b.title }));
  const courseOptions = courses.map((c) => ({ value: c.id, label: c.name }));

  const selectedBookOption =
    bookOptions.find((opt) => opt.value === selectedBook) || null;
  const selectedCourseOption =
    courseOptions.find((opt) => opt.value === selectedCourse) || null;

  return (
    <div className="p-4 mb-6 bg-white shadow rounded-xl dark:bg-[#1E293B]">
      <div className="flex flex-col items-center justify-center w-full gap-4 md:flex-row">
        {/* Book Select */}
        <div className="flex-1 w-full">
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
            สมุด
          </label>
          <Select
            instanceId="book-select-subject-dashboard"
            options={bookOptions}
            value={selectedBookOption}
            onChange={(opt) => setSelectedBook(opt ? opt.value : "")}
            placeholder="-- เลือกสมุด --"
            isClearable
          />
        </div>

        {/* Course Select */}
        <div className="flex-1 w-full">
          <label className="block mb-1 text-sm font-medium text-gray-700 dark:text-white">
            หมวดหมู่
          </label>
          <Select
            instanceId="course-select-subject-dashboard"
            options={courseOptions}
            value={selectedCourseOption}
            onChange={(opt) => setSelectedCourse(opt ? opt.value : "")}
            placeholder={
              isCourseLoading ? "กำลังโหลด..." : "-- เลือกหมวดหมู่ --"
            }
            isClearable
            isDisabled={!selectedBook || isCourseLoading}
          />
        </div>
      </div>
    </div>
  );
}

// function SummaryCard({ icon, label, value, colorClass }: { icon: React.ReactNode; label: string; value: string | number; colorClass: string; }) {
//     return (
//         <div className={`flex items-center bg-white dark:bg-[#1E293B] rounded-xl shadow p-4 border-l-4 ${colorClass}`}>
//             <div className={`p-3 mr-4 rounded-full ${colorClass.replace('border-', 'bg-').replace('-500', '-100')} dark:bg-opacity-30`}>
//                 {icon}
//             </div>
//             <div>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
//                 <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
//             </div>
//         </div>
//     );
// }

function ProgressDonut({
  chartId,
  percentage,
  label,
}: {
  chartId: string;
  percentage: number;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  const getColor = (p: number) => {
    if (p >= 100) return "#22c55e";
    if (p >= 80) return "#3b82f6";
    if (p >= 60) return "#8b5cf6";
    if (p >= 40) return "#f59e0b";
    if (p >= 20) return "#f97316";
    return "#ef4444";
  };

  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.destroy();
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        chartRef.current = new Chart(ctx, {
          type: "doughnut",
          data: {
            datasets: [
              {
                data: [percentage, 100 - percentage],
                backgroundColor: [getColor(percentage), "#e5e7eb"],
                borderWidth: 0,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "75%",
            plugins: {
              tooltip: { enabled: false },
              legend: { display: false },
            },
          },
        });
      }
    }
    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
      }
    };
  }, [percentage]);

  return (
    <div className="flex flex-col items-center p-4 bg-white border border-gray-200 shadow dark:bg-[#1E293B] rounded-xl dark:border-gray-700 hover:shadow-md">
      <div className="relative w-32 h-32 mb-4">
        <canvas ref={canvasRef} id={chartId}></canvas>
        <div className="absolute inset-0 flex items-center justify-center text-xl font-bold text-gray-800 dark:text-white">
          {percentage}%
        </div>
      </div>
      <h3 className="mb-1 text-base font-medium text-center text-gray-800 dark:text-white">
        {label}
      </h3>
    </div>
  );
}
// --- END SUB-COMPONENTS ---

// --- MAIN PAGE COMPONENT ---
export default function DashboardSubjectPage() {
  const { accessToken } = useAuth();

  // --- STATES ---
  const [books, setBooks] = useState<Book[]>([]);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [bookId, setBookId] = useState<number | "">("");
  const [courseId, setCourseId] = useState<number | "">("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  // --- END STATES ---

  // --- DATA FETCHING EFFECTS ---
  // 1. Load books on initial render
  useEffect(() => {
    if (!accessToken) {
      setLoadingBooks(false);
      return;
    }
    setLoadingBooks(true);
    fetch(`${BACKEND_URL}/experience-books`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load books");
        return res.json();
      })
      .then(setBooks)
      .catch((err) => setPageError(err.message))
      .finally(() => setLoadingBooks(false));
  }, [accessToken]);

  // 2. Load courses when a book is selected
  useEffect(() => {
    setCourses([]);
    setCourseId("");
    setData(null);

    if (!bookId || !accessToken) return;

    setLoadingCourses(true);
    fetch(`${BACKEND_URL}/experience-books/${bookId}/courses`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Could not load courses");
        return res.json();
      })
      .then((courses: CourseOption[]) =>
        setCourses(
          courses.sort((a, b) =>
            a.name.localeCompare(b.name, "th", { numeric: true }),
          ),
        ),
      )
      .catch((err) => setPageError(err.message))
      .finally(() => setLoadingCourses(false));
  }, [bookId, accessToken]);

  // 3. Load dashboard data when both book and course are selected
  useEffect(() => {
    if (!bookId || !courseId || !accessToken) {
      setData(null);
      return;
    }

    setLoading(true);
    setPageError(null);
    fetch(
      `${BACKEND_URL}/approver/dashboard-subject?bookId=${bookId}&courseId=${courseId}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    )
      .then((res) => {
        if (!res.ok) throw new Error("Could not load dashboard data");
        return res.json();
      })
      .then(setData)
      .catch((err) => setPageError(err.message))
      .finally(() => setLoading(false));
  }, [bookId, courseId, accessToken]);
  // --- END DATA FETCHING EFFECTS ---

  // Draw overall donut
  useEffect(() => {
    if (!data) return;
    const ctx = document.getElementById(
      "overall-progress-chart",
    ) as HTMLCanvasElement;
    new Chart(ctx, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [data.overallProgress, 100 - data.overallProgress],
            backgroundColor: [getColor(data.overallProgress), "#e5e7eb"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: { tooltip: { enabled: false } },
      },
    });
  }, [data]);

  const getColor = (p: number) => {
    if (p >= 100) return "#22c55e";
    if (p >= 80) return "#3b82f6";
    if (p >= 60) return "#8b5cf6";
    if (p >= 40) return "#f59e0b";
    if (p >= 20) return "#f97316";
    return "#ef4444";
  };

  // --- RENDER LOGIC ---
  if (loadingBooks)
    return <div className="p-10 text-center">Loading Books...</div>;
  if (pageError)
    return (
      <div className="p-10 text-center text-red-500">Error: {pageError}</div>
    );

  const selectedCourseName =
    courses.find((c) => c.id === courseId)?.name || "รายวิชา";

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      {/* Header */}
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md">
        <h1 className="text-xl font-semibold sm:text-2xl">
          ภาพรวมความคืบหน้ารายวิชา
        </h1>
      </div>

      {/* Filter Bar */}
      <FilterBar
        books={books}
        selectedBook={bookId}
        setSelectedBook={setBookId}
        courses={courses}
        selectedCourse={courseId}
        setSelectedCourse={setCourseId}
        isCourseLoading={loadingCourses}
      />

      {/* Conditional Content */}
      {loading && (
        <p className="py-10 text-center text-gray-500">กำลังโหลดข้อมูล...</p>
      )}

      {!loading && (!bookId || !courseId) && (
        <p className="py-10 text-center text-gray-500">
          กรุณาเลือกสมุดและรายวิชาเพื่อแสดงข้อมูล
        </p>
      )}

      {data && !loading && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Students */}
            <div className="flex items-center bg-white dark:bg-[#1E293B] rounded-xl shadow p-4 border-l-4 border-blue-500">
              <div className="p-3 mr-4 bg-blue-100 rounded-full dark:bg-blue-900/30">
                <FaUsers className="w-6 h-6 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  จำนวนนิสิตทั้งหมด
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {data.totalStudents}
                </p>
              </div>
            </div>

            {/* Completed Students */}
            <div className="flex items-center bg-white dark:bg-[#1E293B] rounded-xl shadow p-4 border-l-4 border-green-500">
              <div className="p-3 mr-4 bg-green-100 rounded-full dark:bg-green-900/30">
                <FaCheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  จำนวนนิสิตที่ทำครบถ้วน
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {data.completedStudents}
                </p>
              </div>
            </div>

            {/* Overall Progress */}
            <div className="flex items-center bg-white dark:bg-[#1E293B] rounded-xl shadow p-4 border-l-4 border-purple-500">
              <div className="w-20 h-20 mr-4 radial-chart">
                <canvas id="overall-progress-chart" />
                <div className="text-purple-700 percentage dark:text-purple-400">
                  {data.overallProgress}%
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  ความคืบหน้าเฉลี่ยรวม
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white">
                  {data.overallProgress}%
                </p>
              </div>
            </div>
          </div>

          {/* <div className="grid grid-cols-1 gap-6 mb-8 sm:grid-cols-2 lg:grid-cols-3">
            <SummaryCard
              icon={<FaUsers className="w-6 h-6 text-blue-500 dark:text-blue-400" />}
              label="จำนวนนิสิตทั้งหมด"
              value={data.totalStudents}
              colorClass="border-blue-500"
            />
            <SummaryCard
              icon={<FaCheckCircle className="w-6 h-6 text-green-500 dark:text-green-400" />}
              label={`จำนวนนิสิตที่ทำครบถ้วน`}
              value={data.completedStudents}
              colorClass="border-green-500"
            />
            <SummaryCard
              icon={<FaChartBar className="w-6 h-6 text-purple-500 dark:text-purple-400" />}
              label={`ความคืบหน้าเฉลี่ยรวม`}
              value={`${data.overallProgress}%`}
              colorClass="border-purple-500"
            />
          </div> */}

          {/* Color Legend */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow p-4 mb-6">
            <h3 className="text-sm font-medium text-[#f46b45] dark:text-gray-300 mb-2">
              ระดับความคืบหน้า
            </h3>
            <div className="flex flex-wrap gap-4">
              {[
                ["100%", "#22c55e"],
                ["80-99%", "#3b82f6"],
                ["60-79%", "#8b5cf6"],
                ["40-59%", "#f59e0b"],
                ["20-39%", "#f97316"],
                ["0-19%", "#ef4444"],
              ].map(([label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Details Section */}
          <div className="p-4 mb-8 bg-white shadow-md dark:bg-[#1E293B] rounded-xl md:p-6">
            <h2 className="mb-4 text-lg font-bold text-[#f46b45] md:text-xl md:mb-6">
              {/* ความคืบหน้า {selectedCourseName} */}
              ความคืบหน้าแยกตามหมวดหมู่
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data.courseProgress[0]?.subProgress.map((sub) => (
                <ProgressDonut
                  key={sub.id}
                  chartId={`chart-subcourse-${sub.id}`}
                  percentage={sub.percent}
                  label={sub.name}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
