export default function ErrorDisplay({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-md p-8 text-center">
      {/* Error Icon SVG */}
      <p className="text-red-500 font-medium mb-4">{message}</p>
      <button
        onClick={onRetry}
        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
      >
        ลองอีกครั้ง
      </button>
    </div>
  );
}
