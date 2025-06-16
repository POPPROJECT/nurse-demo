export default function ProgressLegend() {
  const progressLevels = [
    { color: "#22c55e", label: "100%" },
    { color: "#3b82f6", label: "80-99%" },
    { color: "#8b5cf6", label: "60-79%" },
    { color: "#f59e0b", label: "40-59%" },
    { color: "#f97316", label: "20-39%" },
    { color: "#ef4444", label: "0-19%" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-gray-600">
        <h3 className="text-base font-bold text-orange-500 mr-2 shrink-0">
          ระดับความคืบหน้า
        </h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {progressLevels.map((level) => (
            <div key={level.label} className="flex items-center">
              <span
                className="w-3 h-3 rounded-full mr-1.5"
                style={{ backgroundColor: level.color }}
              ></span>
              <span>{level.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
