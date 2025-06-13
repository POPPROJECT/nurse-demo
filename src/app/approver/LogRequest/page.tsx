"use client";

import React, { useCallback, useEffect, useState } from "react"; // ✅ เพิ่ม useCallback
import axios from "axios";
import FilterBar from "@/app/components/approver/LogRequest/FilterBar"; // ตรวจสอบ Path
import LogTable from "@/app/components/approver/LogRequest/LogTable"; // ตรวจสอบ Path
import Pagination from "@/app/components/approver/LogRequest/Pagination"; // ตรวจสอบ Path
import { useAuth } from "@/app/contexts/AuthContext";
import { ExperienceStatus } from "lib/type";

interface LogTableRecord {
  id: number;
  student: { studentId: string; user: { name: string } };
  course: string;
  subCourse: string;
  status: ExperienceStatus; // หรือ Type ที่ถูกต้องสำหรับ status นี้
  createdAt: string; // หรือ Date
  // เพิ่ม field อื่นๆ ที่ LogTable ต้องการ หรือ API ส่งมา
  // ตัวอย่าง:
  // action?: string;
  // description?: string;
  // userName?: string;
}

interface FetchLogResponse {
  data: LogTableRecord[];
  total: number;
}

export default function LogRequestPage() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const { accessToken, session: authSession } = useAuth(); // ✅ ดึง accessToken และ session จาก Context

  const [data, setData] = useState<LogTableRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "confirmed" | "cancel">("all"); // ถ้า Backend รองรับการ Filter ตาม Status
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  // const [startDate, setStartDate] = useState<string | undefined>(); // ถ้าจะใช้ Filter ตามวันที่
  // const [endDate, setEndDate] = useState<string | undefined>(); // ถ้าจะใช้ Filter ตามวันที่

  const [loading, setLoading] = useState(true); // ✅ เพิ่ม state สำหรับ loading
  const [error, setError] = useState<string | null>(null); // ✅ เพิ่ม state สำหรับ error

  // ✅ ใช้ useCallback สำหรับ fetchLogs
  const fetchLogs = useCallback(async () => {
    if (!accessToken) {
      // ถ้ายังไม่มี accessToken (อาจจะกำลังโหลดจาก AuthProvider) ให้รอ
      // AdminLayout/ApproverLayout ควรจะจัดการเรื่อง Redirect ถ้าไม่มี Session จริงๆ
      console.log("[LogRequestPage] No accessToken yet, waiting...");
      setError("Waiting for session..."); // ตั้ง error ชั่วคราว หรือไม่ทำอะไรเลยก็ได้
      setLoading(false); // อาจจะยังไม่ต้อง setLoading(false) ทันทีถ้าคาดว่า token จะมาเร็วๆ นี้
      return;
    }

    setLoading(true);
    setError(null);
    console.log("[LogRequestPage] Fetching logs with token...");
    try {
      const params: any = {
        page,
        limit,
        sortBy,
        order,
      };
      if (search) params.search = search;
      if (status !== "all") params.status = status;
      // if (startDate) params.startDate = startDate;
      // if (endDate) params.endDate = endDate;

      const res = await axios.get<FetchLogResponse>( // ✅ ใช้ Generic Type
        `${BASE}/approver/log-requests`, // Endpoint ของคุณ
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        },
      );
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err: any) {
      console.error("Error fetching logs:", err);
      setError(
        err.response?.data?.message || err.message || "Failed to load logs.",
      );
      setData([]); // เคลียร์ข้อมูลเก่าถ้าโหลดใหม่ไม่สำเร็จ
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [
    accessToken,
    page,
    limit,
    search,
    status,
    sortBy,
    order /*, startDate, endDate*/,
    BASE,
  ]); // ✅ เพิ่ม BASE เข้า dependency array

  useEffect(() => {
    // เรียก fetchLogs เมื่อ accessToken พร้อมใช้งาน หรือ dependencies อื่นๆ เปลี่ยนแปลง
    if (accessToken) {
      // เรียก fetchLogs ก็ต่อเมื่อมี accessToken แล้วเท่านั้น
      fetchLogs();
    } else if (authSession === null && accessToken === null) {
      // กรณีที่ AuthProvider โหลดเสร็จแล้ว และยืนยันว่าไม่มี session
      setLoading(false);
      setError("Session not found or expired. Please login again.");
    }
    // ถ้า authSession กำลังโหลด หรือ accessToken เป็น undefined (ยังไม่ถูก set จาก null)
    // อาจจะยังไม่ต้องทำอะไร รอให้ AuthProvider อัปเดตก่อน
  }, [fetchLogs, accessToken, authSession]); // ✅ ใช้ fetchLogs ที่สร้างจาก useCallback

  // ✅ แสดงสถานะ Loading และ Error
  if (loading && data.length === 0)
    return <div className="p-10 text-center">Loading log data...</div>;
  if (error)
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  // ถ้า ApproverLayout ป้องกันเส้นทางแล้ว ส่วนนี้อาจจะไม่จำเป็น
  if (!authSession?.user && !loading) {
    return (
      <div className="p-10 text-center">
        User session not available. Please{" "}
        <a href="/" className="underline">
          login
        </a>
        .
      </div>
    );
  }

  return (
    <div className="container max-w-6xl px-4 py-8 mx-auto mt-10 sm:mt-0">
      <div className="p-6 mb-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] dark:bg-[#1E293B] rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out hover:-translate-y-1 ">
        <h1 className="text-xl font-semibold sm:text-2xl">ประวัติการอนุมัติ</h1>
      </div>
      <FilterBar
        search={search}
        setSearchAction={(v) => {
          setSearch(v);
          setPage(1);
        }}
        status={status}
        setStatusAction={(v) => {
          setStatus(v);
          setPage(1);
        }}
        sortBy={sortBy}
        order={order}
        setSortAction={(by, ord) => {
          setSortBy(by);
          setOrder(ord);
          setPage(1);
        }}
        limit={limit}
        setLimitAction={(n) => {
          setLimit(n);
          setPage(1);
        }}
        // startDate={startDate} // ถ้าใช้
        // setStartDate={(d) => { setStartDate(d); setPage(1); }} // ถ้าใช้
        // endDate={endDate} // ถ้าใช้
        // setEndDate={(d) => { setEndDate(d); setPage(1); }} // ถ้าใช้
      />
      {loading && data.length > 0 && (
        <div className="p-4 text-center">Updating data...</div>
      )}
      <LogTable data={data} />
      <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
        แสดง {data.length > 0 ? (page - 1) * limit + 1 : 0} -{" "}
        {Math.min(page * limit, total)} จาก {total} รายการ
      </div>
      <Pagination
        page={page}
        totalPages={Math.ceil(total / limit)}
        setPageAction={setPage}
      />
    </div>
  );
}
