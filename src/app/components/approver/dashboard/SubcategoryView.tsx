// components/approver/dashboard/SubcategoryView.tsx
import { CourseProgress } from "../../../../../lib/type";

const getBarColor = (p: number) => {
  if (p >= 100) return "#22c55e";
  if (p >= 80) return "#3b82f6";
  if (p >= 60) return "#8b5cf6";
  if (p >= 40) return "#f59e0b";
  if (p >= 20) return "#f97316";
  return "#ef4444";
};

export default function SubcategoryView({
  course,
  onBack,
  onViewStudents,
}: {
  course: CourseProgress;
  onBack: () => void;
  onViewStudents: (id: number, title: string) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
        <h2 className="text-xl font-bold text-gray-800">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-orange-500 transition-colors"
          >
            {course.name}
          </button>
          <span className="text-gray-400 mx-2">&gt;</span>
          <span>หมวดหมู่ย่อย</span>
        </h2>
        <button
          onClick={onBack}
          className="flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm"
        >
          &larr; กลับไปหน้าหมวดหมู่
        </button>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {course.subcategories
          .slice() // สร้าง copy ของ array เพื่อไม่ให้กระทบ props เดิม
          .sort((a, b) => {
            // ฟังก์ชันสำหรับดึงตัวเลขเวอร์ชัน เช่น "1.2 ชื่อ" จะได้ [1, 2]
            const parseVersion = (name: string): number[] => {
              const match = name.match(/^[\d.]+/);
              if (!match) return [Infinity, Infinity]; // ถ้าไม่มีตัวเลข ให้ไปอยู่ท้ายสุด

              const parts = match[0]
                .split(".")
                .map((num) => parseInt(num, 10) || 0);
              return [parts[0] || 0, parts[1] || 0];
            };

            const [aMajor, aMinor] = parseVersion(a.name);
            const [bMajor, bMinor] = parseVersion(b.name);

            // เปรียบเทียบเลขตัวหน้าก่อน
            if (aMajor !== bMajor) {
              return aMajor - bMajor;
            }

            // ถ้าเลขตัวหน้าเท่ากัน ให้เปรียบเทียบเลขตัวหลัง
            return aMinor - bMinor;
          })
          .map((sub) => {
            const color = getBarColor(sub.percent);
            return (
              <div
                key={sub.id}
                className="bg-gray-50 rounded-lg shadow p-4 border border-gray-100"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-800 flex-1">
                    {sub.name}
                  </h4>
                  <span
                    className="font-bold text-lg shrink-0 ml-2"
                    style={{ color }}
                  >
                    {sub.percent}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-3">
                  <div
                    className="h-2.5 rounded-full"
                    style={{ width: `${sub.percent}%`, backgroundColor: color }}
                  ></div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {sub.doneStudentCount}/{sub.studentCount} นิสิต
                  </span>
                  <button
                    onClick={() => onViewStudents(sub.id, sub.name)}
                    className="px-3 py-1.5 text-white rounded-lg text-xs hover:opacity-90 transition-opacity"
                    style={{ backgroundColor: "#f46b45" }}
                  >
                    รายชื่อนิสิต
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
