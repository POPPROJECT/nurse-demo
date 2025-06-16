"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import FilterBar from "@/app/components/approver/LogRequest/FilterBar";
import LogTable from "@/app/components/approver/LogRequest/LogTable";
import Pagination from "@/app/components/approver/LogRequest/Pagination";
import { useAuth } from "@/app/contexts/AuthContext";
import { ExperienceStatus } from "lib/type";

// ... (Interface LogTableRecord และ FetchLogResponse เหมือนเดิม) ...
interface LogTableRecord {
  id: number;
  student: { studentId: string; user: { name: string } };
  course: string;
  subCourse: string;
  status: ExperienceStatus;
  createdAt: string;
}

interface FetchLogResponse {
  data: LogTableRecord[];
  total: number;
}

export default function LogRequestPage() {
  const BASE = process.env.NEXT_PUBLIC_BACKEND_URL!;
  const { accessToken } = useAuth();
  const [data, setData] = useState<LogTableRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "CONFIRMED" | "CANCEL">("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [order, setOrder] = useState<"asc" | "desc">("desc");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: any = { page, limit, sortBy, order };
      if (search) params.search = search;
      if (status !== "all") params.status = status;

      const res = await axios.get<FetchLogResponse>(
        `${BASE}/approver/log-requests`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params,
        },
      );
      setData(res.data.data);
      setTotal(res.data.total);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load logs.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, limit, search, status, sortBy, order, BASE]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  if (loading && data.length === 0) {
    return <div className="p-10 text-center">กำลังโหลดข้อมูล...</div>;
  }
  if (error) {
    return <div className="p-10 text-center text-red-500">Error: {error}</div>;
  }

  return (
    // 1. ใช้โครงสร้าง Layout ที่ถูกต้อง
    <div className="w-full p-4 md:p-6">
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="p-6 text-white bg-[linear-gradient(to_right,#f46b45_0%,#eea849_100%)] rounded-xl shadow-lg">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">ประวัติการอนุมัติ</h1>
            </div>
          </div>
        </header>

        {/* Content Card */}
        <div className="p-4 sm:p-6 bg-white dark:bg-[#1E293B] rounded-xl shadow-lg">
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
            limit={limit}
            setLimitAction={(n) => {
              setLimit(n);
              setPage(1);
            }}
          />
          {loading && (
            <div className="p-4 text-center text-gray-500">
              กำลังอัปเดตข้อมูล...
            </div>
          )}
          <LogTable data={data} />
          <Pagination
            page={page}
            totalPages={Math.ceil(total / limit)}
            setPageAction={setPage}
            totalItems={total}
            pageSize={limit}
          />
        </div>
      </div>
    </div>
  );
}
