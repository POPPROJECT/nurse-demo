import React from 'react';

interface Props {
  total: number;
  valid: number;
  invalid: number;
  userType: string;
  onSearch: (val: string) => void;
  onConfirm: () => void;
  isValid: boolean;
  onFilterChange: (val: 'all' | 'valid' | 'invalid') => void;
}

export default function SummarySection({
  total,
  valid,
  invalid,
  userType,
  onSearch,
  onConfirm,
  isValid,
  onFilterChange,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <InfoCard label="จำนวนรายการทั้งหมด" value={total} color="blue" />
        <InfoCard label="รายการที่ถูกต้อง" value={valid} color="green" />
        <InfoCard label="รายการที่ไม่ถูกต้อง" value={invalid} color="red" />
        <InfoCard label="ประเภทผู้ใช้" value={userType} color="purple" isText />
      </div>

      <div className="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block w-3 h-3 bg-red-500 rounded-full" />
            <span>= ข้อมูลไม่ถูกต้อง</span>
          </span>
          <span className="inline-flex items-center gap-1 ml-4">
            <span className="inline-block w-3 h-3 bg-green-500 rounded-full" />
            <span>= ข้อมูลถูกต้อง</span>
          </span>
        </div>

        <div className="flex flex-col w-full gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-4 sm:w-auto">
          <input
            type="text"
            onChange={(e) => onSearch(e.target.value)}
            placeholder="🔍 ค้นหา..."
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg sm:w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            onChange={(e) =>
              onFilterChange(e.target.value as 'all' | 'valid' | 'invalid')
            }
          >
            <option value="all">ทั้งหมด</option>
            <option value="valid">ถูกต้อง</option>
            <option value="invalid">ไม่ถูกต้อง</option>
          </select>
          <button
            onClick={onConfirm}
            disabled={!isValid}
            className={`px-4 py-2 text-sm rounded-lg font-medium ${
              isValid
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            ✅ นำเข้ารายการทั้งหมด
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  label,
  value,
  color,
  isText = false,
}: {
  label: string;
  value: number | string;
  color: string;
  isText?: boolean;
}) {
  return (
    <div className="p-4 bg-white shadow-sm rounded-xl">
      <p className="text-sm text-gray-500">{label}</p>
      <h3
        className={`mt-1 text-2xl font-bold ${
          isText ? `text-${color}-700` : `text-${color}-600`
        }`}
      >
        {value}
      </h3>
    </div>
  );
}
