import React from 'react';

interface Props {
  disabled?: boolean;
  onImport: () => void;
}

export default function ActionButtons({ disabled, onImport }: Props) {
  return (
    <div className="flex items-center justify-between mt-6">
      <button
        onClick={onImport}
        disabled={disabled}
        className={`px-6 py-3 text-white text-lg font-medium rounded-lg shadow-md flex items-center transition-colors ${
          disabled
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-green-600 hover:bg-green-700'
        }`}
      >
        ✅ นำเข้ารายการทั้งหมด
      </button>
    </div>
  );
}
