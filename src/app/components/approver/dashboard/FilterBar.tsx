// components/approver/dashboard/FilterBar.tsx
import Select from "react-select";
import { Book } from "../../../../../lib/type";

type ViewMode = "OVERALL" | "BY_SUBJECT";

interface FilterBarProps {
  books: Book[];
  bookId: number | "";
  setBookId: (id: number | "") => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  onRefresh: () => void;
}

export default function FilterBar({
  books,
  bookId,
  setBookId,
  viewMode,
  setViewMode,
  onRefresh,
}: FilterBarProps) {
  const bookOptions = books.map((b) => ({ value: b.id, label: b.title }));

  const viewOptions = [
    { value: "OVERALL", label: "ตลอดหลักสูตร" },
    { value: "BY_SUBJECT", label: "ในวิชา" },
  ];

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center flex-grow">
          <label className="block font-medium text-gray-700 mr-3 shrink-0">
            สมุด
          </label>
          <Select
            instanceId="book-select"
            className="w-full text-sm"
            options={bookOptions}
            value={bookOptions.find((o) => o.value === bookId) || null}
            onChange={(opt) => setBookId(opt ? opt.value : "")}
            placeholder="-- เลือกสมุดบันทึก --"
            isClearable
          />
        </div>
        <div className="flex items-center flex-grow">
          <label className="block font-medium text-gray-700 mr-3 shrink-0">
            ความคืบหน้า
          </label>
          <Select
            instanceId="view-mode-select"
            className="w-full text-sm"
            options={viewOptions}
            value={viewOptions.find((o) => o.value === viewMode)}
            onChange={(opt) => setViewMode(opt!.value as ViewMode)}
          />
        </div>

        <div className="md:ml-auto">
          <button
            onClick={onRefresh}
            disabled={!bookId}
            className="flex w-full md:w-auto items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            รีเฟรช
          </button>
        </div>
      </div>
    </div>
  );
}
