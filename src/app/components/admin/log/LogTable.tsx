'use client';
import React from 'react';

const actionMap = {
  create: 'สร้าง',
  update: 'อัปเดต',
  delete: 'ลบ',
  import: 'อัปโหลด'
};

const badgeClass = {
  create: 'bg-green-100 text-green-600 before:bg-green-500',
  update: 'bg-blue-100 text-blue-600 before:bg-blue-500',
  delete: 'bg-red-100 text-red-600 before:bg-red-500',
  import: 'bg-green-100 text-green-600 before:bg-green-500',
};

type LogAction = 'create' | 'update' | 'delete' | 'import';

interface AdminLog {
  id: number;
  action: LogAction;
  entity: string;
  description: string;
  createdAt: string;
}

export default function LogTable({ data }: { data: AdminLog[] }) {
  return (
    <div className="mb-6 overflow-hidden bg-white dark:bg-[#1E293B] border border-gray-200 shadow-sm rounded-xl">
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto">
          <thead className="text-sm text-white bg-gradient-to-r from-indigo-600 to-indigo-500 dark:from-cyan-600 dark:to-cyan-500">
            <tr>
              <th className="px-6 py-3 font-medium text-left">การกระทำ</th>
              <th className="px-6 py-3 font-medium text-left">เป้าหมาย</th>
              <th className="px-6 py-3 font-medium text-left">รายละเอียด</th>
              <th className="px-6 py-3 font-medium text-left">เวลาที่กระทำ</th>
            </tr>
          </thead>
          <tbody>
            {data.map((log) => (
              <tr
                key={log.id}
                className="transition border-b hover:bg-indigo-50 last:border-none dark:hover:bg-gray-500"
              >
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                      badgeClass[log.action]
                    } before:content-[''] before:w-2 before:h-2 before:rounded-full`}
                  >
                    {actionMap[log.action]}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className="inline-block px-3 py-1 text-sm dark:bg-[#1E293B] dark:text-white font-medium bg-white border border-gray-300 rounded">
                    {log.entity === 'ExperienceBook'
                      ? 'เล่มบันทึก'
                      : log.entity === 'User'
                      ? 'ผู้ใช้'
                      : log.entity === 'FieldConfig'
                      ? 'รายละเอียดเล่ม'
                      : log.entity}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-800 dark:text-white">
                  {log.description}
                </td>
                <td className="flex items-center px-6 py-4 text-sm text-gray-600 dark:text-white">
                  <span className="w-2 h-2 mr-2 bg-gray-300 rounded-full dark:text-white" />
                  {new Date(log.createdAt).toLocaleString('th-TH', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* กรณีไม่มีข้อมูล */}
      {data.length === 0 && (
        <div className="p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 bg-indigo-100 rounded-full">
            <svg
              className="w-8 h-8 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">ไม่พบข้อมูล</h3>
          <p className="mt-1 text-gray-500">
            ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหาของคุณ
          </p>
          <button className="px-4 py-2 mt-4 text-sm text-white bg-indigo-600 rounded-md hover:bg-indigo-700">
            ล้างตัวกรอง
          </button>
        </div>
      )}
    </div>
  );
}
