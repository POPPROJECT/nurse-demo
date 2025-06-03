'use client';
import React from 'react';
import { HiTrendingUp } from 'react-icons/hi';

interface LogSummaryBarProps {
  total: number;
  lastUpdate?: string;
}

export default function LogSummaryBar({
  total,
  lastUpdate,
}: LogSummaryBarProps) {
  return (
    <div className="flex items-start dark:bg-[#1E293B] gap-4 p-5 mb-6 bg-white border border-gray-200 shadow-sm rounded-xl">
      {/* Icon */}
      <div className="flex items-center justify-center w-10 h-10 bg-indigo-100 rounded-full">
        <HiTrendingUp className="w-5 h-5 text-indigo-600 " />
      </div>

      {/* Info */}
      <div>
        <div className="text-sm text-gray-700 dark:text-white">
          แสดงผลทั้งหมด{' '}
          <span className="font-bold text-indigo-600 dark:text-cyan-500">
            {total}
          </span>{' '}
          รายการ
        </div>
        <div className="text-xs text-gray-400 dark:text-gray-300">
          อัปเดตล่าสุด: {lastUpdate || '—'}
        </div>
      </div>
    </div>
  );
}
