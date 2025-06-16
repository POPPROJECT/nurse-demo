"use client";
import React from "react";
import { FaEdit, FaSort, FaSortDown, FaSortUp, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";
import { useAuth } from "@/app/contexts/AuthContext"; // 1. Import useAuth เพื่อดึง accessToken

// Interface สำหรับข้อมูล Experience Manager
interface Experience_Manager {
  id: number;
  fullName: string;
  email: string;
  status: "ENABLE" | "DISABLE";
}

// 2. ปรับปรุง Props: เพิ่ม accessToken เข้ามา
interface Props {
  data: Experience_Manager[];
  pageIndex: number;
  pageSize: number;
  sortBy: "fullName" | "email";
  sortOrder: "asc" | "desc";
  toggleSortAction: (key: "fullName" | "email") => void;
  handleEditAction: (id: number) => void;
  handleDeleteAction: (id: number) => void;
  setDataAction: React.Dispatch<React.SetStateAction<Experience_Manager[]>>;
}

export default function Experience_ManagerTable({
  data,
  setDataAction,
  pageIndex,
  pageSize,
  sortBy,
  sortOrder,
  toggleSortAction,
  handleEditAction,
  handleDeleteAction,
}: Props) {
  const { accessToken } = useAuth(); // ดึง accessToken จาก Context

  // 3. ปรับปรุง handleStatusChange: ใช้ Bearer Token เพื่อความปลอดภัย
  const handleStatusChange = async (
    id: number,
    newStatus: "ENABLE" | "DISABLE",
  ) => {
    if (!accessToken) {
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
            Authorization: `Bearer ${accessToken}`, // ใช้ Authorization Header
          },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ message: "Update failed" }));
        throw new Error(errorData.message);
      }

      setDataAction((prev) =>
        prev.map((user) =>
          user.id === id ? { ...user, status: newStatus } : user,
        ),
      );
      Swal.fire({
        icon: "success",
        title: "อัปเดตสำเร็จ",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err: any) {
      Swal.fire(
        "เกิดข้อผิดพลาด",
        err.message || "ไม่สามารถเปลี่ยนสถานะได้",
        "error",
      );
    }
  };

  // 4. ใช้ Responsive Layout: ยกเลิก <table> ทั้งหมด
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
      {/* 5. ส่วนของ Header ที่มี Sort */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 rounded-t-lg">
        <div className="col-span-1">ลำดับ</div>
        {(["fullName", "email"] as const).map((key) => (
          <div
            key={key}
            className={`cursor-pointer ${key === "fullName" ? "col-span-5" : "col-span-3"}`}
            onClick={() => toggleSortAction(key)}
          >
            {key === "fullName" ? "ชื่อ-นามสกุล" : "อีเมลผู้ใช้"}{" "}
            {sortBy === key ? (
              sortOrder === "asc" ? (
                <FaSortUp className="inline" />
              ) : (
                <FaSortDown className="inline" />
              )
            ) : (
              <FaSort className="inline text-gray-400" />
            )}
          </div>
        ))}
        <div className="col-span-1 text-center">สถานะ</div>
        <div className="col-span-2 text-center">จัดการ</div>
      </div>

      {/* 6. ส่วนของ Card View บนมือถือ และ Row บนจอใหญ่ */}
      <div className="flex flex-col">
        {data.length > 0 ? (
          data.map((u, i) => (
            <div
              key={u.id}
              className={`flex flex-col md:grid md:grid-cols-12 md:gap-x-4 p-4 md:items-center ${i < data.length - 1 ? "border-b border-gray-200 dark:border-slate-700" : ""}`}
            >
              {/* ส่วนของข้อมูล */}
              <div className="md:col-span-1 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-800 dark:text-gray-200 md:hidden">
                  ลำดับ:{" "}
                </span>
                {pageIndex * pageSize + i + 1}
              </div>
              <div className="md:col-span-5 text-sm text-gray-800 dark:text-gray-200">
                <span className="font-semibold md:hidden">ชื่อ: </span>
                {u.fullName}
              </div>
              <div className="md:col-span-3 text-sm text-gray-800 dark:text-gray-200 break-all">
                <span className="font-semibold md:hidden">อีเมล: </span>
                {u.email}
              </div>

              {/* แถวสำหรับ Action */}
              <div className="flex justify-between items-center mt-4 md:mt-0 md:col-span-3">
                <div className="text-sm">
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

                <div className="flex justify-end items-center gap-2">
                  <button
                    onClick={() => handleEditAction(u.id)}
                    className="p-2 text-white bg-green-600 rounded-full hover:bg-green-800"
                    title="แก้ไขข้อมูล"
                  >
                    <FaEdit size={12} />
                  </button>
                  <button
                    onClick={() => handleDeleteAction(u.id)}
                    className="p-2 text-white bg-red-500 rounded-full hover:bg-red-700"
                    title="ลบบัญชี"
                  >
                    <FaTrash size={12} />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center text-gray-500 dark:text-gray-400">
            ไม่มีข้อมูล
          </div>
        )}
      </div>
    </div>
  );
}
