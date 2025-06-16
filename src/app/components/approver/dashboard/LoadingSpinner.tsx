export default function LoadingSpinner() {
  return (
    <div className="flex flex-col items-center justify-center py-10">
      <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
    </div>
  );
}
