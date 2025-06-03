'use client';
import React from 'react';
import { FaEdit, FaEye, FaTrash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import Swal from 'sweetalert2';

interface User {
  id: number;
  studentId: string;
  fullName: string;
  email: string;
  status: 'ENABLE' | 'DISABLE';
}

interface Props {
  data: User[];
  setData: React.Dispatch<React.SetStateAction<User[]>>;
  deleteUser: (id: number) => void;
}

export default function TableDisplay({ data, setData, deleteUser }: Props) {
  const router = useRouter();

  const handleStatusChange = async (
    id: number,
    newStatus: 'ENABLE' | 'DISABLE'
  ) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ status: newStatus }),
        }
      );

      if (!res.ok) throw new Error('Update failed');

      setData((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, status: newStatus } : user
        )
      );

      Swal.fire({
        icon: 'success',
        title: 'อัปเดตสำเร็จ',
        text: `สถานะบัญชีถูกเปลี่ยนเป็น ${
          newStatus === 'ENABLE' ? 'เปิดใช้งาน' : 'ปิดใช้งาน'
        }`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire('เกิดข้อผิดพลาด', 'ไม่สามารถเปลี่ยนสถานะได้', 'error');
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full bg-white rounded shadow table-auto dark:bg-gray-800 dark:text-gray-200">
        <thead className="bg-gray-200 dark:bg-gray-700">
          <tr>
            <th className="px-6 py-3 text-sm text-left text-gray-700 dark:text-gray-200">
              รหัสนิสิต
            </th>
            <th className="px-6 py-3 text-sm text-left text-gray-700 dark:text-gray-200">
              ชื่อ-นามสกุล
            </th>
            <th className="px-6 py-3 text-sm text-left text-gray-700 dark:text-gray-200">
              อีเมล
            </th>
            <th className="px-6 py-3 text-sm text-center text-gray-700 dark:text-gray-200">
              สถานะบัญชี
            </th>
            <th className="px-6 py-3 text-sm text-center text-gray-700 dark:text-gray-200">
              จัดการ
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {data.length > 0 ? (
            data.map((u, i) => (
              <tr
                key={u.id}
                className={
                  i % 2 === 0
                    ? 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600'
                    : 'bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-500'
                }
              >
                <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                  {u.studentId}
                </td>
                <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                  {u.fullName}
                </td>
                <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                  {u.email}
                </td>
                <td className="px-6 py-4 text-sm text-center text-gray-800">
                  <select
                    value={u.status}
                    onChange={(e) =>
                      handleStatusChange(
                        u.id,
                        e.target.value as 'ENABLE' | 'DISABLE'
                      )
                    }
                    className={`px-2 py-1 border rounded text-sm font-medium
                      ${
                        u.status === 'ENABLE'
                          ? 'bg-green-100 text-green-800 border-green-300'
                          : 'bg-red-100 text-red-800 border-red-300'
                      }`}
                  >
                    <option value="ENABLE">เปิดใช้งาน</option>
                    <option value="DISABLE">ปิดใช้งาน</option>
                  </select>
                </td>
                <td className="px-6 py-4 space-x-2 text-center">
                  <button
                    onClick={() =>
                      router.push(
                        `/admin/check-student/${u.id}?name=${encodeURIComponent(
                          u.fullName
                        )}`
                      )
                    }
                    className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                  >
                    <FaEye className="inline mr-1" /> ตรวจสอบ
                  </button>
                  <button
                    onClick={() =>
                      router.push(`/admin/edituser/student/${u.id}`)
                    }
                    className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-800"
                  >
                    <FaEdit className="inline mr-1" /> แก้ไข
                  </button>
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-700"
                  >
                    <FaTrash className="inline mr-1" /> ลบ
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-500">
                ไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
