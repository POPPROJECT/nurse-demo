// components/admin/table/edit-student/TableDisplay.tsx (หรือ Path ที่ถูกต้องของคุณ)
"use client";
import React from "react";
import { FaEdit, FaEye, FaTrash } from "react-icons/fa";
import { useRouter } from "next/navigation"; // ถ้ายังจำเป็นต้องใช้
import Swal from "sweetalert2";
// ✅ ถ้าจะใช้ AuthContext โดยตรงใน Component นี้
// import { useAuth } from '@/contexts/AuthContext';

interface User {
  id: number;
  studentId: string; // studentId ควรจะเป็น string ถ้ามาจาก DB โดยตรง หรือ number ถ้ามีการแปลง
  fullName: string;
  email: string;
  status: "ENABLE" | "DISABLE";
}

interface Props {
  data: User[];
  setDataAction: React.Dispatch<React.SetStateAction<User[]>>;
  deleteUserAction: (id: number) => Promise<void>; // ควรจะเป็น Promise<void> ถ้า deleteUser เป็น async
  accessToken: string | null; // ✅ รับ accessToken เป็น Prop
  // handleEdit: (id: number) => void; // ถ้ามีฟังก์ชันนี้ส่งมาจาก EditStudentTable
}

export default function TableDisplay({
  data,
  setDataAction,
  deleteUserAction,
  accessToken,
}: Props) {
  const router = useRouter();
  // const { accessToken: contextAccessToken } = useAuth(); // หรือดึงจาก Context โดยตรง
  // const tokenToUse = accessToken || contextAccessToken; // เลือกใช้ Token จาก Prop หรือ Context

  const handleStatusChange = async (
    id: number,
    newStatus: "ENABLE" | "DISABLE",
  ) => {
    if (!accessToken) {
      // ✅ ตรวจสอบว่ามี accessToken ก่อน
      Swal.fire("ข้อผิดพลาด", "Authentication Token ไม่พร้อมใช้งาน", "error");
      return;
    }

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/users/${id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`, // ✅ ใช้ Authorization header
          },
          // credentials: 'include', // ไม่จำเป็นแล้ว
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!res.ok) {
        let errorMessage = "ไม่สามารถเปลี่ยนสถานะได้";
        try {
          const errorData = await res.json();
          errorMessage = errorData.message || `เกิดข้อผิดพลาด: ${res.status}`;
        } catch (e) {
          errorMessage = `เกิดข้อผิดพลาด: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // ✅ อัปเดต state หลักให้แสดงผลทันที
      setDataAction((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, status: newStatus } : user,
        ),
      );

      Swal.fire({
        icon: "success",
        title: "อัปเดตสำเร็จ",
        text: `สถานะบัญชีถูกเปลี่ยนเป็น ${
          newStatus === "ENABLE" ? "เปิดใช้งาน" : "ปิดใช้งาน"
        }`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      console.error("Error changing status:", err);
      Swal.fire(
        "เกิดข้อผิดพลาด",
        err.message || "ไม่สามารถเปลี่ยนสถานะได้",
        "error",
      );
    }
  };

  // ฟังก์ชันสำหรับ Edit (ถ้าปุ่ม Edit อยู่ใน TableDisplay โดยตรง)
  const handleEditClick = (userId: number) => {
    // สมมติว่า Path สำหรับแก้ไข Student คือ /admin/edituser/student/[id]
    router.push(`/admin/edituser/student/${userId}`);
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
                    ? "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-600"
                    : "bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-500"
                }
              >
                <td className="px-6 py-4 text-sm text-gray-800 dark:text-gray-200">
                  {u.studentId || "-"} {/* แสดง - ถ้าไม่มี studentId */}
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
                        e.target.value as "ENABLE" | "DISABLE",
                      )
                    }
                    className={`px-2 py-1 border rounded text-sm font-medium
                      ${
                        u.status === "ENABLE"
                          ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-700 dark:text-green-100 dark:border-green-500"
                          : "bg-red-100 text-red-800 border-red-300 dark:bg-red-700 dark:text-red-100 dark:border-red-500"
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
                          u.fullName,
                        )}`,
                      )
                    }
                    className="px-3 py-1 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
                    title="ตรวจสอบความคืบหน้า"
                  >
                    <FaEye className="inline mr-1" /> ตรวจสอบ
                  </button>
                  <button
                    // onClick={() => handleEdit(u.id)} // ถ้า handleEdit มาจาก Prop
                    onClick={() => handleEditClick(u.id)} // หรือเรียกฟังก์ชันใน Component นี้
                    className="px-3 py-1 text-sm text-white bg-green-600 rounded hover:bg-green-800"
                    title="แก้ไขข้อมูล"
                  >
                    <FaEdit className="inline mr-1" /> แก้ไข
                  </button>
                  <button
                    onClick={() => deleteUserAction(u.id)}
                    className="px-3 py-1 text-sm text-white bg-red-500 rounded hover:bg-red-700"
                    title="ลบบัญชี"
                  >
                    <FaTrash className="inline mr-1" /> ลบ
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={5}
                className="py-8 text-center text-gray-500 dark:text-gray-400"
              >
                ไม่มีข้อมูล
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
