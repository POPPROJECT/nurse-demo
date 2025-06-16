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
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
      {/* Header (แสดงเฉพาะจอใหญ่) */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 rounded-t-lg">
        <div className="col-span-2">รหัสนิสิต</div>
        <div className="col-span-3">ชื่อ-นามสกุล</div>
        <div className="col-span-3">อีเมล</div>
        <div className="col-span-2 text-center">สถานะ</div>
        <div className="col-span-2 text-center">จัดการ</div>
      </div>

      {/* List of Users (Card on mobile, Row on desktop) */}
      <div className="flex flex-col">
        {data.length > 0 ? (
          data.map((u, index) => (
            <div
              key={u.id}
              className={`grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-3 p-4 items-center ${index < data.length - 1 ? "border-b border-gray-200 dark:border-slate-700" : ""}`}
            >
              {/* Data for mobile view (using labels) */}
              <div className="col-span-2 md:col-span-2 text-sm">
                <span className="font-semibold md:hidden text-gray-800 dark:text-gray-200">
                  รหัสนิสิต:{" "}
                </span>
                <span className="text-gray-800 dark:text-gray-200">
                  {u.studentId || "-"}
                </span>
              </div>
              <div className="col-span-2 md:col-span-3 text-sm">
                <span className="font-semibold md:hidden text-gray-800 dark:text-gray-200">
                  ชื่อ:{" "}
                </span>
                <span className="text-gray-800 dark:text-gray-200">
                  {u.fullName}
                </span>
              </div>
              <div className="col-span-2 md:col-span-3 text-sm">
                <span className="font-semibold md:hidden text-gray-800 dark:text-gray-200">
                  อีเมล:{" "}
                </span>
                <span className="text-gray-800 dark:text-gray-200 break-all">
                  {u.email}
                </span>
              </div>

              {/* Status dropdown */}
              <div className="col-span-1 md:col-span-2 text-sm text-center">
                <select
                  value={u.status}
                  onChange={(e) =>
                    handleStatusChange(
                      u.id,
                      e.target.value as "ENABLE" | "DISABLE",
                    )
                  }
                  className={`w-full md:w-auto px-2 py-1 border rounded text-xs font-medium ${u.status === "ENABLE" ? "bg-green-100 text-green-800 border-green-300 dark:bg-green-700 dark:text-green-100 dark:border-green-500" : "bg-red-100 text-red-800 border-red-300 dark:bg-red-700 dark:text-red-100 dark:border-red-500"}`}
                >
                  <option value="ENABLE">เปิดใช้งาน</option>
                  <option value="DISABLE">ปิดใช้งาน</option>
                </select>
              </div>

              {/* Action buttons */}
              <div className="col-span-1 md:col-span-2 flex justify-end md:justify-center items-center gap-1">
                <button
                  onClick={() =>
                    router.push(
                      `/admin/check-student/${u.id}?name=${encodeURIComponent(u.fullName)}`,
                    )
                  }
                  className="p-2 text-white bg-blue-500 rounded-full hover:bg-blue-600"
                  title="ตรวจสอบความคืบหน้า"
                >
                  <FaEye size={12} />
                </button>
                <button
                  onClick={() => handleEditClick(u.id)}
                  className="p-2 text-white bg-green-600 rounded-full hover:bg-green-800"
                  title="แก้ไขข้อมูล"
                >
                  <FaEdit size={12} />
                </button>
                <button
                  onClick={() => deleteUserAction(u.id)}
                  className="p-2 text-white bg-red-500 rounded-full hover:bg-red-700"
                  title="ลบบัญชี"
                >
                  <FaTrash size={12} />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            ไม่มีข้อมูลนิสิต
          </div>
        )}
      </div>
    </div>
  );
}
