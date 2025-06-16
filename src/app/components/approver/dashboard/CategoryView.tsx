// components/approver/dashboard/CategoryView.tsx
import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import { CourseProgress } from "../../../../../lib/type";

const getColor = (p: number) => {
  if (p >= 100) return "#22c55e"; // Green
  if (p >= 80) return "#3b82f6"; // Blue
  if (p >= 60) return "#8b5cf6"; // Purple
  if (p >= 40) return "#f59e0b"; // Amber
  if (p >= 20) return "#f97316"; // Orange
  return "#ef4444"; // Red
};

function CategoryCard({
  course,
  onSelect,
  onViewStudents,
}: {
  course: CourseProgress;
  onSelect: () => void;
  onViewStudents: () => void;
}) {
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = document.getElementById(
      `chart-course-${course.id}`,
    ) as HTMLCanvasElement;
    if (!canvas) return;

    if (chartRef.current) chartRef.current.destroy();

    chartRef.current = new Chart(canvas, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [course.percent, 100 - course.percent],
            backgroundColor: [getColor(course.percent), "#e5e7eb"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "75%",
        plugins: { tooltip: { enabled: false }, legend: { display: false } },
      },
    });

    return () => chartRef.current?.destroy();
  }, [course]);

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col items-center border border-gray-100 transition-all duration-300 hover:shadow-lg hover:scale-105">
      <div className="w-32 h-32 mb-4 relative">
        <canvas id={`chart-course-${course.id}`}></canvas>
        <div
          className="absolute inset-0 flex items-center justify-center text-2xl font-bold"
          style={{ color: getColor(course.percent) }}
        >
          {course.percent}%
        </div>
      </div>
      <h3 className="mb-2 text-base font-medium text-center text-gray-800 h-12 flex items-center">
        {course.name}
      </h3>
      <p className="text-sm text-gray-500 text-center mb-4">
        {course.doneStudentCount}/{course.studentCount} นิสิต
      </p>
      <div className="mt-auto w-full flex space-x-2">
        <button
          onClick={onSelect}
          className="w-full px-3 py-2 text-white rounded-lg text-sm transition-colors"
          style={{ backgroundColor: "#f46b45" }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "#e45d3a")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "#f46b45")
          }
        >
          หมวดหมู่ย่อย
        </button>

        <button
          onClick={onViewStudents}
          className="w-full px-3 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors"
        >
          รายชื่อนิสิต
        </button>
      </div>
    </div>
  );
}

export default function CategoryView({
  courseProgress,
  onSelectCourse,
  onViewStudents,
}: {
  courseProgress: CourseProgress[];
  onSelectCourse: (course: CourseProgress) => void;
  onViewStudents: (id: number, title: string) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const filteredCourses = courseProgress.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
        <h2 className="text-xl font-bold text-orange-500">
          ความคืบหน้าแยกตามหมวดหมู่
        </h2>
        <div className="relative w-full sm:w-64">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาหมวดหมู่..."
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-400 focus:border-orange-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {filteredCourses.map((course) => (
          <CategoryCard
            key={course.id}
            course={course}
            onSelect={() => onSelectCourse(course)}
            onViewStudents={() => onViewStudents(course.id, course.name)}
          />
        ))}
      </div>
      {filteredCourses.length === 0 && (
        <div className="col-span-full text-center py-10 text-gray-500">
          <p>ไม่พบหมวดหมู่ที่ตรงกับการค้นหา</p>
        </div>
      )}
    </div>
  );
}
