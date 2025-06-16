"use client";

import { useRouter } from "next/navigation";
import React from "react";
import { FaEdit, FaSort, FaSortDown, FaSortUp, FaTrash } from "react-icons/fa";
import Swal from "sweetalert2";

interface Approver {
  id: number;
  fullName: string;
  email: string;
  status: "ENABLE" | "DISABLE";
}

interface Props {
  data: Approver[];
  pageIndex: number;
  pageSize: number;
  sortBy: "fullName" | "email";
  sortOrder: "asc" | "desc";
  toggleSortAction: (key: "fullName" | "email") => void;
  handleEditAction: (id: number) => void;
  handleDeleteAction: (id: number) => void;
  setDataAction: React.Dispatch<React.SetStateAction<Approver[]>>;
  accessToken: string | null;
}

export default function ApproverTable({
  data,
  setDataAction,
  pageIndex,
  pageSize,
  sortBy,
  sortOrder,
  toggleSortAction,
  handleEditAction,
  handleDeleteAction,
  accessToken,
}: Props) {
  const router = useRouter();

  const handleStatusChange = async (
    id: number,
    newStatus: "ENABLE" | "DISABLE",
  ) => {
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

      if (!res.ok) throw new Error("Update failed");

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
    } catch (err) {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถเปลี่ยนสถานะได้", "error");
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md">
      {/* Header (แสดงเฉพาะจอใหญ่) */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-6 py-3 font-semibold text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 rounded-t-lg">
        <div className="col-span-1">ลำดับ</div>
        {/* 5. สร้าง Header แบบไดนามิกพร้อมฟังก์ชัน Sort (จากโค้ดเดิม) */}
        {(["fullName", "email"] as const).map((key) => (
          <div
            key={key}
            className={`cursor-pointer ${key === "fullName" ? "col-span-5" : "col-span-3"}`}
            onClick={() => toggleSortAction(key)}
          >
            {key === "fullName" ? "ชื่อ-นามสกุล" : "อีเมล"}{" "}
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

      {/* List of Users (Card on mobile) */}
      <div className="flex flex-col">
        {data.length > 0 ? (
          data.map((u, i) => (
            <div
              key={u.id}
              className={`grid grid-cols-2 md:grid-cols-12 gap-x-4 gap-y-3 p-4 items-center ${i < data.length - 1 ? "border-b border-gray-200 dark:border-slate-700" : ""}`}
            >
              {/* --- Data for mobile view --- */}
              <div className="col-span-2 md:col-span-1 text-sm">
                <span className="font-semibold md:hidden dark:text-gray-200">
                  ลำดับ:
                </span>
                <span className="text-gray-600 dark:text-gray-200">
                  {pageIndex * pageSize + i + 1}
                </span>
              </div>
              <div className="col-span-2 md:col-span-5 text-sm">
                <span className="font-semibold md:hidden dark:text-gray-200">
                  ชื่อ:
                </span>
                <span className="text-gray-800 dark:text-gray-200">
                  {u.fullName}
                </span>
              </div>
              <div className="col-span-2 md:col-span-3 text-sm">
                <span className="font-semibold md:hidden dark:text-gray-200">
                  อีเมล:
                </span>
                <span className="text-gray-800 dark:text-gray-200 break-all">
                  {u.email}
                </span>
              </div>

              {/* Status dropdown */}
              <div className="col-span-1 text-sm text-center">
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
              <div className="col-span-1 md:col-span-2 flex justify-end md:justify-center items-center gap-2">
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
