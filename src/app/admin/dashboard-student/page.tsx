"use client";
import { useEffect, useState } from "react";
import Chart from "chart.js/auto";
import { FaCheckCircle, FaUsers } from "react-icons/fa";
import { BACKEND_URL } from "lib/constants";
import { useAuth } from "@/app/contexts/AuthContext";

type Book = { id: number; title: string };

interface CourseProgress {
  id: number;
  name: string;
  doneCount: number;
  studentCount: number;
  percent: number;
}

interface DashboardData {
  totalStudents: number;
  completedStudents: number;
  overallProgress: number;
  courseProgress: CourseProgress[];
}

function FilterBar({
  books,
  selectedBook,
  setSelectedBook,
}: {
  books: Book[];
  selectedBook: number | "";
  setSelectedBook: (v: number | "") => void;
}) {
  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow p-4 mb-6 flex items-center">
        <label className="block mb-1 font-medium dark:text-white">สมุด</label>
        <select
          className="block w-full px-3 py-2 ml-2 transition-colors duration-300 bg-gray-100 border border-gray-300 rounded-lg shadow-sm lg:w-1/3 dark:border-gray-700 dark:text-gray-800"
          value={selectedBook}
          onChange={(e) =>
            setSelectedBook(e.target.value ? +e.target.value : "")
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
    </div>
  );
}

export default function Page() {
  const { accessToken, session: authUser } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [bookId, setBookId] = useState<number | "">("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);

  // Load books
  useEffect(() => {
    if (!accessToken) {
      // ✅ รอให้ accessToken พร้อมใช้งานก่อน
      if (authUser === null) {
        // ถ้า AuthProvider โหลดเสร็จแล้วแต่ไม่มี user/token
        setPageError("Session not available. Please login again.");
      }
      setLoadingBooks(false);
      return;
    }
    setLoadingBooks(true);
    setPageError(null);
    fetch(`${BACKEND_URL}/experience-books`, {
      headers: {
        // ✅ ใช้ Authorization header
        Authorization: `Bearer ${accessToken}`,
      },
      // credentials: 'include', // ไม่จำเป็นแล้ว
    })
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch books: ${r.status}`);
        return r.json();
      })
      .then((list: Book[]) => {
        setBooks(list);
      })
      .catch((err) => {
        console.error("Error loading books:", err);
        setBooks([]);
        setPageError(err.message || "Could not load books.");
      })
      .finally(() => setLoadingBooks(false));
  }, [accessToken, authUser]);

  // Load dashboard data
  useEffect(() => {
    if (bookId === "" || !accessToken) {
      // ✅ รอให้ accessToken พร้อมใช้งานก่อน
      setData(null);
      return;
    }
    setLoading(true);
    setPageError(null);
    fetch(`${BACKEND_URL}/approver/dashboard?bookId=${bookId}`, {
      headers: {
        // ✅ ใช้ Authorization header
        Authorization: `Bearer ${accessToken}`,
      },
      // credentials: 'include', // ไม่จำเป็นแล้ว
    })
      .then((r) => {
        if (!r.ok)
          throw new Error(`Failed to fetch dashboard data: ${r.status}`);
        return r.json();
      })
      .then((d: DashboardData) => setData(d))
      .catch((err) => {
        console.error("Error loading dashboard data:", err);
        setData(null);
        setPageError(err.message || "Could not load dashboard data.");
        // Swal.fire('ผิดพลาด', 'โหลดข้อมูล Dashboard ไม่สำเร็จ', 'error');
      })
      .finally(() => setLoading(false));
  }, [bookId, accessToken]);

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

  // Draw per-course donuts
  useEffect(() => {
    if (!data) return;
    data.courseProgress.forEach((c) => {
      const canvas = document.getElementById(
        `chart-course-${c.id}`,
      ) as HTMLCanvasElement;
      if (!canvas) return;
      new Chart(canvas, {
        type: "doughnut",
        data: {
          datasets: [
            {
              data: [c.percent, 100 - c.percent],
              backgroundColor: [getColor(c.percent), "#e5e7eb"],
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

  if (loadingBooks)
    return <div className="p-10 text-center">Loading available books...</div>;
  if (pageError)
    return (
      <div className="p-10 text-center text-red-500">Error: {pageError}</div>
    );
  // ถ้ายังไม่มี user จาก context (อาจจะกำลังโหลดจาก AuthProvider)
  if (!authUser && typeof accessToken !== "string")
    return <div className="p-10 text-center">Initializing session...</div>;
  // ถ้า AuthProvider บอกว่าไม่มี session จริงๆ (AdminLayout ควรจะ redirect ไปแล้ว)
  if (!authUser && accessToken === null) {
    return (
      <div className="p-10 text-center text-red-500">
        Session not found. Please{" "}
        <a href="/" className="underline">
          login
        </a>
        .
      </div>
    );
  }

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      {/* Header */}
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">
          ภาพรวมความคืบหน้าตลอดหลักสูตร
        </h1>
      </div>

      {/* Filter */}
      <FilterBar
        books={books}
        selectedBook={bookId}
        setSelectedBook={setBookId}
      />

      {/* Loading/Prompt */}
      {loading && (
        <p className="text-center text-gray-600 dark:text-gray-300">
          กำลังโหลดข้อมูล...
        </p>
      )}
      {!loading && bookId === "" && (
        <p className="text-center text-gray-600 dark:text-gray-300">
          กรุณาเลือกสมุดเพื่อแสดงข้อมูล
        </p>
      )}

      {/* Dashboard */}
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

          {/* Course Progress */}
          <div className="bg-white dark:bg-[#1E293B] rounded-xl shadow-md p-4 md:p-6 mb-8">
            <h2 className="text-lg md:text-xl font-bold text-[#f46b45]  mb-4 md:mb-6">
              ความคืบหน้าแยกตามหมวดหมู่
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {data.courseProgress.map((c) => (
                <div
                  key={c.id}
                  className="bg-white dark:bg-[#1E293B] rounded-xl shadow p-4 flex flex-col items-center border border-gray-200 dark:border-gray-700 hover:shadow-md"
                >
                  <div className="w-32 h-32 mb-4 radial-chart">
                    <canvas id={`chart-course-${c.id}`} />
                    <div className="text-gray-800 percentage dark:text-white">
                      {c.percent}%
                    </div>
                  </div>
                  <h3 className="mb-1 text-lg font-medium text-center text-gray-800 dark:text-white">
                    {c.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
