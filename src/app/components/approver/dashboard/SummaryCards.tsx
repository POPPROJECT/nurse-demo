// components/approver/dashboard/SummaryCards.tsx
import Chart from "chart.js/auto";
import { useEffect, useRef } from "react";
import { DashboardData } from "../../../../../lib/type";

const getColor = (p: number) => {
  if (p >= 100) return "#22c55e"; // Green
  if (p >= 80) return "#3b82f6"; // Blue
  if (p >= 60) return "#8b5cf6"; // Purple
  if (p >= 40) return "#f59e0b"; // Amber
  if (p >= 20) return "#f97316"; // Orange
  return "#ef4444"; // Red
};

export default function SummaryCards({ data }: { data: DashboardData }) {
  const progress = data.overallProgress;
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    const canvas = document.getElementById(
      "overall-progress-chart",
    ) as HTMLCanvasElement;
    if (!canvas || !progress) return;

    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvas, {
      type: "doughnut",
      data: {
        datasets: [
          {
            data: [progress.percent, 100 - progress.percent],
            backgroundColor: [getColor(progress.percent), "#e5e7eb"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "80%",
        plugins: { tooltip: { enabled: false }, legend: { display: false } },
      },
    });

    return () => chartRef.current?.destroy();
  }, [progress]);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {/* Total Students */}
      <div className="flex items-center bg-white rounded-xl shadow p-5 border-l-4 border-blue-500">
        <div className="p-3 mr-4 text-blue-500 bg-blue-100 rounded-full">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            ></path>
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">จำนวนนิสิตทั้งหมด</p>
          <p className="text-3xl font-bold text-gray-800">
            {data.totalStudents}
          </p>
        </div>
      </div>

      {/* Completed Students */}
      <div className="flex items-center bg-white rounded-xl shadow p-5 border-l-4 border-green-500">
        <div className="p-3 mr-4 text-green-500 bg-green-100 rounded-full">
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <div>
          <p className="text-sm text-gray-500">จำนวนนิสิตที่บันทึกครบถ้วน</p>
          <p className="text-3xl font-bold text-gray-800">
            {data.completedStudents}
          </p>
        </div>
      </div>

      {/* Overall Progress */}
      <div className="flex items-center bg-white rounded-xl shadow p-5 border-l-4 border-purple-500">
        <div className="w-20 h-20 mr-4 relative shrink-0">
          <canvas id="overall-progress-chart"></canvas>
          <div
            className="absolute inset-0 flex items-center justify-center text-xl font-bold"
            style={{ color: getColor(progress.percent) }}
          >
            {progress.percent}%
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-500">ความคืบหน้าเฉลี่ยรวม</p>
          <p className="text-3xl font-bold text-gray-800">
            {progress.percent}%
          </p>
        </div>
      </div>
    </div>
  );
}
