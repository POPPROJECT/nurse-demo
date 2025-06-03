import React from 'react';
import { FaCheck, FaTimes } from 'react-icons/fa';
interface FieldValue {
  field: { label: string };
  value: string;
}
interface Experience {
  id: number;
  course: string;
  subCourse: string;
  studentProfile: {
    studentId: string; // ← ต้องมี property นี้
    user: { name: string };
  };
  fieldValues: FieldValue[];
  createdAt: string;
}

type Props = {
  req: Experience;
  selected: boolean;
  onCheck: (checked: boolean) => void;
  onConfirm: () => void;
  onReject: () => void;
};

export default function RequestCard({
  req,
  selected,
  onCheck,
  onConfirm,
  onReject,
}: Props) {
  return (
    <div className="relative bg-white dark:bg-[#1E293B] hover:-translate-y-1 hover:shadow-lg   transition-all  dark:text-white rounded-xl shadow  overflow-hidden">
      <div className="absolute top-4 left-4 ">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onCheck(e.target.checked)}
          className="w-5 h-5 border-gray-300 rounded "
        />
      </div>
      <div className="p-6 mt-4">
        <h3 className="text-base sm:text-lg font-semibold  text-[#f46b45]">
          {req.studentProfile?.user?.name || 'ไม่พบชื่อ'} (รหัสนิสิต{' '}
          {req.studentProfile?.studentId || 'ไม่พบรหัสนิสิต'})
        </h3>

        <div className="grid grid-cols-1 mb-4 sm:grid-cols-2 lg:grid-cols-3 gap-y-2 gap-x-6">
          <div className="flex items-start">
            <span className="text-gray-600 dark:text-gray-300">หมวดหมู่:</span>
            <span className="ml-1 font-medium ">{req.course}</span>
          </div>
          <div className="flex items-start">
            <span className="text-gray-600 dark:text-gray-300">
              หมวดหมู่ย่อย:
            </span>
            <span className="ml-1 font-medium ">{req.subCourse}</span>
          </div>
          {req.fieldValues.map((fv, i) => (
            <div key={i} className="flex items-start">
              <span className="text-gray-600 dark:text-gray-300">
                {fv.field.label}:
              </span>
              <span className="ml-1 font-medium ">{fv.value}</span>
            </div>
          ))}
        </div>
        <div className="mt-1 mb-1 text-gray-400">
          <span className="text-gray-400 ">วันที่ส่งข้อมูล:</span>
          <span className="ml-1 text-gray-400">
            {new Date(req.createdAt).toLocaleDateString('th')}
          </span>
        </div>
        <div className="flex justify-end pt-4 mt-4 space-x-2 border-t">
          <button
            onClick={onConfirm}
            className="flex items-center justify-center p-2 space-x-2 text-green-600 rounded-lg bg-green-50 hover:bg-green-100" // เพิ่ม flex, items-center, justify-center, space-x-2
          >
            <FaCheck className="w-5 h-5" /> {/* ใส่ icon FaCheck */}
            <span>ยืนยัน</span>
          </button>
          <button
            onClick={onReject}
            className="flex items-center justify-center p-2 space-x-2 text-red-600 rounded-lg bg-red-50 hover:bg-red-100" // เพิ่ม flex, items-center, justify-center, space-x-2
          >
            <FaTimes className="w-5 h-5" /> {/* ใส่ icon FaTimes */}
            <span>ปฏิเสธ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
