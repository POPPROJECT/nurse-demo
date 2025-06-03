'use client';
import React from 'react';
import { FaSort, FaSortUp, FaSortDown, FaPlus } from 'react-icons/fa';
import { GrFormView, GrView } from 'react-icons/gr';

type Student = {
  id: number;
  studentId: string;
  name: string;
  done: number;
  total: number;
  percent: number;
};

type Props = {
  data: Student[];
  sortBy: 'studentId' | 'name' | 'percent';
  order: 'asc' | 'desc';
  onSort: (col: 'studentId' | 'name' | 'percent') => void;
};

const HEADERS: { key: Props['sortBy']; label: string }[] = [
  { key: 'studentId', label: 'รหัสนิสิต' },
  { key: 'name', label: 'ชื่อ-นามสกุล' },
  { key: 'percent', label: 'ความคืบหน้า' },
];

export default function StudentTable({ data, sortBy, order, onSort }: Props) {
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="min-w-full bg-white shadow dark:bg-gray-500 whitespace-nowrap">
        <thead className="bg-gray-300 dark:bg-gray-800">
          <tr>
            {HEADERS.map((h) => (
              <th
                key={h.key}
                onClick={() => onSort(h.key)}
                className="px-6 py-3 text-base font-medium text-left text-gray-800 uppercase cursor-pointer select-none dark:text-gray-200"
              >
                <div className="inline-flex items-center space-x-1">
                  <span>
                    <strong>{h.label}</strong>
                  </span>
                  <span className="p-1 transition-colors rounded-full group-hover:bg-indigo-100">
                    {sortBy !== h.key && (
                      <FaSort className="text-gray-400 dark:text-gray-500" />
                    )}
                    {sortBy === h.key && order === 'asc' && (
                      <FaSortUp className="text-indigo-600" />
                    )}
                    {sortBy === h.key && order === 'desc' && (
                      <FaSortDown className="text-indigo-600" />
                    )}
                  </span>
                </div>
              </th>
            ))}
            <th className="px-6 py-3 text-sm font-semibold text-center text-gray-800 dark:text-gray-200">
              จัดการ
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.length > 0 ? (
            data.map((s) => (
              <tr
                key={s.id}
                className="even:bg-gray-200 dark:even:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <td className="px-6 py-4 text-gray-800 whitespace-nowrap dark:text-gray-200">
                  {s.studentId}
                </td>
                <td className="px-6 py-4 text-gray-800 whitespace-nowrap dark:text-gray-200">
                  {s.name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 h-2 overflow-hidden bg-gray-400 rounded dark:bg-gray-300">
                      <div
                        className="h-2 transition-all bg-indigo-600"
                        style={{ width: `${s.percent}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-800 dark:text-gray-200 whitespace-nowrap">
                      {s.percent}%
                    </span>
                  </div>
                </td>
                <td className="flex justify-center px-6 py-4 text-center">
                  {/* ปุ่มเพิ่มประสบการณ์ */}
                  <button
                    className="
                      px-3 py-1 text-sm font-medium rounded-lg transition-colors duration-200
                      flex items-center justify-center space-x-1.5
                    bg-blue-500 text-white
                    hover:bg-blue-600
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50
                    dark:bg-blue-700 dark:hover:bg-blue-600 dark:focus:ring-blue-700
                    "
                    onClick={() => {
                      const nameParam = encodeURIComponent(s.name);

                      // เปลี่ยนจาก s.id เป็น s.studentId
                      window.location.href = `/experience-manager/CountsExperience/${encodeURIComponent(
                        s.studentId
                      )}?name=${nameParam}`;
                    }}
                  >
                    <FaPlus className="w-3 h-3" />
                    <span>เพิ่มประสบการณ์</span>
                  </button>

                  {/* ปุ่มดูประวัติ */}
                  <button
                    className="
                      px-3 py-1 ml-3 text-sm font-medium rounded-lg transition-colors duration-200
                      flex items-center justify-center space-x-1.5
                    bg-gray-500 text-white hover:bg-gray-600
                      focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50
                    dark:bg-gray-600 dark:hover:bg-gray-500 dark:focus:ring-gray-600
                    "
                    onClick={() => {
                      const nameParam = encodeURIComponent(s.name);
                      window.location.href = `/experience-manager/CountsExperience/history/${encodeURIComponent(
                        s.studentId
                      )}?name=${nameParam}`;
                    }}
                  >
                    <GrView className="w-3 h-3" />
                    <span>ดูประวัติ</span>
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={4}
                className="py-8 text-center text-gray-500 dark:text-white"
              >
                ไม่มีข้อมูลนิสิต
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
