'use client';

import { ExperienceStatus } from 'lib/type';
import React from 'react';

type Record = {
  id: number;
  student: { studentId: string; user: { name: string } };
  course: string;
  subCourse: string;
  status: ExperienceStatus;
  createdAt: string;
};

type Props = {
  data: Record[];
};

export default function LogTable({ data }: Props) {
  return (
    <div className="overflow-auto">
      <table className="w-full shadow min-w-max whitespace-nowrap dark:bg-gray-500">
        <thead className="bg-gray-400 dark:bg-gray-800 dark:text-white">
          <tr>
            {[
              'รหัสนิสิต',
              'ชื่อ-นามสกุล',
              'หมวดหมู่',
              'หมวดหมู่ย่อย',
              'วันที่',
              'สถานะ',
            ].map((h, i) => (
              <th
                key={i}
                className="px-6 py-2 text-base font-medium text-left text-gray-800 uppercase dark:text-white"
              >
                <strong>{h}</strong>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-500">
          {data.map(
            (
              r,
              index // Add index to the map function
            ) => (
              <tr
                key={r.id}
                className={`${
                  index % 2 === 0
                    ? 'bg-gray-200 dark:bg-gray-500'
                    : 'bg-gray-300 dark:bg-gray-600'
                } hover:bg-gray-50 dark:hover:bg-gray-700`}
              >
                <td className="px-6 py-2 text-base">{r.student.studentId}</td>
                <td className="px-6 py-2 text-base">{r.student.user.name}</td>
                <td className="px-6 py-2 text-base">{r.course}</td>
                <td className="px-6 py-2 text-base">{r.subCourse}</td>
                <td className="px-6 py-2 text-base">
                  {new Date(r.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-2 text-base">
                  {r.status === 'CONFIRMED' ? (
                    <span className="">ยืนยัน</span>
                  ) : (
                    <span className="">ปฏิเสธ</span>
                  )}
                </td>
              </tr>
            )
          )}
        </tbody>
      </table>
    </div>
  );
}
