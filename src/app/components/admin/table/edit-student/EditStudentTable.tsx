"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import TableSearchBar from "./TableSearchBar";
import TableDisplay from "./TableDisplay";
import TablePagination from "./TablePagination";
import { useAuth } from "@/app/contexts/AuthContext";
import axios from "axios";

interface User {
  id: number;
  studentId: string;
  fullName: string;
  email: string;
  status: "ENABLE" | "DISABLE";
}

// ✅ ไม่จำเป็นต้องรับ accessToken เป็น Prop แล้ว ถ้าจะใช้จาก Context โดยตรง
export default function EditStudentTable() {
  const { accessToken } = useAuth(); // ✅ 2. ดึง accessToken จาก Context
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true); // ✅ เพิ่ม Loading state
  const [error, setError] = useState<string | null>(null); // ✅ เพิ่ม Error state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"fullName" | "email" | "studentId">(
    "studentId",
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [pageIndex, setPageIndex] = useState(0);
  const [perPage, setPerPage] = useState(10);
  // const [page, setPage] = useState(1); // page state อาจจะไม่จำเป็น

  // ✅ สร้าง Axios instance ที่มี Authorization header (ถ้าไม่ได้ใช้ instance กลาง)
  // หรือจะสร้าง authHeader object เพื่อใช้กับ fetch ก็ได้
  const api = useMemo(() => {
    if (!accessToken) return null;
    return axios.create({
      baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }, [accessToken]);

  const fetchStudents = useCallback(async () => {
    // ✅ เปลี่ยนชื่อฟังก์ชันให้สื่อความหมาย
    if (!api) {
      // ✅ ถ้า api instance ยังไม่ได้ถูกสร้าง (เพราะไม่มี accessToken)
      setError("Authentication token not available.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/users?role=STUDENT"); // ✅ ใช้ api instance
      setUsers(
        res.data.map((u: any) => ({
          id: u.id,
          studentId: u.studentProfile?.studentId ?? "",
          fullName: u.name, // Backend ส่ง name
          email: u.email,
          status: u.status ?? "ENABLE",
        })),
      );
    } catch (err: any) {
      console.error("Error fetching students:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to load student data.",
      );
      Swal.fire("ผิดพลาด", "โหลดข้อมูลนิสิตไม่สำเร็จ", "error");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [api]); // ✅ Dependency คือ api instance

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]); // ✅ เรียก fetchStudents เมื่อ Component mount หรือ api instance เปลี่ยน

  const deleteUser = async (id: number) => {
    if (!api) {
      // ตรวจสอบ api instance (ซึ่งสร้างจาก accessToken)
      Swal.fire(
        "ข้อผิดพลาด",
        "Session หมดอายุหรือไม่พบ Authentication Token",
        "error",
      );
      return;
    }

    const confirmResult = await Swal.fire({
      title: "ยืนยันการลบ?",
      text: "คุณแน่ใจหรือไม่ว่าต้องการลบบัญชีผู้ใช้นี้?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "ลบบัญชี",
      cancelButtonText: "ยกเลิก",
    });

    if (confirmResult.isConfirmed) {
      try {
        // ใช้ api instance ที่มี Authorization header อยู่แล้ว
        const res = await api.delete(`/users/${id}`);

        // ไม่จำเป็นต้องเช็ค res.ok ถ้า axios ไม่โยน error ออกมา แสดงว่าสำเร็จ
        // axios จะโยน error โดยอัตโนมัติถ้า status code เป็น 4xx หรือ 5xx

        setUsers((currentUsers) =>
          currentUsers.filter((user) => user.id !== id),
        );
        Swal.fire("ลบสำเร็จ!", "ผู้ใช้ถูกลบออกจากระบบเรียบร้อยแล้ว", "success");
      } catch (err: any) {
        console.error("Error deleting user:", err);
        Swal.fire(
          "เกิดข้อผิดพลาด!",
          err.response?.data?.message ||
            "ไม่สามารถลบผู้ใช้ได้ กรุณาลองใหม่อีกครั้ง",
          "error",
        );
      }
    }
  };

  const filtered = useMemo(() => {
    const f = search.toLowerCase();
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(f) ||
        u.email.toLowerCase().includes(f),
    );
  }, [users, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let va = a[sortBy];
      let vb = b[sortBy];

      if (sortBy === "studentId") {
        // ถ้า studentId เป็นตัวเลขใน string ให้แปลงเป็นตัวเลขก่อนเปรียบเทียบ
        return sortOrder === "asc"
          ? Number(va) - Number(vb)
          : Number(vb) - Number(va);
      }

      // fullName, email → ใช้ localeCompare
      const cmp = va.toLowerCase().localeCompare(vb.toLowerCase(), "th", {
        numeric: true,
      });
      return sortOrder === "asc" ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.ceil(sorted.length / perPage) || 1;
  const paged = useMemo(() => {
    const start = pageIndex * perPage;
    return sorted.slice(start, start + perPage);
  }, [sorted, pageIndex, perPage]);

  const toggleSort = (col: "fullName" | "email") => {
    if (sortBy === col) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(col);
      setSortOrder("asc");
    }
    setPageIndex(0);
  };

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    const cur = pageIndex + 1;
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (cur > 3) pages.push("...");
      for (
        let i = Math.max(2, cur - 1);
        i <= Math.min(totalPages - 1, cur + 1);
        i++
      )
        pages.push(i);
      if (cur < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };
  // ✅ แสดง Loading หรือ Error UI
  if (loading)
    return <div className="p-10 text-center">Loading students...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  // AdminLayout ควรจะป้องกันแล้ว แต่ถ้ามาถึงได้โดยไม่มี accessToken ใน Context
  if (!accessToken) {
    return (
      <div className="p-10 text-center text-orange-500">
        Authentication token is missing. Please try logging in again.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {" "}
      {/* ลด p-4 ถ้าหน้าแม่มี p-6/p-8 แล้ว */}
      <TableSearchBar
        search={search}
        setSearchAction={setSearch}
        perPage={perPage}
        setPerPageAction={(n) => {
          setPerPage(n);
          setPageIndex(0);
        }}
        setPageAction={(n) => setPageIndex(n - 1)} // แก้ไข setPage ให้ใช้ setPageIndex
        totalCount={sorted.length} // ควรใช้ sorted.length หรือ users.length ถ้าไม่มี client-side filter มากนัก
        filteredCount={filtered.length}
      />
      {/* ✅ ส่ง accessToken ไปให้ TableDisplay ถ้า TableDisplay ยังต้องใช้ */}
      <TableDisplay
        data={paged}
        setDataAction={setUsers}
        deleteUserAction={deleteUser}
        accessToken={accessToken} // ส่ง accessToken ต่อไป
      />
      <div className="text-sm text-gray-600 dark:text-gray-300">
        แสดง {paged.length} จาก {filtered.length} รายการ (ทั้งหมด {users.length}{" "}
        รายการ)
      </div>
      <TablePagination
        pageIndex={pageIndex}
        setPageIndexAction={setPageIndex}
        totalPages={totalPages}
        getPageNumbersAction={getPageNumbers}
      />
    </div>
  );
}
